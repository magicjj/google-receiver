var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.json());

var PORT = 9082;
var WEBHOOK_VERIFY_TOKEN = "OKZQk6J1obCOD6a";

// models
var User = require('./models/user');
var Thumper = require('./models/thumper');


mongoose.connect('mongodb://win:tickletickle@localhost:27017/inject');

// Handle the connection event
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function () {
    console.log("DB connection alive");
});

var router = express.Router();

// middleware to use for all requests
router.use(function (req, res, next) {
    // do logging
    console.log('Something is happening.');
    res.header('X-XSS-Protection', 0);
    res.header('Access-Control-Allow-Origin', '*');
    res.header("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin,Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers, Server");
    res.header('Content-Type', 'application/json');
    next();
});

router.route('/thumpers/:userId')
    .get(function (req, res) {
        User.find({ userId: { $eq: req.params.userId } }, function (err, user) {
            if (!err && user) {
                res.json(user[0]);
            }
        });
    })
    .post(function (req, res) {
        if (req.body.action === "add") {
            if (req.body.pw !== "tickletickle") {
                return;
            }
            var user = new User();
            user.userId = req.params.userId;
            // TODO make these optional
            if (typeof req.body.defaultText !== "undefined") {
                user.defaultText = req.body.defaultText;
            }
            if (typeof req.body.covertText !== "undefined") {
                user.covertText = req.body.covertText;
            }
            if (typeof req.body.doodleIndex !== "undefined") {
                user.doodleIndex = req.body.doodleIndex;
            }
            if (typeof req.body.authorizedTypes !== "undefined") {
                user.authorizedTypes = req.body.authorizedTypes;
            }
            user.save(function (err) {
                if (!err && user) {
                    res.json(user);
                }
            });
        } else {
            User.find({ userId: { $eq: req.params.userId } }, function (err, user) {
                if (!err && user) {
                    user = user[0];
                    if (typeof req.body.defaultText !== "undefined") {
                        user.defaultText = req.body.defaultText;
                    }
                    if (typeof req.body.covertText !== "undefined") {
                        user.covertText = req.body.covertText;
                    }
                    if (typeof req.body.doodleIndex !== "undefined") {
                        user.doodleIndex = parseInt(req.body.doodleIndex);
                    }
                    user.save(function (err) {
                        if (!err) {
                            res.json(user);
                        }
                    })
                }
            });
        }
    })
;

router.route('/thumpers/:userId/list')
    .get(function (req, res) {
        var userId = req.params.userId;
        var thumperId = parseInt(req.params.thumperId);
        Thumper.find({ userId })
            .exec(function (err, thumpers) {
                if (!err && thumpers) {
                    res.json(thumpers);
                }
            })
        ;
    })
;

router.route('/thumpers/:userId/:thumperId')
    .get(function (req, res) {
        var userId = req.params.userId;
        var thumperIdInt = parseInt(req.params.thumperId);
        var handleOrCondition = [{ handle: req.params.thumperId }];
        if (!isNaN(thumperIdInt)) {
            handleOrCondition.push({ id: thumperIdInt });
        }
        Thumper.find( { userId } )
            .or(handleOrCondition)
            .exec(function (err, thumper) {
                if (!err && thumper) {
                    // todo catch if length is 0
                    res.json(thumper[0]);
                }
            })
        ;
    })
    .post(function (req, res) {
        if (req.body.action === "add") {
            var thumper = new Thumper();
            thumper.userId = req.params.userId;
            thumper.type = req.body.type;
            thumper.handle = req.body.handle;
            thumper.name = req.body.name;
            thumper.data = req.body.data;
            thumper.authorizedThumpers = req.body.authorizedThumpers;
            thumper.save(function (err) {
                if (!err && thumper) {
                    res.json(thumper);
                }
            });
        } else if (req.body.action === "delete") {
            Thumper.find({ userId: req.params.userId })
                .or([{ id: req.params.thumperId }, { handle: req.params.thumperId }])
                .remove(function (err) {
                    if (!err) {
                        res.json(null);
                    }
                })
            ;
        } else {
            Thumper.find({ userId: req.params.userId })
                .or([{ id: req.params.thumperId }, { handle: req.params.thumperId }])
                .exec(function (err, thumper) {
                    if (!err && thumper) {
                        thumper = thumper[0];
                        thumper.type = req.body.type;
                        thumper.handle = req.body.handle;
                        thumper.name = req.body.name;
                        thumper.data = req.body.data;
                        thumper.authorizedThumpers = req.body.authorizedThumpers;
                        thumper.save(function (err) {
                            if (!err && thumper) {
                                res.json(thumper);
                            }
                        });
                    }
                })
            ;
        }
    })
;


router.route('/webhook')
    .post((req, res) => {

    let body = req.body;

    // Checks this is an event from a page subscription
    if(body.object === 'page') {
        // Iterates over each entry - there may be multiple if batched
        body.entry.forEach(function (entry) {

        // Gets the message. entry.messaging is an array, but 
        // will only ever contain one message, so we get index 0
        let webhook_event = entry.messaging[0];
        console.log(webhook_event);
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');

    } else {
        // Returns a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404);
    }

})
.get((req, res) => {
    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];

    // Checks if a token and mode is in the query string of the request
    if (mode && token) {

        // Checks the mode and token sent is correct
        if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {

            // Responds with the challenge token from the request
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);

        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403);
        }
    }
});


// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function (req, res) {
    res.json({ message: 'hooray! welcome to our api!' });
});


app.use('/', router);

app.listen(PORT);
