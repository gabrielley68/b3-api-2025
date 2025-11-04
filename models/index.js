const sequelize = require('../core/orm.js');

const Task = require('./Task.js');
const User = require('./User.js');
const Tag = require('./Tag.js');

Task.belongsTo(User);
User.hasMany(Task);

Tag.belongsToMany(Task, {through: 'TaskTag'});
Task.belongsToMany(Tag, {through: 'TaskTag'});

// Faire les relations pour appliquer des tags (étiquettes)
// sur des tâches

// Pour importer un modèle :
// const Task = require('../models/')

// sequelize.sync({alter: true});

module.exports = {
  'Task': Task,
  'User': User,
  'Tag': Tag,
  'sequelize': sequelize
}