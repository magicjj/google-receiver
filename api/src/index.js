var express = require('express');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');

var app = express();
app.use(bodyParser.json());

var PORT = 9082;

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


// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function (req, res) {
    res.json({ message: 'hooray! welcome to our api!' });
});


app.use('/', router);

app.listen(PORT);
