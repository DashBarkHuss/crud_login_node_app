const fs = require('fs');
const http = require('http');
const {API, database} = require('./api.js');
const fetch = require('node-fetch');

database.create();
const port = '3306';
http.createServer((request, response)=>{
    console.log("req: ",request.url);
    let file;
    request.url == "/"? file = 'index.html': file = request.url.slice(1, request.url.length);
    fs.readFile(file, (err, data) => {
        if (err){
            if (err = 'ENOENT'){
                if (API.catchAPIrequest(request.url)){
                    console.log('api request ');
                    API.exec(request, response);
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
}).listen(port, '127.0.0.1')

const payload = {
    method: 'POST', 
    headers: {Accept:'application/json'}, 
    body: JSON.stringify({
        email: process.env.GMAIL, 
        username: 'dashkoo', 
        password: "password"
    })
}

// fetch(`http://127.0.0.1:${port}/api/user/register`, payload)
// .then(promise=> promise.json())
// .then(content => console.log("content ", content))
// .catch((error) => { console.log("err ln51:", error) });

fetch(`http://127.0.0.1:${port}/api/user/verify/dashkoo/156623009547789382`, payload)
.then(promise=> promise.json())
.then(content => console.log("content ", content))
.catch((error) => { console.log("err ln51:", error) });


// fetch(`http://127.0.0.1:${port}/api/test/this`, payload)
// .then(promise=> promise.json())
// .then(content => console.log("content ", content))
// .catch((error) => { console.log("err ln51:", error) });

