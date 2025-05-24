const express = require('express')
const router = express.Router()
const User = require('../models/user.model')
const { requireAuth } = require('../middlewares/auth.middleware')
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'statics/user_profiles/');
    },
    filename: function (req, file, cb) {
        cb(null, `${file.fieldname}-${uuidv4()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Optional: limit file size to 5MB
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb('Error: File upload only supports the following filetypes - ' + filetypes);
    }
});


router.get('/profile', requireAuth, async (req, res) => {

    const user = await User.findOne({
        where: {
            email: res.locals.decoded.email
        }
    })
    if (user) {
        res.render('profile', { user: { name: user.firstName + " " + user.lastName, email: user.email, username: user.username, createdAt: user.createdAt, firstName: user.firstName, lastName: user.lastName, bio: user.bio, avatarUrl: user.profile_pic } })
    } else {
        res.redirect('/auth/login')
    }

});


router.post('/profile', requireAuth, upload.single('profile_pic'), async (req, res) => {


    const { lastName, firstName, bio } = req.body;
    const updateData = {};

    if (lastName) updateData.lastName = lastName;
    if (firstName) updateData.firstName = firstName;
    if (bio) updateData.bio = bio;
    if (req.file) updateData.profile_pic = `/user_profiles/${req.file.filename}`;

    if (Object.keys(updateData).length > 0) {
        try {
            await User.update(updateData, {
                where: {
                    email: res.locals.decoded.email
                }
            });
            // res.json({ success: true, message: "Profile updated successfully" });
            res.redirect('/user/profile')
        } catch (error) {
            console.error('Error updating profile:', error);
            res.status(500).json({ success: false, message: "Failed to update profile" });
        }
    } else {
        res.status(400).json({ success: false, message: "No updates provided" });
    }

})

router.post('/profile/updatePassword', requireAuth, async (req, res) => {

    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
        return res.status(400).json({ message: 'currentPassword and newPassword and confirmNewPassword are required' });
    }

    if (newPassword !== confirmNewPassword) {
        return res.status(400).json({ message: 'Passwords do not match.' });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    try{
        const user = await User.findOne({
            where: {
                email: res.locals.decoded.email
            }
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        await User.update(
            { password: hashedNewPassword },
            { where: { email: user.email } }
        );

        return res.json({ message: 'Password successfully updated' });

    } catch (error) {
        console.error('Error updating password:', error);
        return res.status(500).json({ message: 'An error occurred while updating the password' });
    }

});

router.get('/logout', requireAuth, (req, res) =>{
    res.clearCookie('token').redirect('/auth/login')
})


module.exports = router