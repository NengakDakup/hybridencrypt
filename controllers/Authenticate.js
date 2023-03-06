const jwt = require('jsonwebtoken');
const User = require('../models/User');


const dotenv = require('dotenv');
const { log } = require('handlebars');
dotenv.config();


function Authenticate(req, res, next) {
    
    const {token} = req.signedCookies;
    const {JWTKey} = process.env;

    try {
        const decoded = jwt.verify(token.toString(), JWTKey);
        User.findById(decoded.id)
            .then(user => {
                if(user.status !== 'normal' && user.status !== 'admin' && user.status !== 'agent' && user.status !== 'super-agent'){
                    throw new Error(`Your Account Has Been ${user.status}. Please Contact Admin for Assistance`);
                } else {
                    req.user = decoded;
                    next()
                }
            }).catch(err => {
                if(err.message){
                    const msg = err.message.includes('Your Account')? err.message : 'Please Login First';
                    return res.redirect(`/login?msg=${msg}&msgType=danger`);
                } else {
                    return res.redirect('/login?msg=Please Login First&msgType=danger');
                }
            })
    } catch(err){
        if(err.message){
            const msg = err.message.includes('Your Account')? err.message : 'Please Login First';
            return res.redirect(`/login?msg=${msg}&msgType=danger`);
        } else {
            return res.redirect('/login?msg=Please Login First&msgType=danger');
        }
        
    }
}

function AuthenticateAdmin(req, res, next) {
    
    const {token} = req.signedCookies;
    const {JWTKey} = process.env;

    try {
        const decoded = jwt.verify(token.toString(), JWTKey);
        User.findById(decoded.id)
            .then(user => {
                if(user.status !== 'admin'){
                    throw err;
                } else {
                    req.user = decoded;
                    next()
                }
            }).catch(err => res.redirect('/login?msg=Please Login First'))  
    } catch(err){
        return res.redirect('/login?msg=Please Login First');
    }
}

module.exports = {Authenticate, AuthenticateAdmin};