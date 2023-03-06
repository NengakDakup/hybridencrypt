const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const ReferralSchema = new Schema({
    userID: {
      type: String,
      required: true
    },
    user: {
        type: String,
        required: true
    },
    invitedUser: {
        type: String,
        required: true
    },
    invitedUserID: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    plan: {
      type: String,
      required: true
    },
    status: {
      type: String
    },
    date: {
        type: Date,
        default: Date.now()
    }

})

const Referral = mongoose.model('referrals', ReferralSchema);
module.exports = Referral;
