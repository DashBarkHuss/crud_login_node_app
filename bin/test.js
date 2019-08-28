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
        password: "password", 
        token: ""
    })
}

// fetch(`http://127.0.0.1:${port}/api/user/register`, payload)
// .then(promise=> promise.json())
// .then(content => console.log("content ", content))
// .catch((error) => { console.log("err ln51:", error) });

// fetch(`http://127.0.0.1:${port}/api/sessions/create`, payload)
// .then(promise=> promise.json())
// .then(content => console.log("content ", content))
// .catch((error) => { console.log("err ln51:", error) });


fetch(`http://127.0.0.1:${port}/api/user/verify/dashkoo/15670067695583556`, payload)
.then(promise=> promise.json())
.then(content =>console.log("content test.js: ", content))
.catch((error) => { console.log("err test.js:", error) });

// const someToken = process.env.TOKEN;
// const someHash = process.env.HASH;


// works but not what I want
// const prom=() => {
//     return new Promise((resolve, reject)=>{
//         bcrypt.compare(someToken, someHash, (err, isMatch)=>{
//             if (err) reject(err);
//             console.log(44, {isMatch});
//             if (isMatch) resolve({isMatch});
//         })
//     }).then(x=>{
//         return new Promise((resolve, reject)=>{
//             bcrypt.compare('444', someHash, (err, isMatch)=>{
//                 if (err) reject(err);
//                 console.log(54, {isMatch});
//                 resolve({isMatch, x});
//             })
//         })
// })}
// prom().then(x=>console.log(50, x))





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
