const mongoose= require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name:{
        type: String
    },
    email:{
        type: String
    },
    password:{
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    }
});

 module.exports = mongoose.model('users', UserSchema);