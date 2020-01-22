const express        = require("express"),
    app              = express(),
    bodyParser       = require("body-parser"),
    dotenv           = require("dotenv"),
    mongoose         = require("mongoose"),
    mOverride        = require("method-override"),
    seedDB           = require("./seeds"),
    passport         = require("passport"),
    LocalStrategy    = require("passport-local"),
    passportMongoose = require("passport-local-mongoose"),
    expressSession   = require("express-session"),
    flash            = require("connect-flash"),
    moment           = require("moment");

//Models
const Campground       = require("./models/campground"),
    Comment            = require("./models/comment"),
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

// mongoose.connect("mongodb://localhost/yelp_camp", {useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology:true, useFindAndModify: false})
// .then(() => {
//     console.log("Connected to the DB");
// }).catch(err => {
//     console.log("could not connect!");
//     console.log({message: err.message});
// });

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(mOverride("_method"));
app.use(express.static(__dirname + "/public"));
app.use(flash());
app.locals.moment = moment; // this makes moment available as a variable in every EJS page

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
//encoding
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//middleware
//define after passport init!
app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

//Seting up the routes
app.use("/", indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);

// ==========================
app.get("*", (req, res)=>{
    res.send("Not Found");
});

app.listen(3000, ()=>{
    console.log("Server listening on PORT 3000");
});
