const { DataTypes } = require('sequelize');
const sequelize = require('../database/Sequelize-connect')

const User = sequelize.define('User', {
    firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        require: true,
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        require: true,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        require: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        require: true,
        set(value) {
            this.setDataValue('email', value ? value.toLowerCase() : '');
        }
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        require: true,
        set(value) {
            this.setDataValue('username', value ? value.toLowerCase() : '');
        }
    },
    bio: {
        type: DataTypes.STRING,
        allowNull: true
    },
    profile_pic: {
        type: DataTypes.STRING,
        allowNull: true
    },
    role:{
        type: DataTypes.ENUM,
        values: ['user','admin'],
        defaultValue: 'user'
    }

}, {},);

module.exports = User;