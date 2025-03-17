import express from 'express'
const app = express();
const port = 3000;

//For accepting data from the frontend side
app.use(express.json())

const cityData = [];
let index = 1;

//Adding a city to cityData
app.post('/city',(req,res) => {
    const {name,code} = req.body
    let city = {
        id:index++,
        name:name,
        code:code
    }
    cityData.push(city);
    res.send(city).status(201)
})

//Displaying all cities
app.get('/cities',(req,res) => {
    res.send(cityData).status(200)
})

//Display City with a particular ID
app.get('/cities/:id',(req,res) => {
    const city = cityData.find(city => city.id === parseInt(req.params.id));
    if(!city){
        res.status(404).send("City Not Found")
    }else{
        res.status(200).send(city)
    }
})

//Update City
app.put('/cities/:id',(req,res) => {
    const city = cityData.find(city => city.id === parseInt(req.params.id));
    if(!city){
        res.status(404).send("City Not Found")
    }else{
        city.name = req.body.name;
        city.code = req.body.code
        res.status(200).send(city)
    }
})

//Delete City
app.delete('/cities/:id',(req,res) => {
    const index = cityData.findIndex(city => city.id === parseInt(req.params.id))
    if(index === -1){
        res.status(404).send("City Not Found")
    }else{
       cityData.splice(index,1)
       res.status(200).send("Deleted City")
    }
})


app.listen(port,() => {
    console.log(`Server is listening at port ${port}....`);
})