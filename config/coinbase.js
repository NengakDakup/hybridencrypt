var coinbase = require('coinbase-commerce-node');
const axios = require('axios');
var Client = coinbase.Client;
var Charge = coinbase.resources.Charge;

const dotenv = require('dotenv');
dotenv.config();


Client.init('338ac2f2-5d8f-4368-8741-924d00195be0');

async function getBTCRate(){
    let res = await axios.get('https://api.coinbase.com/v2/prices/spot?currency=USD')
    
    return res.data;
}

async function createDeposit(opts){
    const {amountBTC, amountUSD, name, email} = opts;

    var chargeData = {
        'name': 'Multiflex Trade Deposit',
        'description': `Deposit of $${amountUSD} for ${name}`,
        'local_price': {
            'amount': amountBTC,
            'currency': 'BTC'
        },
        'pricing_type': 'fixed_price'
    
    };
    
    const response = await Charge.create(chargeData, (error, response) => {
        console.log(error);
        return response;
    });

    return response;

    //neeeds to return:
    //txn_id
    //checkout_url
    //status_url
    //qrcode_url
}

module.exports = {getBTCRate, createDeposit};





