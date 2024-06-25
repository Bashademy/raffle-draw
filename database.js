const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Specify the path to your SQLite database file
const dbPath = path.resolve(__dirname, 'raffle.db');

// Connect to SQLite database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        // Create tables if they don't exist
        db.run('CREATE TABLE IF NOT EXISTS tickets (id INTEGER PRIMARY KEY, number TEXT)');
        db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, password TEXT)');
    }
});

module.exports = db;
