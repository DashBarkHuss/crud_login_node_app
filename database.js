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
                    const message = `No value for ${field} found where ${condition.slice(0,25)+"..."}`;
                    resolve({success: false, message})
                } else {
                    resolve({success: true, results: results[0][field]});
                }
            })
        })
    }
    static findValues(table, field, condition){
        const q = `select ${field} from ${table} where ${condition}`;
        
        return new Promise ((resolve, reject)=>{
            this.connection.query(q, (err,results)=>{
                if (err) throw err;
                if (results.length === 0){
                    const message = `No values for ${field} found where ${condition.slice(0,25)+"..."}`;
                    resolve({success: false, message})
                } else {
                    resolve({success: true, results: results});
                }
            })
        })
    }
    static findRecords(table, condition){
        const q = `select * from ${table} where ${condition}`;
        return new Promise ((resolve, reject)=>{
            this.connection.query(q, (err,results)=>{
                if (err) throw err;
                resolve(results);
            })
        }).catch(err=>reject(err))
    }

    static insertInto(table, fields, values){
        values = values.join("', '")
        const q = `insert into ${table}(${fields}) values('${values}')`;
        return new Promise((resolve, reject)=>{
            this.connection.query(q, (err, results)=>{
            if (err) throw err;
            if(results.affectedRows >= 1) resolve({success: true})
            else if (results.affectedRows === 0) resolve({success: false, message: "nothing inserted into database"})
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
    static delete(table, condition){
        const q = `DELETE FROM ${table} WHERE ${condition}`;
        console.log(q)
        return new Promise((resolve, reject)=>{
            this.connection.query(q,(err, results)=>{
                if (err) reject(err);
                resolve(results);
            })
        })
    }
}

module.exports = database;