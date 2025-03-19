import express from 'express'
import cors from 'cors' //To decide who can talk to our backend

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

app.use(express.urlencoded({extended: true,limit:"16kb"}))

app.use(express.static("public"))

//Routes
import healthCheckRouter from './routes/healthCheck.routes.js'

//Creating a route
app.use('/api/v1/heathCheck',healthCheckRouter)
export {app} 
 