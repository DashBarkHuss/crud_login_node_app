const fs = require('fs');
const http = require('http');
const {API, database} = require('./api.js');

http.createServer((request, response)=>{
    console.log("req: ",request.url);
    let file;
    request.url == "/"? file = 'index.html': file = request.url.slice(1, request.url.length);
    fs.readFile(file, (err, data) => {
        if (err){
            if (err = 'ENOENT'){
                if (file.split('/')[0] === 'api'){
                    console.log('api request ', API.test(), database.test());
                } else {
                    console.log("err: ", err);
                }
            }
        } else {
            // if (!file.includes('.')) return; //handle this later
            const ext = (file.split('.')[file.split('.').length-1]).toLowerCase();
            const mime = {
                'html': 'text/html',
                'png': 'image/png',
                'jpg': 'image/jpeg',
                'jpeg': 'image/jpeg'
            }
            if (mime[ext] == null) mime[ext] = 'application/octet-stream';
            response.writeHead(200, {'Content-Type':mime[ext]});
            response.end(data, 'utf-8');
        }
    })
}).listen(3000, '127.0.0.1')
