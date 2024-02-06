const express = require('express');
const dotenv = require('dotenv')
dotenv.config();
const path = require('path');
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const User = require("./models/User");

const app = express();

// middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));

app.use(session({
    secret: "My Secrets Project",
    resave: true,
    saveUninitialized: true,
    // cookie: {
    // // For session timeout and re-login 
    //     maxAge: 600000, // 10 minutes in milliseconds
    // },
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    // callbackURL: "https://secrets-sigma.vercel.app/auth/google/secrets",
    callbackURL: "http://localhost:3000/auth/google/secrets",
    // userProfilrURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            const user = await User.findOne({ googleId: profile.id });
            if (user) {
                return done(null, user);
            } else {
                // Create a new user if it doesn't exist
                const newUser = new User({ googleId: profile.id, username: profile.displayName });
                await newUser.save();
                return done(null, newUser);
            }
        } catch (error) {
            return done(error);
        }
    }));
passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});

//routes
app.use(require("./routes/index"));

//server configurations...
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server started listening on port: ${port}`));
