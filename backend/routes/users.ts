import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { sign } from 'hono/jwt'
import { signinInput,signupInput } from '../node_modules/blog_app_common/dist/index'
const user = new Hono<{
    Bindings: {
        DATABASE_URL: string,
        hashPassword: KVNamespace,
        JWT_SECRET: string
    }
}>();


async function hashPassword(password: string) {
    const encoder = new TextEncoder()
    const data = encoder.encode(password)

    const hashBuffer = await crypto.subtle.digest({ name: 'SHA-256' }, data)
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex;

}
user.post('/signup', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const body = await c.req.json();

    const { success } = signupInput.safeParse(body)

    if(!success){
        c.status(400)
        return c.json({error:"please enter correct inputs"})
    }

    try {
        const duplicacyCheck = await prisma.user.findUnique({
            where: {
                email: body.email
            }
        })
        if (duplicacyCheck) {
            c.status(409); // Conflict
            return c.json({ error: "User with this user email already exists" });
        }
        const hashedPassword = await hashPassword(body.password);
        console.log("password hashed")
        const userKey = `user:${body.email}`
        await c.env.hashPassword.put(userKey, JSON.stringify({
            email: body.email,
            password: hashedPassword
        }
        ))
        console.log("kept in kv")
        const user = await prisma.user.create({
            data: {
                email: body.email,
                name: body.name,
                password: hashedPassword
            }
        })
        console.log("user created")
        console.log("JWT_SECRET:", c.env.JWT_SECRET);
        console.log(c.env)

        const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
        return c.json({ jwt });

    } catch (e) {
        c.status(403);
        return c.json({ error: "error while signing up" });
    }

})

user.post('/signin', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate())

    const body = await c.req.json();

    const { success } = signinInput.safeParse(body)

    if(!success){
        c.status(400)
        return c.json({error:"please enter correct inputs"})
    }

    try {
        const user = await prisma.user.findUnique({
            where: {
                email: body.email
            }

        })
        console.log("CHECKED DB")
        if (!user) {
            c.status(403);
            return c.json({ error: "user not found" });
        }
        console.log("USER FOUND")
       
        
        const hashedEnteredPassword = await hashPassword(body.password);

        // Compare the hashed password with the stored password
        if (hashedEnteredPassword === user.password) {
            const jwt = await sign({ id: user.id }, c.env.JWT_SECRET);
            return c.json({ jwt });
        } else {
            c.status(403);
            return c.json({ error: "Invalid password" });
        }



    }
    catch (e) {
        c.status(403);
        return c.json({ error: "user not found" });
    }
}
)
export default user;
