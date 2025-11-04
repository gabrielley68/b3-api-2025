const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { Op } = require('sequelize');

const { User } = require('../models');

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
 *     description: Crée un nouveau compte utilisateur avec email, mot de passe et nom d'affichage. Le mot de passe doit contenir au moins 8 caractères.
 *     tags:
 *       - Authentification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - confirmPassword
 *               - display_name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Adresse email de l'utilisateur
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: Mot de passe (minimum 8 caractères)
 *                 example: password123
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 description: Confirmation du mot de passe (doit être identique à password)
 *                 example: password123
 *               display_name:
 *                 type: string
 *                 description: Nom d'affichage de l'utilisateur
 *                 example: John Doe
 *     responses:
 *       204:
 *         description: Compte créé avec succès
 *       400:
 *         description: Erreur de validation (champs manquants, email invalide, mot de passe trop court, mots de passe non identiques, ou email déjà utilisé)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             examples:
 *               missingFields:
 *                 value:
 *                   error: All fields are mandatory
 *               shortPassword:
 *                 value:
 *                   error: Password must be atleast 8 characters long
 *               passwordMismatch:
 *                 value:
 *                   error: Provided passwords don't match
 *               invalidEmail:
 *                 value:
 *                   error: The email is not valid
 *               emailExists:
 *                 value:
 *                   error: An account with the provided email already exists
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', async (req, res) => {
    // Prend email, password & confirmPassword

    // Vérifier adresse mail valable
    // Vérifier password == confirmPassword
    // Vérifier password > 8 caractères

    // Chiffrement de MDP via bcrypt

    // Créer un user

    const { email, password, confirmPassword, display_name } = req.body;

    if(!password || !email || !display_name || !confirmPassword){
        res.status(400);
        res.json({error: "All fields are mandatory"});
        return;
    }

    if(password.length < 8){
        res.status(400);
        res.json({error: "Password must be atleast 8 characters long"});
        return;
    }

    if(password != confirmPassword){
        res.status(400);
        res.json({error: "Provided passwords don't match"});
    }

    const hashedPassword = await bcrypt.hash(
        password,
        12 // Number of salt rounds
    );

    const user = await User.build({
        'email': email,
        'password': hashedPassword,
        'display_name': display_name
    });

    try {
        await user.validate({fields: ['email']});
    } catch (error){
        res.status(400);
        res.json({error: 'The email is not valid'});
        return;
    }

    try {
        await user.save();
        res.status(204);
        res.send("Ok");
    } catch(error){
        if(error.name == "SequelizeUniqueConstraintError"){
            res.status(400);
            res.json({error: "An account with the provided email already exists"});
        } else {
            res.status(500);
            console.error(error);
            res.json({error: "Unknown error"});
        }
    }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Connexion d'un utilisateur
 *     description: Authentifie un utilisateur et retourne un token JWT valide pendant 1 heure. Ce token doit être inclus dans le header Authorization des requêtes protégées.
 *     tags:
 *       - Authentification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Adresse email de l'utilisateur
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Mot de passe de l'utilisateur
 *                 example: password123
 *     responses:
 *       200:
 *         description: Authentification réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: Token JWT à utiliser pour les requêtes authentifiées
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Champs manquants
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Fields 'email' and 'password' are mandatory
 *       403:
 *         description: Email ou mot de passe incorrect
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               error: Email or password incorrect
 */
router.post('/login', async (req, res) => {
    // Vérifier que le compte existe
    // OK => status 200
    // NOK => status 403

    const { email, password } = req.body;

    if(!email || !password){
        res.status(400);
        res.json({
            'error': "Fields 'email' and 'password' are mandatory"
        });
        return;
    }

    const user = await User.findOne({where: {'email': email}});

    if(!user){
        res.status(403);
        res.json({error: `Email or password incorrect`});
        return;
    }

    const passwordOk = await bcrypt.compare(password, user.password);

    if(!passwordOk){
        res.status(403);
        res.json({error: 'Email or password incorrect'});
        return;
    }

    const token = jwt.sign(
        {'userId': user.id},
        process.env.JWT_PRIVATE_TOKEN,
        {expiresIn: '1h'}
    );

    return res.status(200).json({
        'token': token
    });
});

/**
 * @swagger
 * /auth/verify-token:
 *   post:
 *     summary: Vérification de la validité d'un token JWT
 *     description: Vérifie si un token JWT est valide et non expiré
 *     tags:
 *       - Authentification
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token valide
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: ok
 *       401:
 *         description: Token invalide ou expiré
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: nok
 */
router.post('/verify-token', (req, res, next) => {
    const bearer = req.headers.authorization;
    if(!bearer.startsWith('Bearer ')){
        // Renvoyer une erreur
        return;
    }

    const token = bearer.split(" ")[1];

    jwt.verify(token, process.env.JWT_PRIVATE_TOKEN, (err, payload) => {
        if(err){
            res.end("nok")
        } else {
            res.end("ok")
        }
    })
});

module.exports = router;