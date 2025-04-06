import express from 'express'
import cors from 'cors' //To decide who can talk to our backend
import cookieParser from 'cookie-parser';
//Creating an app from express
const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true
    })
)

//Common Middleware
app.use(
    express.json({limit: "16kb"})
)
app.use(cookieParser())
app.use(express.urlencoded({extended: true,limit:"16kb"}))

app.use(express.static("public"))

//Routes
import healthCheckRouter from './routes/healthCheck.routes.js'
import userRouter from './routes/user.routes.js'
// import { errorHandler } from './middlewares/error.middlewares.js';


//Creating a route
app.use('/api/v1/healthCheck',healthCheckRouter)
app.use('/api/v1/users',userRouter)


// app.use(errorHandler)


export {app} 
 