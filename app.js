require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const md5 = require('md5');

const app = express();
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://127.0.0.1:27017/usersDB");
const userSchema = new mongoose.Schema({
    username: String,
    password: String
});

const User = mongoose.model('User', userSchema);

app.get('/', (req, res) => {
    res.render('home');
});
app.route('/login')
    .get(function (req, res) {
        res.render('login');
    })
    .post(function (req, res) {
        const username = req.body.username;
        const password = req.body.password;
        User.findOne({ username: username }).then(result => {
            if (result.password === password) {
                res.render('secrets');
            }
        }).catch(err => { console.log(err); });
    });
app.route('/register')
    .get(function (req, res) {
        res.render('register');
    })
    .post(function (req, res) {
        const user = new User({
            username: req.body.username,
            password: md5(req.body.password)
        });
        user.save()
            .then((result) => {
                res.render('secrets');
                console.log(result);
            }).catch((err) => { console.log(err); });
    });


app.listen(3000, function () {
    console.log("Server listening on port 3000");
});
