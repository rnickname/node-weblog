const { DataTypes } = require('sequelize');
const sequelize = require('../database/Sequelize-connect')

const Post = sequelize.define('Post', {
    title: {
        type: DataTypes.STRING,
        allowNull: false,
        require: true,
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
        require: true,
    },
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    authorId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  cover_img:{
    type: DataTypes.STRING,
    allowNull: false
  }

}, {},);

module.exports = Post;