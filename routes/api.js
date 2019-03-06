const express = require('express');
const router = express.Router();

const fs = require('fs');
const crypto = require('crypto');

const usersRouter = require('./users');
const serverRouter = require('./servers');

let webserverUser, webserverPassHash;

fs.readFile('config.json', (err, data) => {
    if(err) throw err;
    const d = JSON.parse(data);
    webserverUser = d.auth.user;
    webserverPassHash = d.auth.hash;
});

/* Allow CORS */
router.use(function(req, res, next) {
    res.header({
        'Access-Control-Allow-Origin': 'http://ddd.io:1025',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
    });
    next();
});
/* Authentication checker */
router.use(function(req, res, next) {
    console.log(`User logging in with {Authorization: ${req.headers.authorization}}`);
    const authorization = req.headers.authorization;
    if(!authorization) {
        res.status(400).json({
            type: 'internal',
            stage: 'gateway',
            message: 'Authentication failed',
            http_status: 400,
            previous: null,
        });
    }
    else{
        let token = authorization.split(' ')[1];
        /* Convert out of b64 */
        /* NOTE: No actually security during transport (lol base64), ideally both gateway and webserver would be running
        in a shared secure environment (same machine, AWS, cloud, etc.) */
        token = new Buffer.from(token, 'base64').toString('ascii');
        const [user, pass] = token.split(':');
        if(user != webserverUser || crypto.createHash('sha256').update(pass).digest('hex') != webserverPassHash) {
            res.status(401).json({
                type: 'internal',
                stage: 'gateway',
                message: 'Authentication failed',
                http_status: 401,
                previous: null,
            });
        }
        else {
            next();
        }
    }
});
router.use('/servers', serverRouter);
router.use('/users', usersRouter);


module.exports = router;
