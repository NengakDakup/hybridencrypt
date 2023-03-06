const Investment = require('../models/Investment');
const User = require('../models/User');

const dotenv = require('dotenv');
dotenv.config();

const Mailer = require('./Mailer');

const basicPlan = process.env.basicPlan * 1;
const premiumPlan = process.env.premiumPlan * 1;


const Investor = () => {
    

    Investment.find({status: 'active'})
        .then(investments => {
            //check for investments with more than 23hrs last updated
            const dueInvestments = investments.filter(investment => {

                const today = Date.now();
                const lastUpdated = investment.lastUpdated.getTime();

                //get the difference in hours b/w last updated and now
                const hours = Math.floor((today - lastUpdated) / (60 * 60 * 1000));
                return true;//hours >= 23; // meant to be 23
            });

            if(dueInvestments.length >=1){
                UpdateDetails(dueInvestments);
            } else {
                return 0;
            }
        })
}     

async function UpdateDetails(investments){
    for (const investment of investments){

        const percentage = investment.plan === 'basic'? basicPlan : premiumPlan;
        const _dailyProfits = (percentage * investment.amount) / 100;
        const dailyProfits = Math.round(_dailyProfits * 100) / 100;

        const user = await User.findById(investment.user);
        user.balance.withdrawable += dailyProfits;
        user.balance.withdrawable = Math.round(user.balance.withdrawable * 100) / 100;

        investment.lastUpdated = Date.now();
        investment.days += 1;
        investment.payouts.push(dailyProfits);
        
        const limit = investment.plan === 'basic'? 30 : 90;

        if(investment.days >= limit){
            investment.status = 'completed';
            user.balance.withdrawable += investment.amount;
            user.balance.nonWithdrawable -= investment.amount;
            //send investment ended mail
            Mailer(user.email, 'investment_completed', {email: user.email, name: user.firstname, title: 'Investment Completed', investment: investment});
        }

        const updatedInvestment = await investment.save();
        const updatedUser = await user.save();


        console.log('Investment Updated', updatedInvestment, updatedUser);
        console.log('daily profits:', dailyProfits);
    }
}

module.exports = Investor;