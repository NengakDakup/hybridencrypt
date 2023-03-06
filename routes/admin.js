const express = require('express');
const router = express.Router();
const axios = require('axios');
const bcrypt = require('bcrypt');
const validator = require('validator');
const formidable = require('formidable');

const dotenv = require('dotenv');
dotenv.config();

const {AuthenticateAdmin} = require('../controllers/Authenticate');

const Mailer = require('../controllers/Mailer');

const basicPlan = process.env.basicPlan * 1;
const premiumPlan = process.env.premiumPlan * 1;


const User = require('../models/User');
const Investment = require('../models/Investment');
const Deposit = require('../models/Deposit');
const Referral = require('../models/Referral');
const Withdrawal = require('../models/Withdrawal');
const Post = require('../models/Post');

// @route   /admin
// @desc    Returns the Admin Page
// @access  private
router.get('/', AuthenticateAdmin, (req, res) => {

    const stats = {
        registeredUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        totalDeposit: 0,
        activeInvestments: 0,
        completedInvestments: 0,
        totalWithdrawal: 0,
    };
    

    //registered users count
    User.find().then(users => {
        stats.registeredUsers = users.length;

        // active users count
        // this will be found through active investments
        Investment.find().then(investments => {
            const activeInvestments = [];
            const completedInvestments = [];

            investments.forEach(investment => {
                if(investment.status === 'active'){
                    activeInvestments.push(investment);
                }
                if(investment.status === 'completed'){
                    completedInvestments.push(investment);
                }
            })

            const activeUsers = [];
            activeInvestments.forEach(investment => {
                if(!activeUsers.includes(investment.user)){
                    activeUsers.push(investment.user);
                }
            });
                
            // active users count
            stats.activeUsers = activeUsers.length;
            // inactive users count
            stats.inactiveUsers = stats.registeredUsers - stats.activeUsers;
            // active investments counts
            stats.activeInvestments = activeInvestments.length;
            // Completed Investments Count
            stats.completedInvestments = completedInvestments.length;

            // total deposits
            Deposit.find({status: 100}).then(deposits => {
                let totalDeposit = 0;
                deposits.forEach(deposit => {
                    totalDeposit += deposit.amountUSD;
                })

                stats.totalDeposit = totalDeposit;

                // total withdrawals
                Withdrawal.find({status: 'Approved'}).then(withdrawals => {
                    let totalWithdrawal = 0;
                    withdrawals.forEach(withdrawal => {
                        totalWithdrawal += withdrawal.amountUSD;
                    })

                    stats.totalWithdrawal = totalWithdrawal;

                    User.findById(req.user.id)
                        .then(user => {
                            res.render('admin', {
                                title: 'Admin - Awah Investment',
                                user: user.toJSON(),
                                stats: stats
                            });
                        }) 

                })

                 
            }) 
        })
    })    
})


// @route   /admin/deposits
// @desc    Returns the Admin Deposits Page
// @access  private
router.get('/deposits', AuthenticateAdmin, (req, res) => {
    Deposit.find().then(deposits => {
        User.findById(req.user.id)
            .then(user => {
                res.render('admin_deposits', {
                    title: 'Deposits - Admin Awah Investment',
                    user: user.toJSON(),
                    msg: req.query.msg,
                    deposits: deposits.map(deposit => deposit.toJSON()).reverse()
                });
            })  
    })
})

// @route   /admin/deposits
// @desc    Returns the Admin Deposits Page With the User that was searched For
// @access  private
router.post('/deposits', AuthenticateAdmin, (req, res) => {
    const id = req.body.id.trim();

    if(!id) return res.redirect('/admin/deposits?msg=Deposit ID is required');

    Deposit.find({txn_id: id}).then(deposits => {
        User.findById(req.user.id)
            .then(user => {
                res.render('admin_deposits', {
                    title: 'Deposits - Admin Awah Investment',
                    user: user.toJSON(),
                    msg: deposits.length > 0? `${deposits.length} Deposit Was Found with ID ${id}` : 'No Deposit Was Found Matching that Particular ID',
                    deposits: deposits.map(deposit => deposit.toJSON()).reverse()
                });
            })  
    })
})

// @route   /admin/confirm-deposit
// @desc    Admin Confirm deposit functionality
// @access  private
router.post('/confirm-deposit', AuthenticateAdmin, (req, res) => {

    const {txn_id} = req.body;

    Deposit.findOne({txn_id: txn_id})
        .then(deposit => {
            const config = {
                headers: {
                    hmac: 'value',
                }
            };
            axios.post(process.env.server + '/update-deposit', {
                status: 100,
                txn_id: deposit.txn_id,
                status_text: 'Approved',
                merchant: process.env.merchant
            }, config).then(response => res.redirect(`/admin/deposits?msg=${response.data.msg}`))
                .catch(err => console.log(err))
        })
});

// @route   /admin/withdrawals
// @desc    Returns All the Withdrawals
// @access  private
router.get('/withdrawals', AuthenticateAdmin, (req, res) => {
    Withdrawal.find().then(withdrawals => {
        User.findById(req.user.id)
            .then(user => {
                res.render('admin_withdrawals', {
                    title: 'Withdrawals - Admin Awah Investment',
                    user: user.toJSON(),
                    msg: req.query.msg,
                    withdrawals: withdrawals.map(withdrawal => withdrawal.toJSON()).reverse()
                })
            })
    })
});

// @route   /admin/withdrawals
// @desc    Returns All the Withdrawals that match the searched ID
// @access  private
router.post('/withdrawals', AuthenticateAdmin, (req, res) => {
    const id = req.body.id.trim();
    if(!id) return res.redirect('/admin/withdrawals?msg=Withdrawal ID is required For search');

    Withdrawal.find({_id: id}).then(withdrawals => {
        User.findById(req.user.id)
            .then(user => {
                res.render('admin_withdrawals', {
                    title: 'Withdrawals - Admin Awah Investment',
                    user: user.toJSON(),
                    msg: withdrawals.length > 0? `${withdrawals.length} Withdrawal Was Found with ID ${id}` : 'No Withdrawal Was Found Matching that Particular ID',
                    withdrawals: withdrawals.map(withdrawal => withdrawal.toJSON()).reverse()
                })
            })
    }).catch(err => res.redirect('/admin/investments?msg=Please Enter a Valid Investment ID'))
});

// @route   /admin/make-withdrawal
// @desc    Confirms A Withdrawal
// @access  private
router.post('/make-withdrawal', AuthenticateAdmin, (req, res) => {
    const {id} = req.body;

    Withdrawal.findById(id).then(withdrawal => {
        if(withdrawal.status === 'Approved') return res.redirect('/admin/withdrawals?msg=Withdrawal Has Already Been Confirmed!');
        User.findById(withdrawal.user)
            .then(user => {
                if(user.balance.withdrawable < withdrawal.amountUSD){
                    res.redirect('/admin/withdrawals?msg=User Does Not Have Sufficient Funds');
                } else {
                    // update users acct balance 
                    user.balance.withdrawable -= withdrawal.amountUSD;
                    user.save().then(user => {
                        //update withdrawal status
                        withdrawal.status = 'Approved';
                        // Withdrawal Confirmation Mail
                        Mailer(user.email, 'withdrawal_success', {email: user.email, name: user.firstname, title: 'Withdrawal Success', amount: withdrawal.amountUSD});
                        withdrawal.save().then(withdrawal => res.redirect('/admin/withdrawals?msg=Withdrawal Has Been Confirmed!'))
                    })
                }
            })
    })
});

// @route   /admin/investments
// @desc    Returns All the Investments
// @access  private
router.get('/investments', AuthenticateAdmin, (req, res) => {
    Investment.find().then(investments => {
        User.findById(req.user.id)
            .then(user => {
                res.render('admin_investments', {
                    title: 'Investments - Admin Awah Investment',
                    user: user.toJSON(),
                    msg: req.query.msg,
                    investments: investments.map(invest => {
                        const investment = invest.toJSON();
                        const percentage = investment.plan === 'basic'? basicPlan : premiumPlan;
                        const _daily = (investment.amount * percentage) / 100;
                        investment.daily = Math.round( _daily* 100) / 100; 
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

// @route   /admin/investments
// @desc    Returns All the Investments
// @access  private
router.post('/investments', AuthenticateAdmin, (req, res) => {
    const id = req.body.id.trim();
    if(!id) return res.redirect('/admin/investments?msg=Please Enter a Valid Investment ID');

    Investment.find({_id: id}).then(investments => {
        User.findById(req.user.id)
            .then(user => {
                res.render('admin_investments', {
                    title: 'Investments - Admin Awah Investment',
                    user: user.toJSON(),
                    msg: investments.length > 0? `${investments.length} Investment Was Found with ID ${id}` : 'No Investment Was Found Matching that Particular ID',
                    investments: investments.map(invest => {
                        const investment = invest.toJSON();
                        const percentage = investment.plan === 'basic'? basicPlan : premiumPlan;
                        const _daily = (investment.amount * percentage) / 100;
                        investment.daily = Math.round( _daily* 100 ) / 100; 
                        const days = investment.plan === 'basic'? 30 : 90;

                        const _totalPayout = (investment.payouts.reduce((a, b) => a + b, 0));
                        const totalPayout = Math.round(_totalPayout * 100) / 100;

                        const remainingPayout = Math.round( (investment.daily * (days - investment.days)) * 100) / 100;
                        investment.monthly = totalPayout + remainingPayout;

                        return investment;
                    }).reverse()
                });
            })
    }).catch(err => res.redirect('/admin/investments?msg=Please Enter a Valid Investment ID'))
});

// @route   /admin/referrals
// @desc    Returns All the Referrals
// @access  private
router.get('/referrals', AuthenticateAdmin, (req, res) => {
    Referral.find().then(referrals => {
        User.findById(req.user.id)
            .then(user => {
                res.render('admin_referrals', {
                    title: 'Referrals - Admin Awah Investment',
                    user: user.toJSON(),
                    msg: req.query.msg,
                    referrals: referrals.map(invest => invest.toJSON()).reverse()
                })
            })
    })
});

// @route   /admin/referrals
// @desc    Returns A Specific Referral
// @access  private
router.post('/referrals', AuthenticateAdmin, (req, res) => {
    const id = req.body.id.trim();
    if(!id) return res.redirect('/admin/referrals?msg=Please Enter a Valid Referral ID');

    Referral.find({_id: id}).then(referral => {
        User.findById(req.user.id)
            .then(user => {
                res.render('admin_referrals', {
                    title: 'Referrals - Admin Awah Investment',
                    user: user.toJSON(),
                    msg: referral.length > 0? `${referral.length} Referral Was Found with ID ${id}` : 'No Referral Was Found Matching that Particular ID',
                    referrals: referral.map(refer => refer.toJSON()).reverse()
                });
            })
    }).catch(err => res.redirect('/admin/referrals?msg=Please Enter a Valid Referral ID'))
});

// @route   /admin/blog
// @desc    Returns the admin blog page
// @access  private
router.get('/blog', AuthenticateAdmin, (req, res) => {
    Post.find().then(posts => {
        User.findById(req.user.id)
            .then(user => {
                res.render('admin-blog', {
                    title: 'Blog - Admin',
                    user: user.toJSON(),
                    msg: req.query.msg,
                    posts: posts.map(post => post.toJSON()).reverse()
                })
            })
    })
});

// @route   /admin/blog
// @desc    Creates a Blog Article
// @access  private
router.post('/blog', AuthenticateAdmin, (req, res) => {

    const form = formidable({ multiples: true, keepExtensions: true, uploadDir: __dirname + '/../public/images/blog/' });
            form.parse(req, (err, fields, files) => {
                if(err){
                    res.redirect('/admin/blog?msg=An Unknown Error has occured');
                }

                const {title, editordata} = fields;
                const {path} = files.image;

                if(!title || !path || !editordata){
                    return res.redirect('/admin/blog?msg=Please Fill All Fields Correctly');
                } else {
                    const newPostDetails = {
                        author: 'Admin',
                        title: title,
                        slug: title.toLowerCase().replace(/[^\w ]+/g,'').replace(/ +/g,'-'),
                        featuredImage: process.env.server + '/images/blog' + path.slice(path.indexOf('/upload')),
                        content: editordata 
                    };
            
                    const newPost = new Post(newPostDetails);
                    newPost.save().then(post => res.redirect('/admin/blog?msg=Post Has Been Created'));
                }

            })
 
});

router.get('/blog/delete', AuthenticateAdmin, (req, res) => {
    const {id} = req.query;

    Post.findById(id).then(post => {
        if(!post) return res.redirect('/admin/blog?msg=Post Not Found');

        Post.deleteOne({_id: id}).then(deletedPost => {
            if(deletedPost.deletedCount > 0){
                return res.redirect('/admin/blog?msg=Post Has Been Deleted');
            } else {
                return res.redirect('/admin/blog?msg=An unknown Error Has Occured');   
            }
        })
    })
});

// @route   /admin/users
// @desc    Returns All the Users
// @access  private
router.get('/users', AuthenticateAdmin, (req, res) => {
    User.find().then(users => {
        res.render('admin_users', {
            title: 'All Users - Admin Awah Investment',
            user: users.filter(user => user.id === req.user.id)[0].toJSON(),
            msg: req.query.msg,
            users: users.map(user => user.toJSON()).reverse()
        })
    })
});

// @route   /admin/users
// @desc    Returns All the Users That Was Searched For
// @access  private
router.post('/users', AuthenticateAdmin, (req, res) => {
    const {type, value} = req.body;

    if(!type || !value) return res.redirect('/admin/users?msg=Please Fill All the Necessary Fields!');

    User.find().then(users => {
        let found = users.filter(user => user[type].toLowerCase() === value.trim().toLowerCase()).map(user => user.toJSON()).reverse();
        res.render('admin_users', {
            title: 'All Users - Admin Awah Investment',
            user: users.filter(user => user.id === req.user.id)[0].toJSON(),
            users: found,
            msg: found.length > 0? `${found.length} User(s) Was Found With ${type} of ${value}` : `No User Was Found With ${type} of ${value}`
        })
    })
    
})

// @route   /admin/user/{id}
// @desc    Returns A Users Profile
// @access  private
router.get('/user/:id', AuthenticateAdmin, (req, res) => {
    const {id} = req.params;
    User.find().then(users => {
        let found = users.filter(user => user.id === req.user.id)[0].toJSON();

        Deposit.find({user: id}).then(deposits => {
            Investment.find({user: id}).then(investments => {
                Withdrawal.find({user: id}).then(withdrawals => {
                    Referral.find({user: id}).then(referrals => {
                        res.render('admin_user_profile', {
                            title: 'User Profile - Admin Awah Investment',
                            user: found,
                            userProfile: users.filter(user => user.id === id)[0].toJSON(),
                            deposits: deposits.map(deposit => deposit.toJSON()).reverse(),
                            investments: investments.map(investment => investment.toJSON()).reverse(),
                            withdrawals: withdrawals.map(withdrawal => withdrawal.toJSON()).reverse(),
                            referrals: referrals.map(referral => referral.toJSON()).reverse(),
                            msg: req.query.msg
                        })
                    })
                })
            })
        })
        
    }).catch(err => res.redirect('/admin/users?msg=No User With That ID Was Found'))
});

// @route   /admin/user/set-status
// @desc    Sets a Users Status Functionality
// @access  private
router.post('/user/set-status', AuthenticateAdmin, (req, res) => {
    const {status, id} = req.body;

    if(!status || !id) return res.redirect(`/admin/user/${id}`);

    User.findById(id).then(user => {
        if(user.status === 'admin') return res.redirect(`/admin/user/${id}?msg=Please Access Database To Be Able to Edit Admin User`);

        user.status = status;
        user.save().then(user => res.redirect(`/admin/user/${id}?msg=User Status Has Been Successfully Changed to ${status}`))
    }).catch(err => res.redirect(`/admin/user/${id}`))
})

// @route   /admin/user/set-balance
// @desc    Edits a Users Balance
// @access  private
router.post('/user/set-balance', AuthenticateAdmin, (req, res) => {
    const {id, capital, withdrawable} = req.body;

    if(!id || !capital || !withdrawable) return res.redirect(`/admin/user/${id}?msg=Please Fill All Fields Properly`);

    User.findById(id).then(user => {
        user.balance.withdrawable = withdrawable;
        user.balance.nonWithdrawable = capital;
        user.save().then(user => res.redirect(`/admin/user/${id}?msg=User Balance Has Been Successfully Changed`));
    }).catch(err => res.redirect(`/admin/user/${id}?msg=${err.message}`))
})

// @route   /admin/user/set-pwd
// @desc    Edits a Users Password
// @access  private
router.post('/user/set-pwd', AuthenticateAdmin, (req, res) => {
    const {id, pwd, pwd2} = req.body;

    if(!id || !pwd || !pwd2) return res.redirect(`/admin/user/${id}?msg=Please Fill All Fields Properly`);
    if(pwd !== pwd2 || pwd.length < 4) res.redirect(`/admin/user/${id}?msg=Passwords Must Match and not be Less than Four Characters`);

    User.findById(id).then(user => {

        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(pwd, salt, (err, hash) => {
                if(err) throw err;
                user.password = hash;
                user.save().then(user => {
                    res.redirect(`/admin/user/${id}?msg=User Password successfully changed.`);
                });
            })
        })
    })
})

// @route   /admin/user/set-details
// @desc    Edits a Users Details
// @access  private
router.post('/user/set-details', AuthenticateAdmin, (req, res) => {
    const {id, firstname, lastname, email, btcwallet, nationality, phone, verified, verifyCode, resetPin, referredBy} = req.body;

    if(!firstname || !lastname || !email || !validator.isEmail(email) || !btcwallet || !validator.isBtcAddress(btcwallet) || !nationality || !phone || !verified || !validator.isBoolean(verified)) return res.redirect(`/admin/user/${id}?msg=Please Fill All Fields Properly`);

    User.findById(id).then(user => {
        user.firstname = firstname;
        user.lastname = lastname;
        user.email = email;
        user.btcwallet = btcwallet;
        user.nationality = nationality;
        user.phone = phone;
        user.verified = verified;
        user.verifyCode = verifyCode;
        user.resetPin = resetPin;
        user.referredBy = referredBy;    

        user.save().then(user => res.redirect(`/admin/user/${id}?msg=User Details successfully changed.`))
    })
});

// @route   /admin/investment/update
// @desc    Update an Investment Amount
// @access  private
router.post('/investment/update', AuthenticateAdmin, (req, res) => {
    const {id, newAmount} = req.body;

    const amount = newAmount * 1;

    if(!id || !newAmount || !validator.isInt(newAmount)){
        res.redirect('/admin/investments?msg=Please Enter Valid Details')
    } else {
        Investment.findById(id).then(investment => {
            User.findById(investment.user).then(user => {
                if(user.balance.withdrawable < amount){
                    res.redirect('/admin/investments?msg=User doesn\'t have enough balance for upgrade');
                } else {
                    user.balance.withdrawable -= amount;
                    user.balance.nonWithdrawable += amount;
                    user.save().then(newUser => {
                        investment.amount += amount;
                        investment.save().then(invest => res.redirect('/admin/investments?msg=Investment Succesfully Upgraded'))
                    })
                }
            })
        })
        
    }
})


// @route   /admin/mailing
// @desc    Returns admin mailing interface
// @access  private
router.get('/mailing', AuthenticateAdmin, (req, res) => {
    const { id } = req.user;

    User.findById(id).then(user => {
        res.render('admin_mailing', {
            title: 'Mailing - Awah Investment',
            user: user.toJSON(),
            msg: req.query.msg,
            email: req.query.mail
        })
    })
    
});

// @route   /admin/mailing
// @desc    Sends the Mail
// @access  private
router.post('/mailing', AuthenticateAdmin, (req, res) => {
    const { id } = req.user;
    const {category, single_mail, title, editordata} = req.body;

    if(!category || !title || !editordata){
        res.redirect('/admin/mailing?msg="Please Fill All Fields Correctly');
    } else if(category === 'single' && !single_mail){
        res.redirect('/admin/mailing?msg=Please Enter User Mail For Single Email');
    }

    if(category === 'single'){
        Mailer(single_mail, 'email_broadcast', {email: single_mail, title: title, body: editordata});
        res.redirect('/admin/mailing?msg=You Mails Is Being Delivered!');
    } else {
        User.find().then(users => {
            Investment.find().then(investments => {

                const activeUsers = [];
                const inactiveUsers = [];

                // active users
                investments.forEach(investment => {
                    if(investment.status === 'active' && !activeUsers.includes(investment.user)){
                        activeUsers.push(users.filter(user => user.id === investment.user)[0].email);
                    }
                });

                // inactive users
                users.forEach(user => {
                    if(!activeUsers.includes(user.email)){
                        inactiveUsers.push(user.email)
                    }
                });

                if(category === 'active'){
                    for(const user of activeUsers){
                        Mailer(user, 'email_broadcast', {email: user, title: title, body: editordata});
                        res.redirect('/admin/mailing?msg=You Mails Are Being Delivered!');
                    }
                } else {
                    for(const user of inactiveUsers){
                        Mailer(user, 'email_broadcast', {email: user, title: title, body: editordata});
                        res.redirect('/admin/mailing?msg=You Mails Are Being Delivered!');
                    }
                }

            })
        })
    }
})

module.exports = router;