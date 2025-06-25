// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt= require('bcrypt');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: String,
    password: { type: String, required: true },
    role: { type: String, default: 'user' }
});

//new pre-save hook
userSchema.pre('save',async function(next){
    if(!this.isModified('password')) return next();

    try{
        const salt = await bcrypt.genSalt(10);
        this.password=await bcrypt.hash(this.password,salt);
        next();
    } catch(err){
        next(new Error('Password hashing failed'));
    }
});

module.exports = mongoose.model('User', userSchema);
