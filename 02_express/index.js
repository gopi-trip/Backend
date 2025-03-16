import express from 'express';
import 'dotenv/config'
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json())

let teaData = []
let nextId = 1

//Add a new Tea
app.post('/teas',(req,res) => {
    //Body is an object
    const {name,price} = req.body
    const newTea = {
        id:nextId++,
        name:name,
        price:price
    }
    teaData.push(newTea)
    res.status(201).send(newTea)
})

//Get all teas
app.get('/teas', (req,res) => {
    res.status(200).send(teaData);
})

//Get a tea with a particular ID
app.get('/teas/:id',(res,req) => {
    const tea = teaData.find(t => t.id === parseInt(req.params.id))
    if(!tea){
        return res.status(404).send('Tea not found')
    }else{
        res.status(201).send(tea)
    }
})

//Update Tea
app.put('/teas/:id',(req,res) => {
    const tea = teaData.find(tea => tea.id === parseInt(req.params.id));
    if(!tea){
        return res.status(404).send('Tea not found')
    }
    const {name,price} = req.body;
    tea.name = name;
    tea.price = price;
    res.status(200).send(tea);
})

//Deleting Tea
app.delete('/teas/:id',(req,res) => {
    const index = teaData.findIndex((tea) => tea.id === parseInt(req.params.id))
    if(index === -1){
        res.status(404).send('Tea not found')
    }else{
        teaData.splice(index,1)
        res.status(204).send('Tea Deleted')
    }
})

//Listening 
app.listen(port,() => {
    console.log(`Server is listening at port: ${port}...`);
})
