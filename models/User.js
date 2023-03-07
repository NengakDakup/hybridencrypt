const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const UserSchema = new Schema({
    email: {
      type: String,
      required: true
    },
    password: {
        type: String,
    },
    resetPin: {
      type: String
    },
    date: {
        type: Date,
        default: Date.now()
    }

})

const User = mongoose.model('users', UserSchema);
module.exports = User;
