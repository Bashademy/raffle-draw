const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const db = require('./database'); // Add this line to import the database module

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Express session
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));

// Passport.js
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy((username, password, done) => {
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) return done(err);
        if (!user) return done(null, false, { message: 'Incorrect username.' });
        bcrypt.compare(password, user.password, (err, res) => {
            if (res) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'Incorrect password.' });
            }
        });
    });
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
        done(err, user);
    });
});

// Middleware to check authentication
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

// Body parser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Serve static files
app.use(express.static('public'));

app.get('/organizer', isAuthenticated, (req, res) => {
    res.sendFile(__dirname + '/public/organizer.html');
});

app.get('/public', (req, res) => {
    res.sendFile(__dirname + '/public/public.html');
});

app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/organizer',
    failureRedirect: '/login'
}));

app.post('/logout', (req, res) => {
    req.logout();
    res.redirect('/login');
});

app.post('/tickets', (req, res) => {
    const { number } = req.body;
    db.run('INSERT INTO tickets (number) VALUES (?)', [number], function(err) {
        if (err) {
            return res.status(500).send(err);
        }
        res.status(201).send({ id: this.lastID, number });
    });
});

app.get('/tickets', (req, res) => {
    db.all('SELECT * FROM tickets', (err, rows) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.send(rows);
    });
});

app.delete('/tickets/:number', (req, res) => {
    const { number } = req.params;
    db.run('DELETE FROM tickets WHERE number = ?', [number], function(err) {
        if (err) {
            return res.status(500).send(err);
        }
        res.status(204).send();
    });
});

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('startDraw', (tickets) => {
        const winner = tickets[Math.floor(Math.random() * tickets.length)];
        db.run('DELETE FROM tickets WHERE number = ?', [winner], (err) => {
            if (err) {
                console.error('Error deleting ticket:', err);
            }
            io.emit('drawResult', { winner });
        });
    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
