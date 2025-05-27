const express = require('express')
const router = express.Router()
const { Post, User } = require('../models')


router.get('/', async (req, res) => {
    const posts = await Post.findAll({
        include: [{ model: User, as: 'author' }],
        order: [['createdAt', 'DESC']]
    });
    res.render('home', { posts })
})

router.get('/:id', async (req, res) => {
  const post = await Post.findByPk(req.params.id, {
    include: [{ model: User, as: 'author' }]
  });
  if (!post) return res.status(404).send('Post not found');
  res.render('post', { post });
});

module.exports = router