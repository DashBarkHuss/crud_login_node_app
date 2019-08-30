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
        token: '15671031282604546'//'156710330373756863'
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

fetch(`http://127.0.0.1:${port}/api/user/login`, payload)
.then(promise=> promise.json())
.then(content => console.log("content ", content))
.catch((error) => { console.log("err ln51:", error) });


// fetch(`http://127.0.0.1:${port}/api/user/verify/dashkoo/15670067695583556`, payload)
// .then(promise=> promise.json())
// .then(content =>console.log("content test.js: ", content))
// .catch((error) => { console.log("err test.js:", error) });
