const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const DepositSchema = new Schema({
    user: {
        type: String,
        required: true
    },
    txn_id: {
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
      type: Number,
      required: true
    },
    status_text: {
      type: String
    },
    checkout_url: {
      type: String,
      required: true
    },
    status_url: {
      type: String,
      required: true
    },
    qrcode_url: {
      type: String,
      required: true
    },
    date: {
        type: Date,
        default: Date.now()
    }

})

const Deposit = mongoose.model('deposits', DepositSchema);
module.exports = Deposit;
