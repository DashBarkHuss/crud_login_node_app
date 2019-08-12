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
}

module.exports = {API, database};