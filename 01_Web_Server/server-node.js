//Using Node
const http = require('http');

const hostName = '127.0.0.1';
const port = 3000;

const server = http.createServer((request,response) => {
    if (request.url === '/') {
        response.statusCode = 200; //If everything is fine
        response.setHeader('Content-Type','text/plain');
        response.end("Hello Ice Tea");
    }else if (request.url === '/ice-tea') {
            response.statusCode = 200; //If everything is fine
            response.setHeader('Content-Type','text/plain');
            response.end("Thanks for ordering Ice Tea, it's really hot!");
    }else{
        response.statusCode = 404; //If everything is fine
        response.setHeader('Content-Type','text/plain');
        response.end("404 Not Found");
    }
});

server.listen(port,hostName, () => {
    console.log(`Server is listening at http://${hostName}:${port}`);
});


