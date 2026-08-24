const mysql = require("mysql2");

const connections = {};

const getDatabase = (databaseName) => {

    // ======================================================
    // RETURN EXISTING CONNECTION
    // ======================================================

    if (connections[databaseName]) {
        return connections[databaseName];
    }

    // ======================================================
    // CREATE NEW CONNECTION
    // ======================================================

    const db = mysql.createConnection({

        host: process.env.DB_HOST,

        port: process.env.DB_PORT,

        user: process.env.DB_USER,

        password: process.env.DB_PASSWORD,

        database: databaseName,

        ssl: {
            rejectUnauthorized: false
        }

    });

    db.connect((err) => {

        if (err) {

            console.log(
                `Database connection failed: ${databaseName}`
            );

            console.log(err);

            return;
        }

        console.log(
            `Database connected: ${databaseName}`
        );

    });

    connections[databaseName] = db;

    return db;
};

module.exports = getDatabase;