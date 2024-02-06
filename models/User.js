const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String,
    secret: String
});

const User = new mongoose.model("User", userSchema);

module.exports = User ;