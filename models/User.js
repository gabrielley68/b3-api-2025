const { DataTypes } = require('sequelize');
const sequelize = require('../core/orm.js');

const User = sequelize.define('User', {
    email: {
        type: DataTypes.STRING(255),
        validate: {
            isEmail: true,
        },
        allowNull: false,
        unique: true,
    },
    password: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    display_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
});

module.exports = User;