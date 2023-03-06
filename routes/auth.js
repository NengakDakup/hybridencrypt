const validator = require('validator');
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const cryptoRandomString = require('crypto-random-string');
const jwt = require('jsonwebtoken');

const dotenv = require('dotenv');
dotenv.config();

const Mailer = require('../controllers/Mailer');
const {Authenticate} = require('../controllers/Authenticate');


const User = require('../models/User');

const countries = [
    'Albania',
    'Afghanistan',
    'Algeria',
    'Andorra',
    'Angola',
    'Antigua and Barbuda', 
    'Argentina',
    'Armenia',
    'Australia',
    'Austria',
    'Austrian Empire', 
    'Azerbaijan',
    'Baden',
    'Bahamas',
    'Bahrain',
    'Bangladesh',
    'Barbados',
    'Bavaria',
    'Belarus',
    'Belgium',
    'Belize',
    'Benin',
    'Bolivia',
    'Bosnia and Herzegovina', 
    'Botswana',
    'Brazil',
    'Brunei',
    'Brunswick and Lüneburg',
    'Bulgaria',
    'Burkina Faso', 
    'Burma',
    'Burundi',
    'Cabo Verde', 
    'Cambodia',
    'Cameroon',
    'Canada',
    'Cayman Islands', 
    'Central African Republic', 
    'Central American Federation', 
    'Chad',
    'Chile',
    'China',
    'Colombia',
    'Comoros',
    'Congo',
    'Costa Rica',
    'Cote d’Ivoire',
    'Croatia',
    'Cuba',
    'Cyprus',
    'Czechia',
    'Czechoslovakia',
    'Denmark',
    'Democratic Republic of the Congo', 
    'Djibouti',
    'Dominica',
    'Dominican Republic', 
    'Duchy of Parma', 
    'East Germany (German Democratic Republic)',
    'Ecuador',
    'Egypt',
    'El Salvador',
    'Equatorial Guinea',
    'Eritrea',
    'Estonia',
    'Eswatini',
    'Ethiopia',
    'Federal Government of Germany (1848-49)',
    'Fiji',
    'Finland',
    'France',
    'Gabon',
    'Gambia',
    'Georgia',
    'Germany',
    'Ghana',
    'Grand Duchy of Tuscany',
    'Greece',
    'Grenada',
    'Guatemala',
    'Guinea',
    'Guinea-Bissau',
    'Guyana',
    'Haiti',
    'Hanover',
    'Hanseatic Republics',
    'Hawaii',
    'Hesse',
    'Holy See',
    'Honduras',
    'Hungary',
    'Iceland',
    'India',
    'Indonesia',
    'Iran',
    'Iraq',
    'Ireland',
    'Israel',
    'Italy',
    'Jamaica',
    'Japan',
    'Jordan',
    'Kazakhstan',
    'Kenya',
    'Kingdom of Serbia Yugoslavia',
    'Kiribati',
    'Korea',
    'Kosovo',
    'Kuwait',
    'Kyrgyzstan',
    'Laos',
    'Latvia',
    'Lebanon',
    'Lesotho',
    'Lew Chew (Loochoo)',
    'Liberia',
    'Libya',
    'Liechtenstein',
    'Lithuania',
    'Luxembourg',
    'Madagascar',
    'Malawi',
    'Malaysia',
    'Maldives',
    'Mali',
    'Malta',
    'Marshall Islands',
    'Mauritania',
    'Mauritius',
    'Mecklenburg-Schwerin',
    'Mecklenburg-Strelitz',
    'Mexico',
    'Micronesia',
    'Moldova',
    'Monaco',
    'Mongolia',
    'Montenegro',
    'Morocco',
    'Mozambique',
    'Namibia',
    'Nassau',
    'Nauru',
    'Nepal',
    'Netherlands',
    'New Zealand',
    'Nicaragua',
    'Niger',
    'Nigeria',
    'North German Confederation',
    'North German Union',
    'North Macedonia',
    'Norway',
    'Oldenburg',
    'Oman',
    'Orange Free State',
    'Pakistan',
    'Palau',
    'Panama',
    'Papal States',
    'Papua New Guinea',
    'Paraguay',
    'Peru',
    'Philippines',
    'Piedmont-Sardinia',
    'Poland',
    'Portugal',
    'Qatar',
    'Republic of Genoa',
    'Republic of Korea (South Korea)',
    'Republic of the Congo',
    'Romania',
    'Russia',
    'Rwanda',
    'Saint Kitts and Nevis',
    'Saint Lucia',
    'Saint Vincent and the Grenadines',
    'Samoa',
    'San Marino',
    'Sao Tome and Principe',
    'Saudi Arabia',
    'Schaumburg-Lippe',
    'Senegal',
    'Serbia',
    'Seychelles',
    'Sierra Leone',
    'Singapore',
    'Slovakia',
    'Slovenia',
    'Solomon Islands',
    'Somalia',
    'South Africa',
    'South Sudan',
    'Spain',
    'Sri Lanka',
    'Sudan',
    'Suriname',
    'Sweden',
    'Switzerland',
    'Syria',
    'Tajikistan',
    'Tanzania',
    'Texas',
    'Thailand',
    'Timor',
    'Togo',
    'Tonga',
    'Trinidad and Tobago',
    'Tunisia',
    'Turkey',
    'Turkmenistan',
    'Tuvalu',
    'Two Sicilies',
    'Uganda',
    'Ukraine',
    'Union of Soviet Socialist Republics',
    'United Arab Emirates',
    'United Kingdom',
    'Uruguay',
    'Uzbekistan',
    'Vanuatu',
    'Venezuela',
    'Vietnam',
    'Württemberg',
    'Yemen',
    'Zambia',
    'Zimbabwe',
];

const { server } = process.env;
// @route   /login
// @desc    Returns the Login Page
// @access  public
router.get('/login', (req, res) => {
    const { msg, id, token } = req.query;
    if(id && token){
        User.findById(id)
            .then(user => {
                if(!user){
                    res.redirect('/login?msg=User Account not found&msgType=danger');
                } else if(user.verifyCode !== token){
                    res.redirect('/login?msg=Invalid Authentication for user&msgType=danger');
                } else {
                    user.verified = true;
                    user.save().then(usr => res.redirect('/login?msg=Account successfully verified. Please Login to continue&msgType=success')); 
                }
            })
            .catch(err => res.redirect('/auth?login=Invalid Authentication for user&msgType=danger'))
    } else {
        res.render('login', {
            title: 'Login - Mondex',
            msg: msg,
            type: req.query.msgType,
            countries: countries
        });
    }
});

// @route   /register
// @desc    Returns the Register Page
// @access  public
router.get('/register', (req, res) => {
    const { msg, id, token } = req.query;
    res.render('register', {
        title: 'Register - Mondex',
        msg: msg,
        type: req.query.msgType

    })
})



// @route   /verify
// @desc    Returns the Verify Email Page
// @access  public
router.get('/verify', (req, res) => {
    User.findOne({email: req.query.email})
        .then(user => {
            if(!user){
                res.redirect('/login?msg=Email Address not found!');
            } else {
                res.render('verify', {
                    title: 'Verify Account - Mondex',
                    email: req.query.email
                });
            }
        })
});

router.post('/verify', (req, res) => {
    const {email} = req.body;
    //find the user and send the mails
    User.findOne({email: email})
        .then(user => {
            if(!user){
                //redirect to login page with a message
                res.redirect('/login?msg=Email Address not found');
            } else {
                // Send Email
                if(!user.verifyCode){
                    user.verifyCode = cryptoRandomString({length: 10, type: 'base64'});
                    user.save().then(user => {
                        Mailer(user.email, 'verify', {server: server, email: user.email, name: user.fullname, title: 'Welcome to Mondex', link: `${server}login?id=${user.id}&token=${user.verifyCode}`});
                        res.redirect(`/verify?email=${email}`);
                    })
                }
                
            }
        })
    
})

// @route   /reset
// @desc    Returns the Reset Password Page
// @access  public
router.get('/reset', (req, res) => {
    res.render('reset', {
        title: 'Reset Password - Mondex',
        msg: req.query.msg,
        type: req.query.msgType,
    });
});

// @route   /send-reset
// @desc    Sends the reset email
// @access  public
router.post('/send-reset', (req, res) => {
    const {email} = req.body;
    
    if(!email || !validator.isEmail(email)){
        return res.redirect('/reset?msg=Please enter a valid Email&msgType=danger');
    }
    //look for the user
    User.findOne({email: email})
        .then(user => {
            if(!user){
                return res.redirect('/reset?msg=Email Address not found&msgType=danger');
            } else {
                user.resetPin = cryptoRandomString({length: 10, type: 'url-safe'});
                user.save().then(user => {
                    // send the reset password mail
                    Mailer(email, 'reset', {email: email, name: user.fullname, title: 'Reset Password', link: `${server}/reset-password?user=${user.id}&token=${encodeURIComponent(user.resetPin)}` });
                    res.redirect(`/reset?msg=A mail has been sent to ${email}&msgType=success`);
                })
            }
        }).catch(err => res.redirect('/reset?msg=An Unknown Error Occured&msgType=danger'));

});

// get - to render reset password page and confirm the reset code

// @route   /reset-password
// @desc    Returns the main reset password page and confirms if token is coreect
// @access  public
router.get('/reset-password', (req, res) => {
    const { user, token } = req.query;

    if(user && token){
        User.findById(user)
            .then(user => {
                if(!user){
                    res.redirect('/login?msg=User Account not found&msgType=danger');
                } else if(user.resetPin !== token){
                    res.redirect('/login?msg=Invalid Authentication for user&msgType=danger');
                } else {
                    res.render('reset-password', {
                        title: 'Reset Password - Mondex',
                        token: token,
                        user: user.id,
                        msg: req.query.msg,
                        type: req.query.msgType
                    })
                }
            })
            .catch(err => res.redirect('/login?msg=Invalid Authentication for user&msgType=danger'))
    } else {
        res.redirect('/login');
    }
})

// post - to get the new password and change it, then redirect user to login with msg=password changed
router.post('/reset-password', (req, res) => {
    const {user, token, password, password2} = req.body;
    
    if(!user || !token){
        return res.redirect('/login?msg=An unknown error has occured&msgType=danger');
    } else if(!password || !password2){
        return res.redirect(`/reset-password?user=${user}&token=${encodeURIComponent(token)}&msg=Please fill all fields&msgType=danger`);
    } else if(password !== password2){
        return res.redirect(`/reset-password?user=${user}&token=${encodeURIComponent(token)}&msg=${encodeURIComponent('Passwords do not match')}&msgType=danger`);
    } else if(password.length < 4){
        return res.redirect(`/reset-password?user=${user}&token=${encodeURIComponent(token)}&msg=${encodeURIComponent('Please enter a password not less than 4 charcters')}&msgType=danger`);        
    } else {
        User.findById(user)
            .then(user => {
                if(!user){
                    res.redirect('/login?msg=An unknown error has ocuured&msgType=danger');
                } else {
                    bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(password, salt, (err, hash) => {
                            if(err) throw err;
                            user.password = hash;
                            user.resetPin = null;
                            user.save().then(user => {
                                res.clearCookie('token');
                                res.redirect('/login?msg=Password successfully changed. Please Login to continue&msgType=success');
                            });
                        })
                    })
                }
            })
    }
})

// change pword functionality from profile page
// post - to get the new password and change it, then redirect user to login with login with new password
router.post('/change-password', Authenticate, (req, res) => {
    const {id, name, status} = req.user;
    const { oldP, newP } = req.body;

    if(!oldP || !newP){
        return res.redirect('/profile?msg=Please Make Sure All Fields Are Completed&msgType=danger');
    } else if(oldP === newP){
        return res.redirect('/profile?msg=Old Password Cannot be the Same as the Old Password&msgType=danger');
    }

    User.findById(id)
        .then(user => {
            if(!user){
                return res.redirect('/login');
            } 

            bcrypt.compare(oldP, user.password)
                .then(isMatch => {
                    if(isMatch){
                        if(newP.length < 4){
                            return res.redirect('/profile?msg=New Password Cannot Be Less Than Four Characters&msgType=danger');
                        } else {

                            bcrypt.genSalt(10, (err, salt) => {
                                bcrypt.hash(newP, salt, (err, hash) => {
                                    if(err) throw err;
                                    user.password = hash;
                                    user.save().then(user => {
                                        res.clearCookie('token');
                                        res.redirect('/login?msg=Password successfully changed. Please Login to continue&msgType=success')
                                    });
                                })
                            })
                        }
                        
                    } else {
                        return res.redirect('/profile?msg=Current Password is Wrong. Please Logout and click on forgot password if you forgot your password!&msgType=danger');
                    }
                })
        })

    


})

// @route   /login
// @desc    Validates a User Login
// @access  public
router.post('/login', (req, res) => {
    const errors = {};
    const {email, password} = req.body;
    if(!email || !validator.isEmail(email)){
        errors.email = 'Please enter a valid email';
    }

    if(!password){
        errors.password = 'Please enter a Password'
    }

    if(errors.email || errors.password){
        return res.render('login', {
            title: 'Login - Mondex',
            inputs: {
                email: email,
                password: password
            },
            errors: errors
        });
    }

    //check if email exists
    User.findOne({email: req.body.email})
        .then(user => {
            if(!user){
                return res.render('login', {
                    title: 'Login -  Mondex',
                    inputs: {
                        email: email,
                        password: password
                    },
                    errors: {email: 'Account not found!'}
                });
            }

            if(!user.verified){
                return res.render('login', {
                    title: 'Login - mondex',
                    inputs: {
                        email: email,
                        password: password
                    },
                    errors: {email: 'Please verify your Account First!'}
                });
            }

            //compare passwords
            bcrypt.compare(password, user.password)
                .then(isMatch => {
                    if(isMatch){
                        // create a jwt payload
                        const payload = { id: user.id, name: user.fullname, status: user.status };
                        // Sign the Token
                        // expires in one week
                        jwt.sign(payload, process.env.JWTKey, {expiresIn: 604800}, (err, token) => {
                            res.cookie('token', token, {signed: true, httpOnly: true}).redirect('/dashboard');
                        });
                        // create cookie

                        // redirect to dashboard
                        // res.redirect('/dashboard');
                    } else {
                        return res.render('login', {
                            title: 'Login -  Mondex',
                            inputs: {
                                email: email,
                                password: password
                            },
                            errors: {password: 'Password not correct!'}
                        });
                    }
                })
        })
    
});


// @route   /signup
// @desc    Validates a User Signup
// @access  public
router.post('/register', (req, res) => {
    
    const errors = {};
    const {fullname, email, wallet, phone, nationality, referredBy, password, password2} = req.body;
    
    if(!email || !validator.isEmail(email)){
        errors.email = 'Please enter a valid email';
    }

    if(!password || password.length < 4){
        errors.password = 'Please enter a Password not less than 4 characters';
    }

    if(!password2 || password2 !== password){
        errors.password2 = 'Passwords do not match';
    }

    errorsLength = Object.keys(errors).map(key => key);

    if(errorsLength.length > 0){
        return res.render('register', {
            title: 'Register - Mondex',
            inputs: {
                ...req.body
            },
            errors: errors
        })
    } else {
        // check if email exists
        User.findOne({email: req.body.email})
            .then(user => {
                if(user){
                    errors.email = 'Email Already Exists!'
                    return res.render('register', {
                        title: 'Register - Mondex',
                        inputs: {
                            ...req.body
                        },
                        errors: errors
                    })
                } else {
                    // create the new user
                    
                    const newUser = new User({
                        email: email,
                        password: password,
                        verified: true,
                        verifyCode: cryptoRandomString({length: 10, type: 'url-safe'}),
                        resetPin: null,
                        status: 'normal',
                        date: Date.now()
                    });

                    // encrypt the password
                    bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(newUser.password, salt, (err, hash) => {
                            if(err) throw err;
                            newUser.password = hash;
                            // save the user
                            newUser.save()
                                .then(user => {
                                    // Send Email
                                    Mailer(user.email, 'verify', {server: server, email: user.email, name: user.fullname, title: 'Welcome to Mondex', link: `${server}login?id=${user.id}&token=${user.verifyCode}`});
                                    // redirect to verify email page
                                    res.redirect(`/verify?email=${email}`);
                                }).catch(err => {
                                    res.redirect('/register?msg=An Unknown Error Occured, Please Try Again&msgType=danger');
                                    console.log(err);
                                });
                                
                        });
                    });
                }
            })
        
    }
});


module.exports = router;
