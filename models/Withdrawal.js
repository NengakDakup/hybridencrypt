const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const WithdrawalSchema = new Schema({
    user: {
        type: String,
        required: true
    },
    amountBTC: {
      type: Number,
      required: true
    },
    amountUSD: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      required: true
    },
    date: {
        type: Date,
        default: Date.now()
    }

})

const Withdrawal = mongoose.model('withdrawals', WithdrawalSchema);
module.exports = Withdrawal;
