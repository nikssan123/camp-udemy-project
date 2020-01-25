const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");

//root route
router.get("/", (req, res)=>{
    res.render("landing");
});

//Register
//show register form
router.get("/register", (req, res) => {
    res.render("register", {page: "register"});
});

//handle register
router.post("/register", (req, res) => {
    User.register(new User({username: req.body.username}), req.body.password)
    .then(user =>{
        passport.authenticate("local")(req, res, ()=>{
            req.flash("success", "Welcome " + user.username +"!");
            res.redirect("/campgrounds");
        });
    }).catch(err => {
        console.log(err);
        req.flash("error", err.message + "!");
        res.redirect("/register");
    });
});

//Login
//show login form
router.get("/login", (req, res) => {
    res.render("login", {page: "login"});
});

//Login logic
router.post("/login", passport.authenticate("local", {
    successRedirect: "/campgrounds",
    failureRedirect: "/login",
    failureFlash: true,
    successFlash: "Welcome back"
}), (req, res) => {
    
});

//Logout
router.get("/logout", (req, res) => {
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/campgrounds");
});




module.exports = router;