const express        = require("express"),
    app              = express(),
    bodyParser       = require("body-parser"),
    dotenv           = require("dotenv"),
    mongoose         = require("mongoose"),
    mOverride        = require("method-override"),
    seedDB           = require("./seeds"),
    passport         = require("passport"),
    LocalStrategy    = require("passport-local"),
    FacebookStrategy = require("passport-facebook"),
    GoogleStrategy = require('passport-google-oauth20').Strategy,
    passportMongoose = require("passport-local-mongoose"),
    expressSession   = require("express-session"),
    flash            = require("connect-flash"),
    moment           = require("moment"),
    Filter           = require("bad-words");

//Models
const Campground       = require("./models/campground"),
    Comment            = require("./models/comment"),
    Notification       = require("./models/notification"),
    User               = require("./models/user");
//ROUTES
const commentRoutes  = require("./routes/comments"),
    campgroundRoutes = require("./routes/campgrounds"),
    indexRoutes      = require("./routes/index");


// seedDB();
//using the dotenv file for a safe connection
dotenv.config();

mongoose.connect(process.env.DB_CONNECTION, {useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology:true, useFindAndModify: false})
.then(() => {
    console.log("Connected to the DB");
}).catch(err => {
    console.log("could not connect!");
    console.log({message: err.message});
});

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(mOverride("_method"));
app.use(express.static(__dirname + "/public"));
app.use(flash());

app.locals.moment = moment; // this makes moment available as a variable in every EJS page
app.locals.filter = new Filter();  // makes the filter var available in every ejs file

//PASSPORT CONFIG
//setup session
app.use(expressSession({
    secret: process.env.DB_SECRET,
    resave: false,
    saveUninitialized: false
}));

//setup passport
app.use(passport.initialize());
app.use(passport.session());
//creating the Local Strategy
passport.use(new LocalStrategy(User.authenticate()));
// ==============================================================================
// creating the Facebook strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/callback"
 }, function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
}));
// ==============================================================================

//Google strategy for OAuth2
// ==============================================================================
passport.use(new GoogleStrategy({
    clientID: process.env.G_CLIENT_ID_OAUTH,
    clientSecret: process.env.G_CLIENT_SECRET_OAUTH,
    callbackURL: "https://desolate-sierra-95373.herokuapp.com/auth/google/callback"
 }, async function(accessToken, refreshToken, profile, cb) {
    try{
        const user  = await User.findOne({username: profile.displayName}).exec();
        if(!user){
            const newUserObj = {
                username: profile.displayName,
                email: profile.emails[0].value,
                profilePic: profile.photos[0].value
            }
            const newUser =  await User.create(newUserObj);
            return cb(null, newUser);
        }else{
            return cb(null, user);
        }
    }catch(err){
        console.log(err);

        return (err, null);
    }
    
}));

//encoding
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//middleware
//define after passport init!
app.use(async (req, res, next) => {
    res.locals.currentUser = req.user;
    if(req.user){
        try{
            let user = await User.findById(req.user.id).populate("notifications", null, {isRead: false}).exec();
            let u = await User.findById(req.user.id).populate("notifications").exec();
            res.locals.notifications = user.notifications.reverse();
            res.locals.allNotifications = u.notifications.reverse();
        }catch(err){
            console.log(err);
        }
    }
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

//Seting up the routes
app.use("/", indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);
 
//==============================================================================
app.get("/login/facebook", passport.authenticate("facebook"));

app.get("/auth/facebook/callback", passport.authenticate("facebook", {
    failureRedirect: "/login",
    failureFlash: "Something went wrong!"
}), (req, res) => {
    console.log("FACEBOK");
    res.redirect("/campgrounds");
});
//==============================================================================



// ==========================
app.get("/privacy-policy", (req, res) => {
    res.sendFile(__dirname + "/privacy-policy.html");
});

app.get("*", (req, res)=>{
    res.send("Not Found");
});

app.listen(process.env.PORT || 3000, process.env.IP, ()=>{
    console.log("Server started");
});


//NOTES
//Change the API_KEY for the google map at https://console.cloud.google.com/apis/credentials?consoleReturnUrl=https:%2F%2Fcloud.google.com%2Fmaps-platform%2F&consoleUI=CLOUD&project=web-dev-project-1579972016543
// remove localhost://3000 from http refers and add the legit url