const express = require('express')
const router = express.Router()
const User = require('../models/user.model')
const jwt = require('jsonwebtoken');

router.get('/profile', async (req, res) => {
    const { token } = req.cookies
    const secretKey = 'your_secret_key';

    if (token) {
        jwt.verify(token, secretKey, async (err, decoded) => {
            if (err) {
                console.log('Invalid token');
                res.redirect('/auth/login')
            } if (decoded) {
                console.log({decoded})
                const user = await User.findOne({
                    where:{
                        email: decoded.email
                    }
                })
                if(user){
                    res.render('profile', {user: {name: user.firstName + " " + user.lastName, email: user.email, username: user.username, createdAt: user.createdAt, firstName: user.firstName , lastName: user.lastName, bio: user.bio}})
                } else{
                    res.redirect('/auth/login')
                }
            }
        });
    } else {
        res.redirect('/auth/login')
    }
})



module.exports = router