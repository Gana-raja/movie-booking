// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');

// Register route
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).send('User already exists');
        const user = new User({ username, email, password });
        await user.save();
        res.redirect('/login.html');
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// Login route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username});
        if (!user) return res.status(401).send('Invalid credentials');

        const isMatch=await bcrypt.compare(password,user.password);
        if(!isMatch) return res.status(401).send('Inavlid credentials');
        req.session.user={
            username:user.username,
            role:user.role||'user'//fallback to user if role missing
        };
        req.session.save(err=>{
            if(err){
                console.error('session save error',err);
                return res.status(500).json({error:'Server error'});
            }
        })
        res.json({success:true, redirectUrl:'/movie_booking.html'});
    } catch (err) {
        console.error('Login error',err);
        res.status(500).send('Server error');
    }
});
//check login
router.get('/check-login', (req, res) => {
  if (req.session.user) {
    res.json({ 
        loggedIn: true, 
        username: req.session.user.username,
        role:req.session.user.role});
  } else {
    res.json({ loggedIn: false });
  }
});

// Logout route
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Session destruction error:', err);
            return res.status(500).send('Server error');
        }
        res.clearCookie('connect.sid', {
            path: '/',
            domain: process.env.NODE_ENV === 'production' ? '.cinetix-gamma.vercel.app' : undefined
        });
        res.redirect('/login.html');
    });
});
//get session username
router.get('/get-username',(req,res)=>{
    if(req.session.user){
        res.json({username: req.session.user.username});
    } else{
        res.json({username:null});
    }
});

// Verify username and email match
router.post('/verify-user', async (req, res) => {
    const { username, email } = req.body;
    
    try {
        const user = await User.findOne({ username, email });
        res.json({ valid: !!user }); // Returns true if user exists
    } catch (err) {
        res.status(500).json({ error: 'Verification failed' });
    }
});

// Direct password update
router.post('/reset-password', async (req, res) => {
    const { username, newPassword } = req.body;
    
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ success: false });
        
        user.password = newPassword; // Will auto-hash via pre('save')
        await user.save();
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

module.exports = router;
