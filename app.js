require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session')
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');

const app = express();
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://127.0.0.1:27017/usersDB");
const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    secret: String
});
userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', userSchema);
passport.use(User.createStrategy());
// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/', (req, res) => {
    res.render('home');
});
app.route('/login')
    .get(function (req, res) {
        res.render('login');
    })
    .post(function (req, res) {
        const user = new User({
            username: req.body.username,
            password: req.body.password
        });
        req.login(user, function (err) {
            if (err) {
                console.log(err);
            } else {
                passport.authenticate('local')(req, res, function () {
                    res.redirect('/secrets');
                })
            }
        });
    });

app.route('/register')
    .get(function (req, res) {
        res.render('register');
    })
    .post(function (req, res) {
        User.register({ username: req.body.username }, req.body.password, function (err, user) {
            if (err) {
                res.redirect('/register');
            }
            else {
                passport.authenticate('local')(req, res, function () {
                    res.redirect('/secrets');
                });
            }
        });
    }
    );

app.get('/secrets', function (req, res) {
    // display all secrets posted by users
    User.find({ "secret": { $ne: null } }).then(foundSecrets => {
        res.render('secrets', { usersWithSecret: foundSecrets })
        console.log(foundSecrets);
    }).catch(err => { console.log(err); });
});
app.get('/submit', function (req, res) {
    if (req.isAuthenticated()) {
        res.render('submit');
    }
    else {
        res.redirect('/login');
    }
});
app.post('/submit', function (req, res) {
    const submittedSecret = req.body.secret;
    User.findById(req.user.id).then((foundUser) => {
        console.log(foundUser);
        console.log(submittedSecret);
            foundUser.secret = submittedSecret;
            foundUser.save().then(() => { res.redirect('/secrets'); });
        }).catch(err => { console.log(err); });
    });

app.get('/logout', function (req, res) {
    req.logout(function (err) {
        if (err) return next(err);
        res.redirect('/');
    });
});



app.listen(3000, function () {
    console.log("Server listening on port 3000");
});