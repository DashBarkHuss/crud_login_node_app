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
    };
    static existsIn(table, condition, resolveContent, content){
        const q = `select * from ${table} where ${condition};`
        return new Promise((resolve, reject)=>{
            this.connection.query(q, (err, results)=>{
                if (err) console.log(err);
                if (results.length !== 0 && resolveContent) resolve(content);
                if (results.length !== 0 && !resolveContent) reject(content);
                if (results.length === 0) resolve({found: false});
            })
        })
    };

    static findValue(table, field, condition){
        const q = `select ${field} from ${table} where ${condition}`;
        return new Promise ((resolve, reject)=>{
            this.connection.query(q, (err,results)=>{
                if (err) throw err;
                if (results.length === 0){
                    resolve({success: false, message:`No value for ${field} found`})
                } else {
                    resolve({success: true, results: results[0][field]});
                }
            })
        })
    }

    static insertInto(table, fields, values){
        values = values.join("', '")
        const q = `insert into ${table}(${fields}) values('${values}')`;
        console.log('q: ', q);
        return new Promise((resolve, reject)=>{
            this.connection.query(q, (err, results)=>{
            if (err) throw err;
            if(results.affectedRows === 1) resolve({success: true})
            });
        });
    }
    static update(table, columns, values, condition){
        let arr = [];
        for(let i=0; i<columns.length; i++){arr.push(`${columns[i]}='${values[i]}'`)};
        const set = arr.join(', ');
        const q = `UPDATE ${table} SET ${set} WHERE ${condition}`;
        return new Promise((resolve, reject)=>{
            this.connection.query(q,(err, results)=>{
                if (err) reject(err);
                resolve(results);
            })
        });
    }
}

module.exports = database;