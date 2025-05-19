const express = require('express')
const router = express.Router()
const User = require('../models/user.model')


router.get('/', async (req, res) => {
    const users = await User.findAll({})

    res.render('home', {users})
})

module.exports = router