require('dotenv').config();
const express = require('express');
const app = express();

const port = process.env.PORT || 3000;
const servicename = process.env.SERVICE_NAME || 'unknown service';

app.use(express.json);
app.listen(port, () =>  {
    console.log(`${servicename} running on port ${port}`);
});

app.get('/health', (req,res) => {
    res.status(200).json( {
        status: 'UP',
        uptime: process.uptime(),
        timestamp: new Data().toISOString()
    });
});

const user = [];

app.post('/api/users', (req,res) => {
    const userData = req.body;

    if(!userData.name || !userData.email) {
        return res.status(400).json({error: 'name and email are required'});
    }
    const newUser = {
        id: users.length + 1,
        name: userData.name,
        email: userData.email,
        createdAt: new Date().toISOString
    };
    user.push(userUser);
    res.status(201).json(newUser);
});

app.get('/api/users', (req,res) =>  {
    res.json(users);
});

app.use((req,res,next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url} - IP: ${req.ip}`);
    next();
});