const express = require('express');
//handlebars is used to design frontend template
const exphbs  = require('express-handlebars');
const methodOverride = require('method-override')
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
//bringing modal of ideas which we created
const Idea = require('./modals/idea');
const User = require('./modals/user');
const passport = require('passport')
require('./config/passport')(passport);
const flash = require('connect-flash');
const session = require('express-session');
var bcrypt = require('bcryptjs');
const {ensureAuthenticated} = require('./helpers/auth')

const app = express();

//handlebars middleware
var hbs = exphbs.create({ /* config */ });
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');


//connect with database
mongoose.connect('mongodb://localhost/vidjot-dev')
  .then(() => console.log('Mongodb Connected...'))
  .catch(err => console.log(err));


// const Idea = mongoose.model('ideas');

//Body-Parse Middleware basically used to access the data of body by req.body
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

//Override method middleware
app.use(methodOverride('_method'))

app.use(session({
    secret : 'secret',
    resave : true,
    saveUninitialized : true
}))

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use(function(req, res, next){
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    next();
})

app.get('/', (req, res) => {
    const title = "Welcome"
    res.render('index', {
        title : title
    });
});

app.get('/ideas', ensureAuthenticated, (req, res) => {
    Idea.find({user: req.user.id}).lean()
        .sort({date: 'desc'})
        .then(ideas => {
            res.render('ideas/index', {
                ideas : ideas
            });
        })
})

app.get('/ideas/add', ensureAuthenticated,  (req, res) => {
    res.render('ideas/add')
    console.log(req.body);
});

app.get('/ideas/edit/:id', ensureAuthenticated,  (req, res) => {
    Idea.findOne({
        _id: req.params.id
    }).lean()
    .then(idea => {
        if(idea.user != req.user.id){
            req.flash('error_msg', 'Not Authorized');
            res.redirect('/ideas')
        }else{
            res.render('ideas/edit', {
                idea : idea
            }) 
        } 
    })
})

app.post('/ideas', ensureAuthenticated,  (req, res) => {
    let errors = [];

    if(!req.body.title){
        errors.push({text: "Please enter the title"});
    }
    if(!req.body.details){
        errors.push({text: "Please enter the details"});
    }

    if(errors.length > 0){
        res.render('ideas/add', {
            errors : errors,
            title : req.body.title,
            details : req.body.details,
        });
    } else{
        const newUser = new Idea({
            title : req.body.title,
            details : req.body.details,
            user: req.user.id
        })
        newUser.save()
            .then(
                req.flash('success_msg', 'Video Idea Added'),
                res.redirect('/ideas'),
            )
    }
});

app.put('/ideas/:id', ensureAuthenticated,  (req, res) => {
    Idea.findOne({
        _id : req.params.id
    })
    .then(idea =>{
        idea.title = req.body.title;
        idea.details = req.body.details;

        idea.save()
            .then(idea => {
                req.flash('success_msg', 'Video Ideas Updated'),
                res.redirect('/ideas')
            })
    })
})

app.delete('/ideas/:id', ensureAuthenticated, (req, res) => {
    Idea.findByIdAndRemove({_id : req.params.id})
        .then(() => {
            req.flash('success_msg', 'Video Ideas deleted'),
            res.redirect('/ideas')
        })
})

app.get('/users/login', (req, res) => {
    res.render('users/login');
})

app.get('/users/register', (req, res) => {
    res.render('users/register');
})

app.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/ideas',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
});

app.post('/users/register', (req, res) => {
    let errors = [];

    if(req.body.password != req.body.password2){
        errors.push({text : 'Password must match'});
    }

    if(req.body.password.length < 4) {
        errors.push({text : 'Password must be greater then 4 characters'});
    }

    if(errors.length > 0){
        res.render('users/register', {
            errors: errors,
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            password2: req.body.password2
        })
    }else{
        User.findOne({email: req.body.email})
        .then(user => {
            if(user){
                req.flash('error_msg', "email already registered");
                res.redirect('/users/register')
            }else{
                const newUser = new User({
                    name: req.body.name,
                    email: req.body.email,
                    password: req.body.password,
                })
                bcrypt.genSalt(10, function(err, salt) {
                    bcrypt.hash(newUser.password, salt, function(err, hash) {
                        if(err) throw err;
                        newUser.password = hash;
                        newUser.save()
                        .then(user => {
                            req.flash('success_msg', 'You are now registered and can log in');
                            res.redirect('/users/login');
                        })
                        .catch(err => {
                            console.log(err);
                            return;
                        })
                    });
                });
            }
        })
    }
})

app.get('/logout', (req, res, next) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/users/login');
      });
    req.flash('success_msg', 'You are logout');
})

app.get('/about-us', (req, res) => {
    res.render('about')
});

const port = 5000;

app.listen(port, () => {
    console.log(`Server started on ${port}`);
});