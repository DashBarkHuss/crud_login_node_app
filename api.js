const mysql = require('mysql');

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
    }
}
class API {
    static test(params) {
        return "apitest";
    }

    static catchAPIrequest(url){
        console.log("url: ", url);
        API.parts = url.split('/');
        API.parts.shift();
        console.log("parts: ", API.parts);
        return API.parts[0] === "api";
    }

}



module.exports = {API, database};