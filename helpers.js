const database = require('./database')
const bcrypt = require('bcrypt');

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
            if (err) rej(err);
            res(isMatch);
        })
    })
};

helpers.compareHashes = async function compareHashes(token, hashes){
    for (i=0; i<hashes.length; i++){
        const matchFound = await helpers.compareHash(token, hashes[i].token)
        if (matchFound){
            hash = hashes[i].token;
            i = hashes.length;
            return hash;
        } else if (i==hashes.length-1){
            return false;
        }
    }
}



helpers.identify= function(){ 
        const arr = [];
        for (i = 0; i<arguments.length-1; i++){arr.push(arguments[i])};
        const parts = arguments[arguments.length-1];
        return JSON.stringify(arr) == JSON.stringify(parts.slice(1, 3));
}

helpers.respond = (response, content)=>{
    response.writeHead(200, `{'Content-Type':'application/json'}`);
    response.end(JSON.stringify(content), 'utf-8')
}

for(prop in helpers) {
    if(helpers.hasOwnProperty(prop)) {
      module.exports[prop] = helpers[prop];
    }
 }
