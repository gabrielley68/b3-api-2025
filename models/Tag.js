const { DataTypes } = require('sequelize');
const sequelize = require('../core/orm.js');


const Tag = sequelize.define('Tag', {
    name: {
        type: DataTypes.STRING(100),
    },
});

module.exports = Tag;