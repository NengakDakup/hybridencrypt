const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const UserSchema = new Schema({
    fullname: {
        type: String,
        required: true
    },
    email: {
      type: String,
      required: true
    },
    wallet: {
      type: String,
      required: true
    },
    nationality: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    password: {
        type: String,
    },
    verified: {
      type: Boolean
    },
    verifyCode: {
      type: String
    },
    balance: {
      withdrawable: {
        type: Number
      },
      nonWithdrawable: {
        type: Number
      },
      pending: {
        type: Number
      }
    },
    referralCode: {
      type: String,
      required: true
    },
    referredBy: {
      type: String,
    },
    resetPin: {
      type: String
    },
    status: {
      type: String
    },
    date: {
        type: Date,
        default: Date.now()
    }

})

const User = mongoose.model('users', UserSchema);
module.exports = User;
