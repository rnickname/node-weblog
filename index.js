const express = require('express')
const sequelize = require('./database/Sequelize-connect')
const authRoutes = require('./routes/auth.route')
const userRoute = require('./routes/user.route')
const homeRoute = require('./routes/home.route')
const path = require('path')
const cookieParser = require('cookie-parser');


const app = express()
const port = 3000
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser());
app.use(express.json());


app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))


app.use('/auth', authRoutes)
app.use('/user', userRoute)
app.use('/', homeRoute)

app.listen(port, '0.0.0.0', async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
        console.log('Connection has been established successfully.');
        console.log(`Example app listening on port ${port}`)
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
})