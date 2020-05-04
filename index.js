const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = express();

// import routes
const authRoute = require('./routes/auth');
const postRoute = require('./routes/posts');

dotenv.config();

mongoose.connect( process.env.DB_CONNECT, { useNewUrlParser: true },
() => {
    console.log('connected to DB');
});

// Middleware
app.use(express.json());
// Route Middlewares
app.use('/api/user', authRoute);
app.use('/api/posts', postRoute);

app.listen(3000, () => { console.log('Server up and running')});

