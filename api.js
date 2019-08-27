// const md5 = require('md5');
const bcrypt = require('bcrypt');
const sendEmail = require('./sendEmail');
const database = require('./database');
let {checkUserForDuplicate, createHash, compareHash,identify, respond } = require('./helpers');


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
    console.log(token);
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
    return new Promise((resolve, reject)=>{
        const username = API.parts[3] ||  null;
        const token = API.parts[4] || null;
        if(!username || !token) reject({'success':false, message:'Incorrect URL'});
        let condition = `username = '${username}'`;
        
        database.findValue('user', 'isVerified', condition).then(isVerified=>{
            if (isVerified){
                throw({success:false, message: 'User already verified.'})
            } else {
            return database.findValue('user', 'verificationToken', condition)
            }
        })
        .then(hashedToken =>{
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
            console.log(132, content);
            resolve(content);}).catch(error=>reject(error));
    })   
}



// API
class API {
    static exec(request, response) {
        if (request.method == "GET"){
            if(identify('user', 'verify', API.parts)){
                handleContent(action_user_verify);
            }
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
                if(identify('user', 'register', API.parts)){
                    handleContent(action_user_register, [request, payload]);
                }

                if(identify('user', 'verify', API.parts)){
                    handleContent(action_user_verify)
                }

            });
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