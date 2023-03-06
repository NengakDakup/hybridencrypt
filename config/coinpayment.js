const CoinPayment = require('coinpayments');

const dotenv = require('dotenv');
dotenv.config();

const client = new CoinPayment({key: process.env.publicKey, secret: process.env.privateKey});

async function getBTCRate(){
    // let res = await client.rates({short: 1, accepted: 0});
    // return res;
    return {USD: {rate_btc: 2.5e-5}}
}

async function createDeposit(opts){
    CoinpaymentsCreateTransactionOpts = {
        currency1: 'BTC',
        currency2: 'BTC',
        amount: opts.amount,
        buyer_email: opts.email,
        // address?: string,
        buyer_name: opts.name,
        item_name: "Awah Investment Deposit",
        // item_number?: string, 
        // invoice: opts.invoice,
        // custom?: string,
        // ipn_url?: string,
        success_url: `${process.env.server}/dashboard/msg=Your Deposit of $${opts.amount} is successful and will soon reflect on your dashboard`,
        cancel_url: `${process.env.server}/dashboard/msg=Your Deposit Was not Successful`,
      };

      let res = await client.createTransaction(CoinpaymentsCreateTransactionOpts);
      return res;
}

module.exports = {getBTCRate, createDeposit};