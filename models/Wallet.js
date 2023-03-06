const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create Schema
const WalletSchema = new Schema({
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
    type: {
        type: String,
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

const Wallet = mongoose.model('wallets', WalletSchema);
module.exports = Wallet;
