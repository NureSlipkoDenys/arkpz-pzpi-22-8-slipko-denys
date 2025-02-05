require('dotenv').config();

const sql = require('mssql');

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER, 
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

async function connectDB() {
    try {
        await sql.connect(config);
        console.log('✅ Подключено к SQL Server!');
    } catch (err) {
        console.error('❌ Ошибка подключения к базе:', err.message);
    }
}

module.exports = { connectDB, sql };
