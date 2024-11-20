# Blog Application

A robust and scalable blog application backend that allows users to sign up, sign in, and manage their blogs with full CRUD functionality. This project is optimized for performance and security using modern web technologies.

## Features

-  User Authentication :  
  Secure user sign-up and sign-in processes using JWT-based authentication.
  
-  Blog Management :  
  Users can create, update, and delete their blogs seamlessly.

-  Database Optimization :  
  Integrated Prisma ORM with Postgres for efficient database interactions, leveraging:
  - Connection pooling
  - Prisma Accelerate for enhanced performance

-  Scalability and Deployment :  
  Deployed on Cloudflare Workers, providing scalable and efficient performance.

## Technologies Used

-  Backend : Cloudflare Workers, TypeScript
-  Database : Prisma ORM, Postgres
-  Validation : Zod
-  Authentication : JWT
-  Optimization : Prisma Accelerate

## Installation and Usage

### Prerequisites

Ensure you have the following installed on your system:
- [Node.js](https://nodejs.org/)
- [Postgres](https://www.postgresql.org/)
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/)

### Setup Instructions

1.  Clone the Repository 
   bash
   git clone https://github.com/your-username/blog-app.git
   cd blog-app
2. Install dependencies
   npm install
3. Setup Environment Variables
  Create a .env file in the project root and add the required variables:
  DATABASE_URL=your_postgres_connection_string
  JWT_SECRET=your_jwt_secret_key
4. Generate Prisma Client
   npx prisma generate
5. Run Database Migrations
   npx prisma migrate dev
6. Start the Development Server
   npm run dev
7. Deploy to Cloudflare Workers
   npx wrangler deploy

## API Endpoints

## Authentication
POST /auth/signup – User registration
POST /auth/signin – User login

## Blogs
GET /blogs – Fetch all blogs
POST /blogs – Create a new blog
PUT /blogs/:id – Update a blog
DELETE /blogs/:id – Delete a blog


---

### Made with ❤️ by Vanshika Chhikara




