const jwt = require('jsonwebtoken');
const User = require('../models/user.model');


const requireAuth = (req, res, next) => {

    const { token } = req.cookies;
    const secretKey = 'your_secret_key';

    if (token) {
        jwt.verify(token, secretKey, (err, decoded) => {
            if (err) {
                console.log('Invalid token');
                res.redirect('/auth/login')
            } if (decoded) {
                res.locals.decoded = decoded;
                next();
            }
        }
    )} else{
        res.redirect('/auth/login')
    }
}

const isAdmin = async (req, res, next) => {

    try {
        const { token } = req.cookies;
        const secretKey = 'your_secret_key';

        if (!token) {
            return res.redirect('/auth/login');
        }

        const decoded = await jwt.verify(token, secretKey);
        const user = await User.findOne({
            where: {
                email: decoded.email
            }
        });

        if (!user) {
            return res.redirect('/auth/login');
        }

        if (user.role !== 'admin') {
            return res.redirect('/');
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.redirect('/auth/login');
    }
}

module.exports = {
    requireAuth, isAdmin
}