// const md5 = require('md5');
// const bcrypt = require('bcrypt');
const sendEmail = require('./sendEmail');
const database = require('./database');
let {checkUserForDuplicate, createHash, compareHash, compareHashes, identify, respond } = require('./helpers');


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
            database.delete('sessions', `token='${hash}'`)
            .then(results=>{
                if (results.affectedRows > 0) resolve({success: true, message: payload.username + ' logged out'})
            })
        })
    });
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
    return new Promise((resolve, reject)=>{
        database.findValues('sessions', 'token', `username = '${payload.username}' AND useragent = '${request.headers['user-agent']}'`)
        .then(hashes=>{
            if (!hashes.success) throw false;
            return compareHashes(payload.token, hashes.results)
        })
        .then(hash=>{
            resolve(hash)
        })
        .catch(err => {console.log(166);resolve(err)})
        //compare tokens
    })
}

function action_posts_create(request, payload){
    return new Promise((resolve, reject)=>{
        isAuthorized(request, payload)
        .then(isAuthorized=>{
            if(isAuthorized) return database.insertInto('posts', 'message, username', [payload.message, payload.username]);
            else throw({success: false, message: `You are not authorized to post. Please log in`})
        })
        .then(info=>{
            let message;
            info.success? message = "Post created" : message = "Post not created";
            resolve(message);
        }).catch(err=>resolve(err))
    })
}

function action_posts_read(payload){
    //get the post then serve it to a template eventually
    return new Promise((resolve, reject)=>{
        database.findRecords("posts", `id=${payload.id}`)
        .then(results=>{
            if(results.length===0) resolve("No entries");
            else resolve(results);
        })
    })
}

function action_posts_update(request, payload){
    return new Promise((resolve, reject)=>{
        isAuthorizedToEditPost(request, payload)
        .then(isAuthorized=>{
            if(!isAuthorized) throw "Not authorized."
            return database.update('posts', ['message'], [payload.message], `id=${payload.id}`)
        }).then(results=>{
            let message;
            results.changedRows === 1 ? message = "post updated": message = "nothing to change";
            resolve(message);
        }).catch(err=>reject(err))
    })
}

async function action_posts_delete(request, payload){
    return await isAuthorizedToEditPost(request, payload)
    .then(isAuthorized=>{
        console.log(182);
        if(!isAuthorized) throw "not authorized to delete post, or post doesn't exist";
        return database.delete("posts", `id=${payload.id}`)
    }).then(results=>{
        console.log(results)
        let message;
        results.affectedRows === 1 ? message = "deleted": message = "nothing deleted";
        return message;
    }).catch(err=>err)
}

async function userLoggedIn(request, payload){
    return isAuthorized(request, payload);
}

function isAuthorized(request, payload){
    return new Promise((resolve, reject)=>{
        
        action_sessions_get(request,payload)
        .then(hash=>{
            if(hash) resolve(true);
            else resolve(false);
        })
    })
}

function isAuthorizedToEditPost(request, payload){
    return new Promise((resolve,reject)=>{
        isAuthorized(request, payload)
        .then(isAuthorized=>{
            if(!isAuthorized) throw false;
            return database.findValue('posts', 'username', `id=${payload.id}`)
        }).then(results=>{
            const postUsername = results.results;
            if(payload.username!==postUsername) throw false;
            resolve(true);
        }).catch(err=>resolve(err))
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
                
                actionFor('posts', 'create', action_posts_create, [request, payload])
                
                actionFor('posts', 'read', action_posts_read, [payload])
                
                actionFor('posts', 'update', action_posts_update, [request, payload])
                
                actionFor('posts', 'delete', action_posts_delete, [request, payload])
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
