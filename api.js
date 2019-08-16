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
    static existsIn(table, clause, resolveContent, content){
        const q = `select * from ${table} where ${clause};`
        return new Promise((resolve, reject)=>{
            this.connection.query(q, (err, results)=>{
                if (err) console.log(err);
                if (results.length !== 0 && resolveContent) resolve(content);
                if (results.length !== 0 && !resolveContent) reject(content);
                if (results.length === 0) resolve({found: false});
            })
        })
    };

    static insertInto(table, fields, values){
        values = values.join("', '")
        const q = `insert into ${table}(${fields}) values('${values}')`;
        return new Promise((resolve, reject)=>{
            this.connection.query(q, (err, results)=>{
            if (err) throw err;
            if(results.affectedRows === 1) resolve({success: true})
            });
        });
    }
}

    // helper function
function checkUserForDuplicate(clause, msg){
    return database.existsIn(
        'user', 
        clause, 
        false, 
        {success:false, message: msg}
    );
}

function action_user_register(request, payload){
    return new Promise((resolve, reject)=>{
        const accountExists = `username ='${payload.username}' AND email = '${payload.email}'`;
        const usernameExists = `username ='${payload.username}'`;
        const emailExists = `email = '${payload.email}'`;
  console.log(52);
        //reject if any of these exist in user table
        checkUserForDuplicate(accountExists, `account already exists`)
        .then(()=> checkUserForDuplicate(usernameExists, `username not available`))
        .then(()=> checkUserForDuplicate(emailExists, `email already exists`))
        .then(content=> {
            console.log(58);
            if(content.found === false) createAccount();
        })
        .catch( error => reject(error));
        
        function createAccount(){
            console.log(63);
            const username = payload.username;
            const email = payload.email;
            const password = payload.password;

            const values = [username, email, password];
            const fields = `username, email, password`;

            database.insertInto('user', fields , values).then((content)=>{
                content.message = `account ${username} created`
                resolve(content);
            }).catch((error)=>(console.log(error)));
        }
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
                    }).catch((error)=> {
                        response.writeHead(200, "{ 'Content-Type': 'application/json' }");
                        response.end(JSON.stringify(error), 'utf-8')
                    });
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