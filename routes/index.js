const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");
//setting up express-validator middleware
const { check, validationResult } = require('express-validator');

// router.use(validator());

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
//use express-validator middleware to validate the inputed username and password
router.post("/register", [
    check("username").not().isEmpty(),
    check("password").isLength({min: 5}).withMessage("be atleast 5 characters long!")
    .matches(/\d/).withMessage("contain a number!")
] ,(req, res) => {
    
    //the errors that are potentially passed
    const errors = validationResult(req);
    if(errors.isEmpty()){
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
    }else{
        //handle the different errors
        const error = errors.errors[0];
        if(error.param === "password"){
            req.flash("error", "Password must " + error.msg);
        }else if(error.param === "username"){
            req.flash("error", "Username field is required!");
        }
        
        res.redirect("/register");
    }
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
    successFlash: "Welcome back",
}), (req, res) => {
    
});

//Logout
router.get("/logout", (req, res) => {
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/campgrounds");
});

router.get("/app-ads.txt", (req,res) => {
    res.sendFile(__dirname + "/app-ads.txt");
})


module.exports = router;