const validator = require('validator');
const express = require('express');
const router = express.Router();


//load the models
const Deposit = require('../models/Deposit');
const User = require('../models/User');
const Referral = require('../models/Referral');
const Investment = require('../models/Investment');

// Auth
const {Authenticate} = require('../controllers/Authenticate');
const Withdrawal = require('../models/Withdrawal');

const basicPlan = process.env.basicPlan * 1;
const premiumPlan = process.env.premiumPlan * 1;


// @route   /deposit-history
// @desc    Returns the Deposit History Page
// @access  public
router.get('/deposit-history', Authenticate, (req, res) => {
    const {id, name, status} = req.user;

    User.findById(id)
    .then(user => {
        Deposit.find({user: id})
        .then(deposits => {
            res.render('deposit-history', {
                title: 'Deposit History - Awah Investment',
                user: user.toJSON(),
                deposits: deposits.map(deposit => deposit.toJSON()).reverse()
            });
        })
        
    })
    
});

// @route   /withdrawal-history
// @desc    Returns the Withdrawal History Page
// @access  public
router.get('/withdrawal-history', Authenticate, (req, res) => {
    const {id, name, status} = req.user;

    Withdrawal.find({user: id})
        .then(withdrawals => {
            User.findById(id)
                .then(user => {
                    res.render('withdrawal-history', {
                        title: 'Withdrawal History - Awah Investment',
                        user: user.toJSON(),
                        withdrawals: withdrawals.map(withdrawal => withdrawal.toJSON()).reverse()
                    });
                })
        })
    
});

// @route   /investment-history
// @desc    Returns the Investment History Page
// @access  public
router.get('/investment-history', Authenticate, (req, res) => {
    const {id, name, status} = req.user;

    User.findById(id)
    .then(user => {
        Investment.find({user: id})
            .then(investments => {
                res.render('investment-history', {
                    title: 'Investment History - Awah Investment',
                    user: user.toJSON(),
                    investments: investments.map(invest => {
                        const investment = invest.toJSON();
                        const percentage = investment.plan === 'basic'? basicPlan : premiumPlan;
                        const _daily = (investment.amount * percentage) / 100;
                        investment.daily = Math.round(_daily* 100) / 100; 
                        const days = investment.plan === 'basic'? 30 : 90;

                        const _totalPayout = (investment.payouts.reduce((a, b) => a + b, 0));
                        const totalPayout = Math.round(_totalPayout * 100) / 100;

                        const remainingPayout = Math.round( (investment.daily * (days - investment.days)) * 100) / 100;
                        investment.monthly = totalPayout + remainingPayout;

                        return investment;
                    }).reverse()
                });
            })
    })
    
});

// @route   /referral-history
// @desc    Returns the Referral History Page
// @access  public
router.get('/referral-history', Authenticate, (req, res) => {
    const {id, name, status} = req.user;

    User.findById(id)
    .then(user => {
        Referral.find({userID: id})
        .then(referrals => {
            res.render('referral-history', {
                title: 'Referral History - Awah Investment',
                user: user.toJSON(),
                referrals: referrals.map(referral => referral.toJSON()).reverse()
            });
        })
        
    })

});



module.exports = router;
