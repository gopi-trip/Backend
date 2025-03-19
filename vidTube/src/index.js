import {app} from './app.js';
import dotenv from 'dotenv'
import connectDB from './db/index.js'
const PORT = process.env.PORT ||7001

//Configuring dotenv
dotenv.config({
    path: "./.env"
});

connectDB()
.then(() => {
    app.listen(PORT,() => {
        console.log(`Server is running at port ${PORT}....`);
    })
})
.catch((err) => {
    console.log("MongoDB Connection Error: ",err);
    
})