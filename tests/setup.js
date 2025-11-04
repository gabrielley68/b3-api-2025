import app from '/app';

import { sequelize } from '/models';

export async function setup(){
    await sequelize.sync({force: true});
}

export async function teardown(){
    await sequelize.drop();
    await sequelize.close();
};