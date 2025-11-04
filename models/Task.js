const { DataTypes } = require('sequelize');
const sequelize = require('../core/orm.js');


const Task = sequelize.define('Task', {
    done: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    title: {
        type: DataTypes.STRING(100)
    },
    datetime: {
        type: DataTypes.DATE
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
}, {
    defaultScope: {
        attributes: {
            exclude: ['UserId']
        }
    }
});

module.exports = Task;