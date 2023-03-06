const jwt = require('jsonwebtoken');
const JwtStrategy = require('passport-jwt').Strategy;

const ExtractJwt = require('passport-jwt').ExtractJwt;
const mongoose = require('mongoose');
const User = require('../models/User');

const dotenv = require('dotenv');
dotenv.config();

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.JWTKey;

module.exports = passport => {

    passport.use(new JwtStrategy(opts, (jwt_payload, done) => {
        User.findById(jwt_payload.id)
            .then(user => {
                if(user.status === 0) {
                  return done(null, false);
                }

                if(user) {
                    return done(null, user);
                }
                
                return done(null, false);
            })
            .catch(err => console.log(err));
    }));
}
