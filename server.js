const fs = require('fs');
const path = require('path');
const https = require('https');
const express = require('express')
const helmet = require('helmet');
 const passport = require('passport');
 const { Strategy } = require('passport-google-oauth20');
 const cookieSession = require('cookie-session');
// const { verify } = require('crypto');

 require('dotenv').config();

const PORT = 3000;




const AUTH_OPTIONS = {
  callbackURL: '/auth/google/callback',
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
}
const verifyCallback = (accessToken, refreshToken, profile, done)=>{
    console.log('profile', profile)

    done(null, profile)
}
passport.use(new Strategy(AUTH_OPTIONS, verifyCallback))

// to save session to the cookie
passport.serializeUser((user, done)=>{
    done(null, user.id)
})

// read session from the cookie
passport.deserializeUser((id, done)=>{
    // User.findById(id).then((user)=>{
    //     done(null, user)
    // })
    done(null, id)
})


const app = express();

app.use(helmet());

app.use(cookieSession({
    name:'session',
    maxAge: 24*60*60*1000,
    keys:[process.env.COOKIE_KEY1, process.env.COOKIE_KEY2]
}))

app.use(passport.initialize())
app.use(passport.session())



const checkLoggedin = (req, res, next)=>{
    console.log(   'current user', req.user)
    const isLoggedIn = req.isAuthenticated() && req.user
    if(!isLoggedIn){
        res.status(401).json({
            error : 'login required'
        })
    }

    next()
}
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
//login using passport
app.get('/auth/google',passport.authenticate('google',{
    scope:['email']
}))

// use passport to configure
app.get('/auth/google/callback',passport.authenticate('google',{
    failureRedirect:'/failure',
    successRedirect :'/', session:true
}),()=>{
    console.log('google called us back!')
})


// to logout
app.get('/auth/logout',(req,res)=>{
req.logout()  // removes req.user and clear logged in session

return  res.redirect('/')
})



app.get('/secret', checkLoggedin, (req, res)=>{
    res.send('thank you jesus')
})
app.get('/failre', (req, res)=>{
    res.status(200).send('failed to login')
})
https.createServer({
        key: fs.readFileSync('key.pem'),
        cert: fs.readFileSync('cert.pem'),
    },app)
    .listen(PORT, () => {
        console.log(`Listening on port ${PORT}...`);
    });