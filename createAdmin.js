const bcrypt = require('bcrypt');
const db = require('./database');

async function createAdmin() {
    const username = 'admin'; // Admin username
    const password = 'password'; // Admin password (replace with a strong password)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Ensure database is open before running queries
    db.serialize(() => {
        db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (err) => {
            if (err) {
                return console.error('Error creating admin user:', err.message);
            }
            console.log('Admin user created');
            // Close the database connection after completing operations
            db.close((err) => {
                if (err) {
                    return console.error('Error closing database:', err.message);
                }
                console.log('Database connection closed');
            });
        });
    });
}

createAdmin();
