const sequelize = require('../database/Sequelize-connect');
const Post = require('./post.model');
const User = require('./user.model');


User.hasMany(Post, { foreignKey: 'authorId' });
Post.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

module.exports = {
  sequelize,
  User,
  Post
};