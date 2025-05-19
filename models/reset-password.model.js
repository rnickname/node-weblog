const { DataTypes } = require('sequelize');
const sequelize = require('../database/Sequelize-connect')

const ResetPassword = sequelize.define('ResetPassword', {
    email: {
        type: DataTypes.STRING,
        allowNull: false
    },
    tokenHash: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    expires: {
        type: DataTypes.DATE,
        allowNull: false,
    }
}, {},);

module.exports = ResetPassword;