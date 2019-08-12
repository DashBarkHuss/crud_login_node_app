const mysql = require('mysql');

class database {
    static create(){
    this.connection = mysql.createConnection({
        database: process.env.DATABASE,
        host: process.env.HOST,
        user: process.env.DBUSER,
        password: process.env.PASSWORD
    });
    this.connection.connect();
    console.log("connected to database");
    }
}

function action_user_register(request, payload){
    return new Promise((resolve, reject)=>{
        let q = `select * from user where username = '${payload.username}'`;
        database.connection.query(q,(err, results)=>{
            console.log('res: ',results)
        })
    })
}

function identify(){
    const arr = [];
    for (i = 0; i<arguments.length; i++){arr.push(arguments[i])};
    return JSON.stringify(arr) == JSON.stringify(API.parts.slice(1, API.parts.length));
}
class API {
    static exec(request, response) {
        if (request.method == "POST"){
            request.chunks = [];
            request.on('data', segment=>{
                request.chunks.push(segment);
            })

            request.on('end',()=>{
                let payload;
                request.chunks.length>0? payload = JSON.parse(Buffer.concat(request.chunks).toString()) : null;
                
                if(identify('user', 'register')){
                    action_user_register(request, payload)
                }
            });
        }
    }


    static catchAPIrequest(url){
        console.log("url: ", url);
        API.parts = url.split('/');
        API.parts.shift();
        console.log("parts: ", API.parts);
        return API.parts[0] === "api";
    }

}


module.exports = {API, database};