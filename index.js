const fs = require('fs');
const http = require('http');

http.createServer((request, response)=>{
    console.log("req: ",request.url);
}).listen(3000, '127.0.0.1')