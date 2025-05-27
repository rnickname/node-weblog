const express = require('express')
const router = express.Router()
const User = require('../models/user.model')
const { requireAuth } = require('../middlewares/auth.middleware')
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const Post = require('../models/post.model');


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'statics/user_files/');
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
        const posts = await Post.findAll({
            where: { authorId: user.id },
            order: [['createdAt', 'DESC']]
        });
        res.render('profile', { user: { name: user.firstName + " " + user.lastName, email: user.email, username: user.username, createdAt: user.createdAt, firstName: user.firstName, lastName: user.lastName, bio: user.bio, avatarUrl: user.profile_pic, posts } })
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
    if (req.file) updateData.profile_pic = `/user_files/${req.file.filename}`;

    if (Object.keys(updateData).length > 0) {
        try {
            await User.update(updateData, {
                where: {
                    email: res.locals.decoded.email
                }
            });
            res.json({ success: true, message: "Profile updated successfully" });
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

    try {
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

router.get('/logout', requireAuth, (req, res) => {
    res.clearCookie('token').redirect('/auth/login')
})


router.post('/posts/create', requireAuth, upload.single('cover_img'), async (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: 'Title and content are required'
            });
        }

        if (title.length < 2 || title.length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Title must be between 3 and 100 characters'
            });
        }

        if (content.length < 5 || content.length > 5000) {
            return res.status(400).json({
                success: false,
                message: 'Content must be between 10 and 5000 characters'
            });
        }

        let cover_img;
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Cover image is required'
            });
        } else{
            if (req.file.size > 5 * 1024 * 1024) { // 5MB
                return res.status(400).json({
                    success: false,
                    message: 'File size must be less than 5MB'
                });
            }
            cover_img = `/user_files/${req.file.filename}`;
        }

        const newPost = await Post.create({
            title,
            content,
            authorId: res.locals.decoded.id,
            cover_img
        });

        return res.json({
            success: true,
            message: 'Post added successfully',
            post: newPost
        });
    } catch (error) {
        console.error('Error creating post:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create post'
        });
    }
});


router.delete('/posts/:id', requireAuth, async (req, res) => {
    try {
        const { id } = req.params;

        // Optional: Ensure user is authenticated
        const userId = req.user?.id || res.locals.decoded?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const post = await Post.findByPk(id);

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        if (post.authorId !== userId) {
            return res.status(403).json({ success: false, message: 'Not allowed to delete this post' });
        }

        await post.destroy();

        return res.json({
            success: true,
            message: 'Post deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting post:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete post'
        });
    }
});

router.post('/posts/:id/edit', requireAuth, upload.single('cover_img'), async (req, res) => {
    try {
        const { title, content } = req.body;
        const { id } = req.params;

        const userId = res.locals.decoded.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const post = await Post.findByPk(id);

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        if (post.authorId !== userId) {
            return res.status(403).json({ success: false, message: 'Not allowed to edit this post' });
        }

        let updateData = { title, content };

        // If a new cover image is uploaded, update the cover_img field
        if (req.file) {
            // Validate file size server-side
            if (req.file.size > 5 * 1024 * 1024) { // 5MB
                return res.status(400).json({
                    success: false,
                    message: 'File size must be less than 5MB'
                });
            }
            updateData.cover_img = `/user_files/${req.file.filename}`;
        }

        await Post.update(
            updateData,
            { where: { id: post.id } }
        );

        return res.json({
            success: true,
            message: 'Post updated successfully'
        });

    } catch (error) {
        console.error('Error editing the post:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to edit the post'
        });
    }
})

router.get('/posts/:id/edit', requireAuth, async (req, res) => {
    try {
        const { id } = req.params

        // const userId = req.user?.id || res.locals.decoded?.id;
        const userId = res.locals.decoded.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const post = await Post.findByPk(id);

        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // Optional: Ensure the authenticated user is the owner of the post
        if (post.authorId !== userId) {
            return res.status(403).json({ success: false, message: 'Not allowed to edit this post' });
        }

        const old_post = await Post.findOne({
            where: {
                id: post.id
            }
        })
        res.render('edit-post', { old_post });
    } catch (error) {
        console.error('Error displaying the post:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to show the post'
        });
    }
})

module.exports = router