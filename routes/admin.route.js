const express = require('express')
const router = express.Router()
const { Post, User } = require('../models');

router.get('/', async (req,res)=>{

    const users = await User.findAll({});
    const posts = await Post.findAll({});
    res.render('admin', { users, posts });

})

router.delete('/posts/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        if (!id || isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid post ID'
            });
        }

        const post = await Post.findByPk(id);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        await Post.destroy({
            where: { id }
        });

        return res.status(200).json({
            success: true,
            message: 'Post deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting the post:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

router.delete('/users/delete/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        if (!id || isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        const post = await Post.findByPk(id);
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'user not found'
            });
        }

        await User.destroy({
            where: { id }
        });

        return res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting the user:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

router.get('/users/edit/:id', async (req, res) => {
    const user = await User.findOne({
        where:{
            id: req.params.id
        }
    });
    res.render('edit-user', {user})
})

router.post('/users/edit/:id', async (req, res) => {
    const { lastName, firstName, username, email, role } = req.body;
    const updateData = {};

    if (lastName) updateData.lastName = lastName;
    if (firstName) updateData.firstName = firstName;
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (role) updateData.role = role;

    if (Object.keys(updateData).length > 0) {
        try {
            await User.update(updateData, {
                where: {
                    id: req.params.id
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

module.exports = router
