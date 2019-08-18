const mysql = require('mysql');
const md5 = require('md5');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

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
        console.log('q: ', q);
        return new Promise((resolve, reject)=>{
            this.connection.query(q, (err, results)=>{
            if (err) throw err;
            if(results.affectedRows === 1) resolve({success: true})
            });
        });
    }
}

// helper function to check user table
function checkUserForDuplicate(clause, msg){
    return database.existsIn(
        'user', 
        clause, 
        false, 
        {success:false, message: msg}
    );
}

function createHash(token){
    return new Promise((resolve,reject)=>{
        bcrypt.genSalt(11, (err,salt)=>{
            if (err){
                return reject(err);
            }
            bcrypt.hash(token, salt, (err, hashedToken)=>{
                if (err) reject(err);
                resolve(hashedToken);
            })
        })
    })
}

function action_user_register(request, payload){
    return new Promise((resolve, reject)=>{
        const accountExists = `username ='${payload.username}' AND email = '${payload.email}'`;
        const usernameExists = `username ='${payload.username}'`;
        const emailExists = `email = '${payload.email}'`;
        
        //reject if any of these exist in user table reject with success: false
        checkUserForDuplicate(accountExists, `Account already exists.`)
        .then(()=> checkUserForDuplicate(usernameExists, `Username not available.`))
        .then(()=> checkUserForDuplicate(emailExists, `Account with email already exists.`))
        .then(content=> {
            if(content.found === false) return createHash(payload.password);
        }).then(password=>{
            const token = (new Date).getTime().toString() + Math.floor(Math.random()*100000);
            return createHash(token).then(hashedToken => {
                return {hashedToken, password, token}
            });
        }).then(content=>{
            createAccount(content.password, content.hashedToken);
            sendVerificationToken(content.token); 
        })
        .catch( error => reject(error));
        
        function createAccount(password, verificationToken){
            const values = [payload.username, payload.email, password, verificationToken];
            const fields = `username, email, password, verificationToken`;
            database.insertInto('user', fields , values).then((content)=>{
                content.message = `Account ${payload.username} created`;
                resolve(content);
            }).catch((error)=>(reject(error)));
        }

        function sendVerificationToken(token){ //what if we want to send it again? maybe this should be a global function
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.GMAIL,
                    pass: process.env.GMAILPW
                }
            })
            const mailOptions = {
                from: process.env.GMAIL,
                to: process.env.GMAIL2,
                subject: "hey",
                text: `http://127.0.0.1:3000/api/user/verify/${payload.username}/${token}`
            }

            transporter.sendMail(mailOptions, (error,info)=>{
                if (error){ 
                    console.log(error)
                } else {
                    console.log("Email sent: ", info.response);
                }
            })
        }
    })
}


function action_user_verify(){
    const user = API.parts[3] ||  null;
    const token = API.parts[4] || null;
    if(!user || !token) throw "incorrect URL";
    console.log("hi");
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

                if(identify('user', 'verify')){
                    console.log("verifiy")
                    action_user_verify()
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

API.parts = null;

module.exports = {API, database};