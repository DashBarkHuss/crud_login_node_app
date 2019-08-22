require('dotenv/config')
require('../index')
const port = require('../index')
const {API, database, sendVerificationToken, compareHash}=require('../api.js');
const fetch = require('node-fetch');
const bcrypt = require('bcrypt');


const payload = {
    method: 'POST', 
    headers: {Accept:'application/json'}, 
    body: JSON.stringify({
        email: process.env.GMAIL, 
        username: 'dashkoo', 
        password: "password"
    })
}

// fetch(`http://127.0.0.1:${port}/api/user/verify/dashkoo/156649095313176778`, payload)
// .then(promise=> promise.json())
// .then(content => console.log("content 20 ", content))
// .catch((error) => { console.log("err ln51:", error) });

const someToken = process.env.TOKEN;
const someHash = process.env.HASH;

new Promise((resolve, reject)=>{
    bcrypt.compare(someToken, someHash, (err, isMatch)=>{
        if (err) reject(err);
        console.log(isMatch);
        if (isMatch) resolve({isMatch});
    })
}).then(x=>console.log(x))

// new Promise((resolve, reject)=>{
//     console.log(someToken, someHash);
//     bcrypt.compare(someToken, someHash, (err, isMatch)=>{
//         if (err) reject(err);
//         console.log(isMatch);
//         if (isMatch) resolve({isMatch});
//     })
// }).then(x=>console.log(x))

// new Promise((resolve, reject)=>{
//     compareHash('156649095313176778', '$2b$11$/MgxghNzRhCqGYVo/8LmoO/kWfHcriVm0yE/0i/Utnb18xM5.PpjO', (err, isMatch)=>{
//         if (err) reject(err);
//         if (isMatch) console.log({isMatch});
//         if (isMatch) resolve({isMatch});
//     })
// }).then(x=>console.log(x))

// compareHash('156649095313176778', '$2b$11$/MgxghNzRhCqGYVo/8LmoO/kWfHcriVm0yE/0i/Utnb18xM5.PpjO', (err, isMatch)=>{
//     if (err) console.log(err);
//     if (isMatch) console.log(32, {isMatch});
//     if (isMatch) return({isMatch});
// }).then(x=>console.log(x))
