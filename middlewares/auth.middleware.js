const jwt = require('jsonwebtoken');


const requireAuth = (req, res, next) => {

    const { token } = req.cookies;
    const secretKey = 'your_secret_key';

    if (token) {
        jwt.verify(token, secretKey, (err, decoded) => {
            if (err) {
                console.log('Invalid token');
                res.redirect('/auth/login')
            } if (decoded) {
                res.locals.decoded = decoded
                next()
            }
        }
    )} else{
        res.redirect('/auth/login')
    }
}

module.exports = {
    requireAuth
}