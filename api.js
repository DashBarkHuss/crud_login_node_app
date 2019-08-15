const mysql = require('mysql');
const md5 = require('md5');

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
    };
    static existsIn(table, clause, resolve, content){
        const q = `select * from ${table} where ${clause};`
        this.connection.query(q, (err, results)=>{
            if (err) console.log(err);
            if (results.length !== 0) resolve(content);
        })
    };
}

function action_user_register(request, payload){
    return new Promise((resolve, reject)=>{
        // helper function
        function checkUserFor(clause, msg){
            database.existsIn(
                'user', 
                clause, 
                resolve, 
                {success:false, message: msg}
            );
        }

        const accountExists = `username ='${payload.username}' AND email = '${payload.email}'`;
        const usernameExists = `username ='${payload.username}'`;
        const emailExists = `email = '${payload.email}'`;
        
        // resolve if any of these exist in user table
        checkUserFor(accountExists, `account already exists`); 
        checkUserFor(usernameExists, `username not available`); 
        checkUserFor(emailExists, `email already exists`); 
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
                    .then(content => {
                        response.writeHead(200, "{ 'Content-Type': 'application/json' }");
                        response.end(JSON.stringify(content), 'utf-8');
                    })
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