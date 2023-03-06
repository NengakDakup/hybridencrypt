const validator = require('validator');
const express = require('express');
const router = express.Router();

const dotenv = require('dotenv');
dotenv.config();

// load coinpayment functions
const {getBTCRate, createDeposit} = require('../config/coinbase');


//Models
const User = require('../models/User');
const Deposit = require('../models/Deposit');
const Investment = require('../models/Investment');
const Referral =  require('../models/Referral');
const Wallet = require('../models/Wallet');

// Mailer function 
const Mailer = require('../controllers/Mailer');

const {Authenticate} = require('../controllers/Authenticate');
const Withdrawal = require('../models/Withdrawal');

const basicPlan = process.env.basicPlan * 1;
const premiumPlan = process.env.premiumPlan * 1;

const { server } = process.env;
const minDeposit = process.env.minDeposit * 1;
const minWithdraw = process.env.minWithdraw * 1;

// @route   /dashboard
// @desc    Returns the Dashboard Page
// @access  private
router.get('/dashboard', Authenticate, (req, res) => {
    const {id, name, status} = req.user;

    User.findById(id)
        .then(user => {

            Investment.find({user: id})
                .then(investments => {
                    activeInvestments = investments.filter(investment => investment.status === 'active').reverse();
                    
                    res.render('dashboard', {
                        title: 'Dashboard - Mondex',
                        user: user.toJSON(),
                        msg: req.query.msg,
                        type: req.query.msgType,
                        server: server,
                        activeInvestments: activeInvestments.map(investment => {
                            let invest = investment.toJSON();

                            const percentage = invest.plan === 'basic'? basicPlan : premiumPlan;
                            const dailyProfits = (percentage * invest.amount) / 100;
                            const _totalProfits = investment.payouts.reduce((a, b) => a + b, 0);
                            const totalProfits = Math.round(_totalProfits * 100) / 100;

                            // invest.days = invest.plan === 'basic'? 30 : 90;
                            invest.totalProfits = totalProfits;
                            
                            
                            return invest;
                            
                        })
                    });
                    
                })        
        })
    
});

// @route   /profile
// @desc    Returns the Profile Page
// @access  private
router.get('/profile', Authenticate, (req, res) => {
    const {id, name, status} = req.user;
    User.findById(id)
        .then(user => {
            res.render('profile', {
                title: name + ' Profile - Mondex',
                user: user.toJSON(),
                msg: req.query.msg
            });        
        })

})

// @route   /deposit
// @desc    Returns the Deposit Page
// @access  private
router.get('/deposit', Authenticate, (req, res) => {
    const {id, name, status} = req.user;

    User.findById(id)
        .then(user => {
            res.render('deposit', {
                title: 'Deposit - Mondex',
                user: user.toJSON(),
                msg: req.query.msg,
                type: req.query.msgType,
                minDeposit
            });        
        })
})


// @route   /wallet
// @desc    Returns the Wallet Page
// @access  private
router.get('/wallet', Authenticate, (req, res) => {
    const {id, name, status} = req.user;
    User.findById(id)
        .then(user => {
            res.render('wallet', {
                title: 'Wallet - Mondex',
                user: user.toJSON(),
                msg: req.query.msg,
                minDeposit,
                minWithdraw
            });        
        })
});

// @route   /confirm-deposit
// @desc    Gets the deposit details and Returns the Confirm Deposit Page
// @access  private
router.post('/confirm-deposit', Authenticate, (req, res) => {
    const {id, name, status} = req.user;
    const {amountUsd} = req.body;
    
    if(amountUsd && validator.isInt(amountUsd)){
        if(amountUsd < minDeposit){
            return res.redirect(`/deposit?msg=You cannot deposit an amount less than $${minDeposit}&msgType=danger`);
        }

        getBTCRate().then(data => {

            //price of 1 btc in usd
            const BTC_USD = data.data.amount * 1;
            // 1 - 31788
            // x - 500
            //divide 
            const amountBTCLong =  amountUsd / BTC_USD;

            // reduce the decimal points
            let amountBTC = Math.round((amountBTCLong) * 100000000) / 100000000;

            User.findById(id)
            .then(user => {
                let usr = user.toJSON();

                res.render('confirm-deposit', {
                    title: 'Confirm Deposit - Mondex',
                    user: usr,
                    amountUSD: amountUsd,
                    amountBTC: amountBTC,
                    newBalance: usr.balance.withdrawable + parseInt(amountUsd, 10),
                    rate: Math.round((1 / BTC_USD) * 100000000) / 100000000
                });
                        
            })    
        })

    } else {
        res.redirect('/deposit?msg=Please Enter a Valid Deposit Amount&msgType=danger')
    }
})

// @route   /create-deposit
// @desc    Creates a coinpayment transaction and redirects to the checkout page
// @access  private
router.get('/create-deposit', Authenticate, (req, res) => {
    const {id, name, status} = req.user;
    const {amountBTC, amountUSD} = req.query;

    if(amountBTC && amountUSD && validator.isInt(amountUSD)){
        if(amountUSD < minDeposit){
            return res.redirect(`/deposit?msg=Amount Cannot be Less Than ${minDeposit}&msgType=danger`);
        };

        User.findById(id)
        .then(user => {
            
            const opts = {
                amountBTC: amountBTC,
                amountUSD: amountUSD,
                email: user.email,
                name: user.fullname
            };

            getBTCRate().then(data => {

                //price of 1 btc in usd
                const BTC_USD = data.data.amount * 1;
                // 1 - 31788
                // x - 500
                //divide 
                const amountBTCLong =  amountUSD / BTC_USD;

                // reduce the decimal points
                let currentAmountBTC = Math.round((amountBTCLong) * 100000000) / 100000000;

                let dif = currentAmountBTC - amountBTC;
                
                
                if(dif >= 0.00007){
                    return res.redirect('/deposit?msg=Current Rates Updated. Please restart Transaction&msgType=danger');
                }

                

                createDeposit(opts).then(data => {
                    
                    const newDeposit = new Deposit({
                        user: id,
                        txn_id: data.id,
                        amountBTC: amountBTC,
                        amountUSD: amountUSD,
                        status: 0,
                        status_text: 'Pending Approval',
                        checkout_url: data.hosted_url,
                        status_url: 'data.status_url',
                        qrcode_url: 'data.qrcode_url'
                    });
    
                    newDeposit.save().then(deposit => {
                        // create wallet record
                        const newWalletRecord = new Wallet({
                            user: id,
                            txn_id: data.id,
                            amountBTC: amountBTC,
                            amountUSD: amountUSD,
                            type: 'Deposit',
                            status: 'Pending'

                        });
                        newWalletRecord.save().then(wallet => res.redirect(deposit.checkout_url))
                    });
                }).catch(err => res.redirect('/deposit?msg=An Unknown Error Occured, Please Try Again&msgType=danger'));

            })

            
        })

    } else {
        return res.redirect('/deposit?msg=Please Enter Valid Amounts&msgType=danger');
        
    }

})

// @route   /update-deposit
// @desc    Coinpayment IPN
// @access  private
router.post('/update-deposit', (req, res) => {
    console.log({'webhook': req.body.event.data});

    // const rawBody = req.rawBody;
    // const signature = req.headers['x-cc-webhook-signature'];
    // const webhookSecret = process.env.webHookSecret;

    // try {
    //     Webhook.verifySigHeader(rawBody, signature, webhookSecret);
    // } catch (error) {
    //     console.log(error);   
    // }

    const {id, timeline} = req.body.event.data;

    console.log(req.body.event.data);

    // console.log({'timeline': timeline});

    //check to see if payment is confirmed
    const lastTimeline = timeline[timeline.length-1];
    
    if(lastTimeline.status == 'COMPLETED' || lastTimeline.status === 'RESOLVED'){
            let status = 100;
            Deposit.findOne({txn_id: id})
                .then(deposit => {
                    if(deposit.status >= 100){
                        return res.json({msg: 'Deposit Has Already Been Confirmed'});
                    } else if(status >= 100){
                        deposit.status = status;
                        deposit.status_text = "Approved";
                        deposit.save()
                            .then(saveDeposit => {
                                
                                User.findById(deposit.user)
                                    .then(user => {
                                        user.balance.withdrawable += deposit.amountUSD;
                                        user.save().then(user => {
                                            // update wallet record
                                            Wallet.findOne({txn_id: id}).then(wallet => {
                                                wallet.status = 'Completed';
                                                wallet.save().then(wallet => {
                                                    // Send confirmation mail
                                                    Mailer(user.email, 'deposit_success', {email: user.email, name: user.fullname, title: 'Deposit Success', amount: deposit.amountUSD});
                                                    return res.json({msg: 'Deposited Has been Successfully Confirmed', status: true});
                                                })
                                            })
                                            
                                        })
                                    })
                            
                        });
                    }
                }).catch(err => res.status(200).json({error: 'Unknown Error'}))
    } else {
        res.status(200).send('good');
    }

    //some checks still need to be performed

    // hmac authentication
    // ipn_type has to be api
    // payment status of 2


    // also remember mailing

    
})


// @route   /withdraw
// @desc    Returns the Withdraw Page
// @access  private
router.get('/withdraw', Authenticate, (req, res) => {
    const {id, name, status} = req.user;
    User.findById(id)
        .then(user => {
            res.render('withdraw', {
                title: 'Withdraw - Mondex',
                user: user.toJSON(),
                msg: req.query.msg,
                type: req.query.msgType,
                minWithdraw
            });        
        })
});

// @route   /confirm-withdraw
// @desc    Returns the Confirm Withdraw Page
// @access  private
router.post('/confirm-withdraw', Authenticate, (req, res) => {
    const {id, name, status} = req.user;
    const {amount} = req.body;

    if(!amount){
        return res.redirect('/withdraw?msg=Please Enter A Valid Withdrawal Amount&msgType=danger');
    } else if(amount < minWithdraw){
        return res.redirect(`/withdraw?msg=You cannot Withdraw Less than ${minWithdraw}&msgType=danger`);
    } else {
        User.findById(id).then(user => {
            if(user.balance.withdrawable < amount){
                return res.redirect(`/withdraw?msg=You don't have up to $ ${amount} in your withdrawable account&msgType=danger`);
            } else {
                getBTCRate().then(data => {

                    //price of 1 btc in usd
                    const BTC_USD = data.data.amount * 1;
                    // 1 - 31788
                    // x - 500
                    //divide 
                    const amountBTCLong =  amount / BTC_USD;

                    // reduce the decimal points
                    let amountBTC = Math.round((amountBTCLong) * 100000000) / 100000000;

                    User.findById(id).then(user => {
                        res.render('confirm_withdrawal', {
                            title: 'Confirm Withdrawal - Mondex',
                            user: user.toJSON(),
                            amountUSD: amount,
                            amountBTC: amountBTC
                        });        
                    })
                })
            }
        })
    }
});

// @route   /make-withdraw
// @desc    Returns the Make Withdraw Page
// @access  private
router.get('/make-withdraw', Authenticate, (req, res) => {
    const {id, name, status} = req.user;
    const {amountBTC, amountUSD} = req.query;

    const data = {
        user: id,
        amountBTC: amountBTC,
        amountUSD: amountUSD,
        status: 'Pending Approval'
    };

    const newWithdrawal = new Withdrawal(data);

    newWithdrawal.save().then(withdrawal => {
        const newWalletRecord = new Wallet({
            user: id,
            txn_id: withdrawal._id,
            amountBTC: amountBTC,
            amountUSD: amountUSD,
            type: 'Withdrawal',
            status: 'Pending'

        });
        newWalletRecord.save().then(wallet => {
            User.findById(id).then(user => {
                Mailer(user.email, 'withdrawal_request', {email: user.email, name: user.fullname, title: 'Withdrawal Request', amount: amountUSD});
                res.redirect('/dashboard?msg=Your Withdrawal Request has been Sent, And will be Paid to your wallet after successful verification.')
            })
        })
    })

})


// @route   /invest
// @desc    Returns the Investment Page
// @access  private
router.get('/invest', Authenticate, (req, res) => {
    const {id, name, status} = req.user;
    User.findById(id)
        .then(user => {
            res.render('invest', {
                title: 'Investment - Mondex',
                user: user.toJSON()
            });        
        })
});

// @route   /invest-plan
// @desc    Returns the Investment Plan select Page
// @access  private
router.get('/invest-plan', Authenticate, (req, res) => {
    const {id, name, status} = req.user;
    const {plan, msg} = req.query;

    

    if(plan !== 'basic' && plan !== 'premium'){
        return res.redirect('/invest');
    }
    
    User.findById(id)
        .then(user => {
            res.render('invest-plan', {
                title: 'Make an Investment - Mondex',
                user: user.toJSON(),
                plan: plan,
                planDetails: plan === 'basic'? 'Basic Plan - 12% (0.4% daily)' : 'Premium Plan - 60% (0.67% daily)',
                minimum: plan === 'basic'? 30 : 1000,
                msg: msg
            });        
        })
});

// @route   /confirm-investment
// @desc    Returns the confirm Investment Plan Page
// @access  private
router.post('/confirm-investment', Authenticate, (req, res) => {
    const {id, name, status} = req.user;

    const {amount, plan} = req.body;

    // if plan type is not basic or premium
    if(plan !== 'basic' && plan !== 'premium'){
        return res.redirect('/invest');
    }

    //amount less than 50 || 100h
    if(plan === 'basic'){
        if((amount * 1) < 30){
            return res.redirect(`/invest-plan?msg=Minimum for Basic plan is $30 USD&plan=${plan}`)
        } else if((amount * 1) > 999){
            return res.redirect(`/invest-plan?msg=Maximum for Basic plan is $999 USD&plan=${plan}`)
        }
    } else if(plan === 'premium'){
        if((amount * 1) < 1000){
            return res.redirect(`/invest-plan?msg=Minimum for Premium plan is $1000 USD&plan=${plan}`);
        }
    }

    //amount not a number
    if(!validator.isInt(amount)){
        return res.redirect(`/invest-plan?msg=Please enter a valid amount&plan=${plan}`);
    }

    // amount not available

    const percentage = plan === 'basic'? basicPlan : premiumPlan;

    const _daily = (amount * percentage) / 100; 
    const daily = Math.round(_daily * 100) / 100;

    const _monthly = daily * 30;
    const monthly = Math.round(_monthly * 100) / 100;
    
    const total = (amount * 1) + (plan === 'basic'? monthly: monthly * 3);
    
    
    User.findById(id)
        .then(user => {

            if((amount*1) > user.balance.withdrawable) {
                return res.redirect(`/invest-plan?msg=Account Balance not sufficient, please deposit first&plan=${plan}`);
            }
            res.render('confirm-investment', {
                title: 'Confirm Investment - Mondex',
                user: user.toJSON(),
                amount: amount,
                plan: plan,
                planDetails: plan === 'basic'? 'Basic Plan - 12% (0.4% daily)' : 'Premium Plan - 60% (0.67% daily)',
                daily: daily,
                monthly: monthly,
                total: total,
                days: plan === 'basic'? 30 : 90
                
            });        
        })
});


// @route   /create-investment
// @desc    Creates the Investment
// @access  private
router.post('/create-investment', Authenticate, (req, res) => {
    const {id, name, status} = req.user;

    const {amount, plan} = req.body;
    
    // if plan type is not basic or premium
    if(plan !== 'basic' && plan !== 'premium'){
        return res.redirect('/invest');
    }

    //amount less than 50 || 100h
    if(plan === 'basic'){
        if((amount * 1) < 30){
            return res.redirect(`/invest-plan?msg=Minimum for Basic plan is $30 USD&plan=${plan}`)
        } else if((amount * 1) > 999){
            return res.redirect(`/invest-plan?msg=Maximum for Basic plan is $999 USD&plan=${plan}`)
        }
    } else if(plan === 'premium'){
        if((amount * 1) < 1000){
            return res.redirect(`/invest-plan?msg=Minimum for Premium plan is $1000 USD&plan=${plan}`);
        }
    }

    //amount not a number
    if(!validator.isInt(amount)){
        return res.redirect(`/invest-plan?msg=Please enter a valid amount&plan=${plan}`);
    }

    // check if user already has two active investments
    Investment.find({user: id})
        .then(investments => {
            let skipReferral = false;
            activeInvestments = investments.filter(investment => investment.status === 'active');

            // if(activeInvestments.length >= 2){
            //     return res.redirect(`/invest-plan?msg=You cannot have more than two active investments at a time&plan=${plan}`);
            // }

            if(investments.length >= 1){
                skipReferral = true;
            }


            const details = {
                user: id,
                amount: amount,
                plan: plan,
                status: 'active',
                days: 0,
                lastUpdated: Date.now(),
                date: Date.now()
            };
        
            const newInvestment = new Investment(details);
            newInvestment.save().then(investment => {
                User.findById(investment.user)
                    .then(user => {
                        // deduct the users balance for the investment that was made
                        user.balance.withdrawable -= investment.amount;
                        user.balance.nonWithdrawable += investment.amount;

                        user.save().then(user => {

                            // send investment confirm mail
                            process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;
                            Mailer(user.email, 'investment_confirmation', {email: user.email, name: user.fullname, title: 'Investment Confirmation', plan: investment.plan, amount: investment.amount});

                            //referral feature
                            if(user.referredBy){
                                User.findOne({referralCode: user.referredBy})
                                    .then(user =>  {
                                        if(user){
                                            //find users account type
                                            const accountType = user.status;
                                            if(accountType === 'normal' && skipReferral) return res.redirect('/dashboard?msg=Your Investment Has Been Successfuly Created. Sit down and make your profits!');
                                            // if account type is Agent or Super Agent then skipreferral = false
                                            // Use Logic to set percentage
                                            let percent = investment.plan === 'basic'? 0.03 : 0.1;
                                            if(accountType === 'agent') percent = 0.1;
                                            if(accountType === 'agent' && skipReferral) percent = 0.03;
                                            if(accountType === 'super-agent') percent = 0.1;
                                            const _gain = investment.amount * percent;
                                            const gain = Math.round(_gain * 100) / 100;
                                            user.balance.withdrawable += gain;
                                            user.save().then(user => {
                                                const referralDetails = {
                                                    userID: user._id,
                                                    user: user.fullname,
                                                    invitedUser: name,
                                                    invitedUserID: id,
                                                    amount: gain,
                                                    plan: investment.plan + '(' + '$' + investment.amount + ')',
                                                    status: 'Paid'
                                                };
                                                const newReferral = new Referral(referralDetails);
                                                newReferral.save().then(referral => {

                                                    //send the referral mail here
                                                    Mailer(user.email, 'referral_history', {email: user.email, title: 'Referral Bonuses', plan: referral.plan, amount: referral.amount});
                                                    
                                                    return res.redirect('/dashboard?msg=Your Investment Has Been Successfuly Created. Sit down and make your profits!')
                                                })
                                            })
                                        } else {
                                            return res.redirect('/dashboard?msg=Your Investment Has Been Successfuly Created. Sit down and make your profits!')
                                        }
                                    })
                            } else {
                                return res.redirect('/dashboard?msg=Your Investment Has Been Successfuly Created. Sit down and make your profits!')
                            }
                            
                        })
                    })
                
            })
        })
});

// @route   /logout
// @desc    Logs the user out
// @access  public
router.get('/logout', Authenticate, (req, res) => {
    res.clearCookie('token');
    res.redirect('/login?msg=Successfully Logged Out!');
});



module.exports = router;
