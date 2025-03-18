import {app} from './app.js';
import dotenv from 'dotenv'
import connectDB from './db/index.js'
const PORT = process.emitWarning.PORT ||7001

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