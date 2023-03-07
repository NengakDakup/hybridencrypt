const validator = require('validator');
const express = require('express');
const router = express.Router();

const dotenv = require('dotenv');
dotenv.config();



//Models
const User = require('../models/User');


// Mailer function 
const Mailer = require('../controllers/Mailer');

const {Authenticate} = require('../controllers/Authenticate');



const { server } = process.env;


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
 
// @route   /logout
// @desc    Logs the user out
// @access  public
router.get('/logout', Authenticate, (req, res) => {
    res.clearCookie('token');
    res.redirect('/login?msg=Successfully Logged Out!');
});



module.exports = router;
