const express = require('express')
const router = express.Router()
const User = require('../models/user.model')
const ResetPassword = require('../models/reset-password.model')
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');


function generateResetToken() {
    const token = crypto.randomBytes(32).toString('hex'); // 64-character token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expires = Date.now() + 10 * 60 * 1000; // expires in 10 minutes

    return {
        token,        // send this to the user via email
        tokenHash,    // save this in the database
        expires       // save this in the database
    };
}


router.get('/login', (req, res) => {
    res.render('login')
})
router.get('/register', (req, res) => {
    res.render('register')
})
router.get('/forgot-password', (req, res) => {
    res.render('forgot-password')
})
router.get('/forgot-password/:token', (req, res) => {
    res.render('change-password', { token: req.params.token })
})


router.post('/login', async (req, res) => {
    const { email, password } = req.body
    const secretKey = 'your_secret_key';
    // const isPasswordValid = await bcrypt.compare(password, user.password);

    const user = await User.findOne({
        where: {
            email
        }
    })

    if (!user) {
        return res.render('login', { errorMessage: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        return res.render('login', { errorMessage: "Password is incorrect" });
    }

    const payload = {
        id: user.id, // Use `id`, not `_id` (you're using Sequelize, not Mongoose)
        email: user.email
    };

    const token = jwt.sign(payload, secretKey, {
        expiresIn: '3h',
    });

    res.cookie('token', token, {
        maxAge: 3 * 60 * 60 * 1000,
        path: '/'
    });

    res.redirect("/user/profile");
})

router.post('/register', async (req, res) => {
    const { email, password, lastName, firstName, username } = req.body
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.findOne({
        where: {
            email
        }
    })

    if (user) {
        res.render('register', { "errorMessage": "this email is already exist!" })
    } else {
        const user = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            username
        });
        return res.json({ message: "successful registration, now redirecting to login page..." });
    }
})

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body

    const user = await User.findOne({
        where: {
            email
        }
    })
    if (user) {
        const reset_token = await ResetPassword.findOne({
            where: {
                email
            }
        })
        // console.log({ reset_token })
        if (reset_token) {
            if (new Date(reset_token.expires) > new Date()) {
                return res.status(400).json({
                    errorMessage: 'A password reset request has already been sent for this email address. Please check your email inbox (and spam folder). You can request another link after the current one expires (typically in 10 minutes).'
                });
            } else {
                console.log('Existing token is expired, deleting it.');
                await ResetPassword.destroy({ where: { id: reset_token.id } });
            }
        }
        const { token, tokenHash, expires } = generateResetToken();
        await ResetPassword.create({
            email,
            tokenHash: tokenHash,
            expires: new Date(expires)
        })

        console.log({ "reset password token": token })
        return res.json({ message: "If an account with that email address exists, a password reset link has been sent." });
    } else {
        console.log(`Forgot password attempt for non-existent email: ${email}`);
        return res.json({ message: "If an account with that email address exists, a password reset link has been sent." });
    }
})

router.post('/forgot-password/:token', async (req, res) => {
    const { token } = req.params
    const { newPassword, confirmPassword } = req.body;
    // const { confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: 'Token and new password are required' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const resetEntry = await ResetPassword.findOne({
        where: { tokenHash }
    });

    if (!resetEntry) {
        return res.status(400).json({ message: 'Invalid or expired token' });
    }

    if (Date.now() > resetEntry.expires.getTime()) {
        return res.status(400).json({ message: 'Token has expired' });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match.' });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.update(
        { password: hashedPassword },
        { where: { email: resetEntry.email } }
    );

    await ResetPassword.destroy({ where: { id: resetEntry.id } });

    res.json({ message: 'Password successfully reset' });
    res.redirect('/auth/login')
})

module.exports = router
