const jwt = require('jsonwebtoken');
const { User } = require('../models')

function raise403(res,){
    res.status(403);
    res.json({error: "JWT Token required"});
}

async function authenticate(req, res, next){
    const bearer = req.headers.authorization;
    if(!bearer || !bearer.startsWith('Bearer ')){
        return raise403(res);
    }

    const token = bearer.split(" ")[1];

    jwt.verify(token, process.env.JWT_PRIVATE_TOKEN, async (err, payload) => {
        if(err){
            return raise403(res);
        } else {
            const user = await User.findByPk(payload.userId);

            if(!user){
                return raise403(res);
            } else {
                req.user = user;
                next();
            }
        }
    })
}

module.exports = authenticate;