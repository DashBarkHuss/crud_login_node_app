const mysql = require('mysql');
const md5 = require('md5');
const bcrypt = require('bcrypt');
const sendEmail = require('./sendEmail')

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
    static existsIn(table, condition, resolveContent, content){
        const q = `select * from ${table} where ${condition};`
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
    static update(table, columns, values, condition){
        let arr = [];
        for(i=0; i<columns.length; i++){arr.push(`${columns[i]}='${values[i]}'`)};
        const set = arr.join(', ');
        const q = `UPDATE ${table} SET ${set} WHERE ${condition}`;
        console.log(q);
        return new Promise((resolve, reject)=>{
            this.connection.query(q,(err, results)=>{
                if (err) reject(err);
                resolve(results);
                
            })
        });

    }
}

//
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
            createAccount(password);
        })
        .catch( error => reject(error));
        
        function createAccount(password){
            const values = [payload.username, payload.email, password];
            const fields = `username, email, password`;
            database.insertInto('user', fields , values).then((content)=>{
                content.message = `Account ${payload.username} created`;
                resolve(content);
                sendVerificationToken(payload.email, payload.username); 
            }).catch((error)=>(reject(error)));
        }

    })
}

function sendVerificationToken(email, username){ //what if we want to send it again? maybe this should be a global function
    const token = (new Date).getTime().toString() + Math.floor(Math.random()*100000);
    const condition = `username = '${username}'`;
    createHash(token).then(hashedToken=> {
        console.log('t: ', token, 'ht: ', hashedToken)
        return database.update('user', ['verificationToken'], [hashedToken], condition);
    })
    .then(()=>{
        const to = email
        const subject = "Verify Your Account"
        const text = `http://127.0.0.1:3000/api/user/verify/${username}/${token}`
        sendEmail(to, subject, text);
    });
}
function action_user_verify(){
    const username = API.parts[3] ||  null;
    const token = API.parts[4] || null;
    if(!username || !token) reject({'success':false, message:'Incorrect URL'});
    return new Promise((reject, resolve)=>{
        compareHash(token, hashedToken, (err, isMatch)=>{
            if (err) throw err;
            if (isMatch) resolve(isMatch)
        }).then(hashedToken=>{
            console.log('t: ', token, 'ht: ', hashedToken)
            const condition = `username = '${username}' AND verificationToken = '${hashedToken}'`;
            return database.update('user', ['isVerified'], [1], condition)
        }).then(content => resolve(content)).catch(error=>reject(error));
    });
}

function test(){
    const token = 'password';
    hashedToken = '$2b$11$.sKpaslUh4fS9nepyAbZ5Ou3pcNSD/zlSrU6/hek6wGfuvPVsCCRu';
    return new Promise ((resolve, reject)=>{
        compareHash(token, hashedToken, (err, isMatch)=>{
            if (err) throw err;
            if (isMatch) {
                resolve(isMatch)}
        }).catch(error=>resolve(error))
    })
}


// helper functions
function checkUserForDuplicate(condition, msg){
    return database.existsIn(
        'user', 
        condition, 
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

function compareHash(token, hashedToken, cb){
    return new Promise((reject, resolve)=>{
        bcrypt.compare(token, hashedToken, (err, isMatch)=>{
            if (err){
                reject(cb(err));
            }
            resolve(cb(null, isMatch));
        });
    });
};


function identify(){
    const arr = [];
    for (i = 0; i<arguments.length; i++){arr.push(arguments[i])};
    return JSON.stringify(arr) == JSON.stringify(API.parts.slice(1, 3));
}

function respond(response, content){
    response.writeHead(200, `{'Content-Type':'application/json'}`);
    response.end(JSON.stringify(content), 'utf-8')
}

// API
class API {
    static exec(request, response) {
        let action;
        if (request.method == "GET"){
            if(identify('user', 'verify')){
                action = action_user_verify();
            }
            handleContent();
        }
        if (request.method == "POST"){
            request.chunks = [];
            request.on('data', segment=>{
                request.chunks.push(segment);
            })

            request.on('end',()=>{
                let payload;
                request.chunks.length>0? payload = JSON.parse(Buffer.concat(request.chunks).toString()) : null;
                

                if(identify('user', 'register')){
                    action = action_user_register(request, payload);
                }

                if(identify('user', 'verify')){
                    action = action_user_verify();
                }

                if(identify('test', 'this')){
                    action = test();
                }
                handleContent();
                
            });
        }
        function handleContent(){
            action.then(content => {
                respond(response, content);
            }).catch((error)=> {
                respond(response, error);
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