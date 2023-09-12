const mongoose= require('mongoose');
const Schema = mongoose.Schema;

const IdeaSchema = new Schema({
    title:{
        type: String
    },
    details:{
        type: String
    },
    user:{
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    }
});

 module.exports = mongoose.model('ideas', IdeaSchema);