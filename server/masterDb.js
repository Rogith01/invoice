const mysql = require("mysql2");

const masterDb = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "master_db",

    ssl: {
        rejectUnauthorized: false
    }
});

masterDb.connect((err) => {
    if (err) {
        console.log("Master Database Connection Failed");
        console.log(err);
    } else {
        console.log("Master Database Connected");
    }
});

module.exports = masterDb;