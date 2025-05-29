const express = require('express')
const sequelize = require('./database/Sequelize-connect')
const { User, Post } = require('./models');
const authRoutes = require('./routes/auth.route')
const userRoute = require('./routes/user.route')
const homeRoute = require('./routes/home.route')
const adminRoute = require('./routes/admin.route')
const path = require('path')
const cookieParser = require('cookie-parser');
const { isAdmin } = require('./middlewares/auth.middleware');
const bcrypt = require('bcryptjs');


const app = express()
const port = 3000
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'statics')))

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))


app.use('/auth', authRoutes)
app.use('/user', userRoute)
app.use('/admin', isAdmin, adminRoute)


app.use('/', homeRoute)

app.listen(port, '0.0.0.0', async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync(
            // { force: true }
        );
        await adminUser();
        console.log('Connection has been established successfully.');
        console.log(`Example app listening on port ${port}`)
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
})

async function adminUser() {
    const user = await User.findOne({
        where:{
            email: 'admin@lasf.com'
        }
    })
    if(!user){
        const hashedPassword = await bcrypt.hash('123', 10);
        await User.create({
            firstName: 'admin',
            lastName: 'adminy',
            username: 'administrator',
            email: 'admin@lasf.com',
            role: 'admin',
            password: hashedPassword
        });
    }
}