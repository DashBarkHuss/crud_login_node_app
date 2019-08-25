const database = require('./database')
const helpers = {};

// helper functions
helpers.checkUserForDuplicate = (condition, msg)=>{
    return database.existsIn(
        'user', 
        condition, 
        false, 
        {success:false, message: msg}
    );
}

helpers.createHash=(token)=>{
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

helpers.compareHash=(token, hashedToken)=>{
    return new Promise ((res, rej)=>{
        bcrypt.compare(token, hashedToken, (err, isMatch)=>{
        console.log(172, {isMatch})
        if (err){
            rej(err);
        }
        res(isMatch);
        })
    })
};

helpers.identify= function(){ //closure so API.parts is in scope
    return function(){
        const arr = [];
        for (i = 0; i<arguments.length; i++){arr.push(arguments[i])};
        console.log({arguments});
        return JSON.stringify(arr) == JSON.stringify(API.parts.slice(1, 3));}
}

helpers.respond = (response, content)=>{
    console.log("c 50 ", content);
    console.trace();
    
    response.writeHead(200, `{'Content-Type':'application/json'}`);
    response.end(JSON.stringify(content), 'utf-8')
}

for(prop in helpers) {
    if(helpers.hasOwnProperty(prop)) {
      module.exports[prop] = helpers[prop];
    }
 }
 console.log("module.exports: ", module.exports);