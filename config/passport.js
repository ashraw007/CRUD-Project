const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

const User = require('../modals/user');

module.exports = function(passport){
    passport.use(new LocalStrategy({usernameField: 'email'}, (email, password, done) => {
        User.findOne({
            email: email
        }).then(user => {
            if(!user){
                return done(null, false, {message: "No User Found"});
            }
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if(err) throw err
                if(isMatch){
                    return done(null, user);
                }else {
                    return done(null, false, {message: 'Password Incorrect'})
                }
            })

        })
    }))

    passport.serializeUser(function(user, cb) {
        process.nextTick(function() {
          cb(null, { id: user.id, username: user.username });
        });
      });
      
      passport.deserializeUser(function(user, cb) {
        process.nextTick(function() {
          return cb(null, user);
        });
      });
}