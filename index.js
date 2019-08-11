const fs = require('fs');
const http = require('http');

http.createServer((request, response)=>{
    console.log("req: ",request.url);
    let file;
    request.url == "/"? file = 'index.html': file = request.url.slice(1, request.url.length);
    fs.readFile(file, (err, data) => {
        if (err){
            console.log(err);
        } else {
            response.writeHead(200, {'Content-Type':'text/html'});
            response.end(data, 'utf-8');
        }
    })
}).listen(3000, '127.0.0.1')