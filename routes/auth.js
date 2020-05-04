const router    = require('express').Router();
const User      = require('../model/User');
const Token     = require('../model/Token');
const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const { registerValidation, loginValidation } = require('../validation');

router.post('/token', async (req, res) =>{
    const refreshToken = req.body.refreshToken;
    if( refreshToken == null ) return res.sendStatus(401);
    
    const tokenExists = await Token.findOne({refresh_token: refreshToken});
    if( !tokenExists ) return res.sendStatus(401);

    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if( err ) return res.sendStatus(403);
        const accessToken = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET, {expiresIn: process.env.TOKEN_SECRET_EXPIRY});
        res.json({ token: accessToken });
    });
});

// Register route
router.post('/register', async (req, res) => {
    
    // validate the information
    const { error, value } = registerValidation(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    // check if user already exists
    const emailExists = await User.findOne({email: req.body.email});
    if( emailExists ) return res.status(400).send('Email already exists');

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // create a new user
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword
    });

    try{
        const savedUser = await user.save();
        res.send({user: user._id});
    }catch(err){
        res.status(400).send(err);
    }
});

// Login route
router.post('/login', async (req, res) => {

    // validate the information
    const { error, value } = loginValidation(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    // check if email does not exist
    const user = await User.findOne({email: req.body.email});
    if( !user ) return res.status(400).send('Email not found');

    // if password is correct
    const validPass = await bcrypt.compare(req.body.password, user.password);
    if(!validPass) return res.status(400).send('Invalid password');

    // create and assign JWT
    const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET, {expiresIn: process.env.TOKEN_SECRET_EXPIRY});
    const refreshToken = jwt.sign({ _id: user._id }, process.env.REFRESH_TOKEN_SECRET);

    // Check if user already has refresh token
    const tokenCheck = await Token.findOne({user_id: user._id});
    if( tokenCheck ){
        return res.header('auth-token', token).send({token: token, refreshToken: tokenCheck.refresh_token});
    }
    
    // create a new auth token in database
    const authToken = new Token({
        user_id: user._id,
        expires_in: process.env.TOKEN_SECRET_EXPIRY,
        refresh_token: refreshToken
    });

    try{
        // Save the token
        const savedToken = await authToken.save();
        res.header('auth-token', token).send({token: token, refreshToken: refreshToken});
    }catch(err){
        res.status(400).send(err);
    }
});

module.exports = router;