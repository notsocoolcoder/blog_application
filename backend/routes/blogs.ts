import { Hono } from "hono";
import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { verify } from "hono/jwt";
import { createPostInput,updatePostInput } from "blog_app_common/dist";
const blog = new Hono<{
    Bindings: {
        DATABASE_URL: string,
        JWT_SECRET: string
    }
    Variables: {
        userId: string
    }
}>()

blog.use('/*', async (c, next) => {
    try {
        const jwt = c.req.header('authorization')
        if (!jwt) {
            c.status(403)
            return c.json({
                message: "jwt is invalid or missing"
            })
        }
        console.log("jwt exists")
        const token = jwt.split(' ')[1]
        if (!token) {
            c.status(403)
            return c.json({
                message: "token is invalid or missing"
            })
        }
        console.log("payload splitting done")
        try {
            const payload = await verify(token, c.env.JWT_SECRET) as { id: string }
            if (!payload || !payload.id) {
                c.status(401)
                return c.json({
                    error: "incorrect token payload"
                })
            }
            console.log("decoding done")
            c.set('userId', payload.id);
            console.log("go to next function")
            await next()
        } catch (error) {
            console.error(error)
            c.status(401)
            return c.json({ error: "Token verification failed" })
        }
    } catch (error) {
        console.error(error)
        c.status(500)
        return c.json({
            error: "jwt authentication failed"
        })
    }
})


blog.post('/post', async (c) => {
    try {
        const userId = c.get('userId')
        console.log("got user id")
        const userPost = await c.req.json();

        const { success } = createPostInput.safeParse(userPost)
        if(!success){
            c.status(400)
            return c.json({error:"please enter correct inputs"})
        }

        if (!userPost.title || !userPost.content) {
            c.status(400)
            return c.json({
                error: "title and content are necessary"
            })
        }
        const prisma = new PrismaClient({
            datasourceUrl: c.env.DATABASE_URL,
        }).$extends(withAccelerate())
       
         const post = await prisma.post.create({
            data: {
                title: userPost.title,
                content: userPost.content,
                published: true,
                authorId: userId
            }
        })
        console.log("creted post")
        return c.json({
            id: post.id,
            post
        })
    } catch (error) {
        console.error(error)
        c.status(500)
        return c.json({
            error: "failed to create post"
        })
    }
});

blog.put('/update', async (c) => {
    try {
        const userId = c.get('userId')
        console.log("got userid")
        const body = await c.req.json();
       
        const { success } = updatePostInput.safeParse(body)
        if(!success){
            c.status(400)
            return c.json({error:"please enter correct inputs"})
        }


        if (!body.id || (!body.title && !body.content)) {
            c.status(400)
            return c.json({
                error: "post id and atleast one of title or content are required"
            })
        }
        const prisma = new PrismaClient({
            datasourceUrl: c.env.DATABASE_URL
        }).$extends(withAccelerate())

        console.log("starting to update")
        const post = await prisma.post.update({
            where: {
                id: body.id,
                authorId: userId
            },
            data: {
                title: body.title,
                content: body.content
            }
        })
console.log("post updated")
        return c.json({
            message: "post updated!",
            post
        })
    } catch (error) {
        console.error(error)
        c.status(500)
        return c.json({
            error: "failed to update post"
        })
    }
});

//a more specific route above
blog.get('/homepage', async (c) => {
    try {
        const prisma = new PrismaClient({
            datasourceUrl: c.env.DATABASE_URL
        }).$extends(withAccelerate())

        const posts = await prisma.post.findMany({})

        return c.json(posts)
    } catch (error) {
        console.error(error)
        c.status(500)
        return c.json({ error: "Failed to fetch posts" })
    }
});
blog.get('/search',async (c)=>{
    const keywords =  c.req.query('q');
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate())
    const result = await prisma.post.findMany({
        where:{
           OR:[
           { title:{
               contains: keywords, 
               mode:"insensitive"
            }},
           { content:{
                contains:keywords,
                mode:'insensitive'
            }}
           ]
        }
    })
    return c.json(result)
})

//a generic route might catch bulk req too so put it below the specific route
blog.get('/:id', async (c) => {
    try {
        const id = c.req.param('id')
        if (!id) {
            c.status(400)
            return c.json({
                error: "id is required"
            })
        }
        const prisma = new PrismaClient({
            datasourceUrl: c.env.DATABASE_URL
        }).$extends(withAccelerate())

        const post = await prisma.post.findUnique({
            where: {
                id
            }
        })
        if (!post) {
            c.status(404)
            return c.json({
                error: "post not found"
            })
        }
        return c.json(post)
    } catch (error) {
        console.error(error)
        c.status(500)
        return c.json({ error: "Failed to fetch post" })
    }
});

blog.delete('/delete/:id',async (c)=>{
    try{
      const postId = c.req.param('id')
      const userId = c.get('userId')
      if(!postId){
        c.status(400)
        return c.json({
            error:"id is required"
        })
      }
      const prisma = new PrismaClient({
        datasourceUrl:c.env.DATABASE_URL
      }).$extends(withAccelerate())
      
      const post = await prisma.post.findUnique({
        where:{
            id:postId
        }
      })
      if(!post){
        c.status(404)
        return c.json({ error: "Post not found" });
      }

      if(post.authorId!=userId){
        c.status(403);
        return c.json({ error: "You do not have permission to delete this post" });
      }

      await prisma.post.delete({
        where:{
            id:postId
        }
      })

      return c.json({ message: "Post deleted successfully" });
    }catch(error){
        console.error(error)
        c.status(500);
        return c.json({ error: "Failed to delete post" });
    }
})

export default blog;
