// const md5 = require('md5');
// const bcrypt = require('bcrypt');
const sendEmail = require('./sendEmail');
const database = require('./database');
let {checkUserForDuplicate, createHash, compareHash, identify, respond } = require('./helpers');


function action_user_register(payload){
    return new Promise((resolve, reject)=>{
        if(!payload.password || !payload.username || !payload.email) throw({success:false, message: "Email, username, or password missing."})
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

function action_user_verify(){
    return new Promise((resolve, reject)=>{
        const username = API.parts[3] ||  null;
        const token = API.parts[4] || null;
        if(!username || !token) reject({'success':false, message:'Incorrect URL'});
        let condition = `username = '${username}'`;
        
        database.findValue('user', 'isVerified', condition).then(results=>{
            if (results.results){
                throw({success:false, message: 'User already verified.'})
            } else {
                return database.findValue('user', 'verificationToken', condition)
            }
        })
        .then(results =>{
            const hashedToken = results.results;
            return compareHash(token, hashedToken).then(isMatch=>({isMatch,hashedToken}))
        })
        .then(content=>{
            if (content.isMatch){
                const condition = `username = '${username}' AND verificationToken = '${content.hashedToken}'`;
                return database.update('user', ['isVerified'], [1], condition)
            } else {
                reject({success: false, message: "Incorrect verification token"});
            }
        }).then(content => {
            if (content.affectedRows !== 0){
                reject({success: true, message: "Account verified"});
            } else {
                resolve({success: false, message: "Something went wrong, the account wasn't verified"})
            }
        }).catch(error=>reject(error));
    })   
}
function sendVerificationToken(email, username){ //what if we want to send it again? maybe this should be a global function
    const token = (new Date).getTime().toString() + Math.floor(Math.random()*100000);
    const condition = `username = '${username}'`;
    createHash(token).then(hashedToken=> {
        return database.update('user', ['verificationToken'], [hashedToken], condition);
    })
    .then(()=>{
        const to = email
        const subject = "Verify Your Account"
        const text = `http://127.0.0.1:3000/api/user/verify/${username}/${token}`
        sendEmail(to, subject, text);
    });
}

function action_user_login(request, payload){
    return new Promise((resolve, reject)=>{
        userLoggedIn(request, payload)
        .then(loggedIn=>{
            if(loggedIn) throw {success:false, message:"Already logged in"};
            return database.findValue('user', 'password', `username='${payload.username}'`)
        })
        .then(foundInfo=>{
            if (foundInfo.success){
                return(foundInfo.results)
            } else {
                throw (foundInfo)
            }
        })
        .then(hashedPassword => compareHash(payload.password, hashedPassword))
        .then(isMatch=>{
            if (isMatch){
                resolve(action_sessions_create(request, payload).then(token=>{return{success:true, token}}))
            } else {
                resolve({success: false, message: 'incorrect password or account'})
            }
        })
        .catch(err=>resolve(err));
    })
}

function action_user_logout(request, payload){
    return new Promise ((resolve, reject)=>{
        action_sessions_get(request, payload)
        .then(hash=>{
            console.log(116, hash)
            database.delete('sessions', `token='${hash}'`)
            .then(results=>{
                if (results.affectedRows > 0) resolve({success: true, message: payload.username + ' logged out'})
            })
        })
    });
}

function userLoggedIn(request, payload){
    return new Promise((resolve, reject)=>{
        action_sessions_get(request,payload)
        .then(hash=>{
            console.log(hash)
            if(hash) resolve(true);
            else resolve(false);
        })
    })
}

function action_sessions_create(request, payload){
    const token = (new Date).getTime().toString() + Math.floor(Math.random()*100000);
    return new Promise((resolve, reject)=>{
        createHash(token)
        .then(hashedToken=>{
            return database.insertInto('sessions', 'username, useragent, token', [payload.username, request.headers['user-agent'], hashedToken])
        }).then(content=>{
            if (content.success) resolve({token});
        })
    })
}


function action_sessions_get(request, payload){
    if (!payload.token) return (async ()=>false)();
    async function compareHashes(token, hashes){
        for (i=0; i<hashes.length; i++){
            const matchFound = await compareHash(token, hashes[i].token)
            if (matchFound){
                hash = hashes[i].token;
                i = hashes.length;
                return hash;
            } else if (i==hashes.length-1){
                return false;
            }
        }
    }
    return new Promise((resolve, reject)=>{
        console.log(2)
        database.findValues('sessions', 'token', `username = '${payload.username}' AND useragent = '${request.headers['user-agent']}'`)
        .then(hashes=>{
            if (!hashes.success) throw false;
            if (hashes.results.length === 1) throw (hashes.results[0].token)
            return compareHashes(payload.token, hashes.results)
        })
        .then(hash=>{
            console.log(170, hash);
            resolve(hash)
        })
        .catch(err => resolve(err))
        //compare tokens
    })
}

// API
class API {
    static exec(request, response) {

        if (request.method == "GET"){
            actionFor('user', 'verify', action_user_verify);
        }
        if (request.method == "POST"){
            request.chunks = [];
            request.on('data', segment=>{
                request.chunks.push(segment);
            })

            request.on('end',()=>{
                let payload;
                request.chunks.length>0? payload = JSON.parse(Buffer.concat(request.chunks).toString()) : null;
module;
                actionFor('user', 'register', action_user_register, [payload])

                actionFor('user', 'verify', action_user_verify)
            
                actionFor('user', 'login', action_user_login, [request, payload])
                
                actionFor('user', 'logout', action_user_logout, [request, payload])
                
                actionFor('sessions', 'get', action_sessions_get, [request, payload])
                
                actionFor('sessions', 'create', action_sessions_create, [request, payload])
            });
        }

        //helpers
        function actionFor(api1, api2, action, paramArray=[]){
            if(identify(api1, api2, API.parts)){
                handleContent(action, paramArray);
            }
        }
        function handleContent(action,params = []){
            action(...params).then(content => {
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
