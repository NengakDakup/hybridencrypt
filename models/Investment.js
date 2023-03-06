const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const InvestmentSchema = new Schema({
    user: {
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
    payouts: {
      type: Array
    },
    days: {
      type: Number
    },
    lastUpdated: {
      type: Date
    },
    date: {
        type: Date,
        default: Date.now()
    }

})

const Investment = mongoose.model('investments', InvestmentSchema);
module.exports = Investment;
