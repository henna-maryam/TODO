const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/userSchema');

router.post('/signup', async (req,res) => {
    const {username, email, password} = req.body;
    try {
        const existingUser = await User.findOne({email});
        if(existingUser){
            return res.status(400).json({message: 'User already exists'});
        }
        const hashPassword = await bcrypt.hash(password,8);
        const newUser = new User({username, email, password: hashPassword});
        await newUser.save();
        return res.status(201).json({message: 'User created successfully', newUser});
    } catch (error) {
        return res.status(500).json({message: 'Something went wrong', error: error.message});
    }
});

router.post('/login', async (req,res) => {
    const {email, password} = req.body;
    try {
        const user = await User.findOne({email});
        if (!user) {
            return res.status(401).json({message: 'Invalid credentials'});
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if(isMatch){
            const token = jwt.sign({email: user.email}, process.env.JWT_SECRET, {expiresIn: '1h'});
            return res.status(200).json({
                message: 'Login successful',
                token,
                username: user.username
            });
        } else {
            return res.status(401).json({message: 'Invalid credentials'});
        }
    } catch (error) {
        return res.status(500).json({message: 'Something went wrong', error: error.message})
    }
});



module.exports = router;