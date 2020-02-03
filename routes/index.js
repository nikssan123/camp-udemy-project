const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user");
const middleware = require("../middleware");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const multer = require("multer");
const cloudinary = require("cloudinary");

//setting up express-validator middleware
const { check, validationResult } = require('express-validator');

//Set up multer
const storage = multer.diskStorage({
    filename: (req, file, cb) => {
        cb(null, Date.now() + file.originalname);
    }
});

const imageFilter = function(req, file, cb){
    //accept only those image formats
    if(!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)){
        return cb(new Error("Only jpg|jpeg|png|gif files are allowed!"), false);
    }

    cb(null, true);
}

//Set up Cloudinary
cloudinary.v2.config({
    cloud_name: "nikssan123",
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer({storage: storage, fileFilter: imageFilter});

//root route
router.get("/", (req, res)=>{
    res.render("landing");
});

//Register
//show register form
router.get("/register", (req, res) => {
    res.render("auth/register", {page: "register"});
});

//handle register
//use express-validator middleware to validate the inputed username and password
router.post("/register", [
    check("username").trim().not().isEmpty(),
    check("password").isLength({min: 5}).withMessage("be atleast 5 characters long!")
    .matches(/\d/).withMessage("contain a number!"),
    check("email").trim().not().isEmpty(),
    check("email").isEmail()
    
] ,(req, res) => {
    
    //the errors that are potentially passed
    const errors = validationResult(req);
    if(errors.isEmpty()){
        User.register(new User({username: req.body.username, email: req.body.email}), req.body.password)
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
        }else if(error.param === "email"){
            req.flash("error", "You must enter a valid email address!");
        }
        
        res.redirect("/register");
    }
});

//Login
//show login form
router.get("/login", (req, res) => {
    res.render("auth/login", {page: "login"});
});

//Login logic
router.post("/login", passport.authenticate("local", {
    successRedirect: "/campgrounds",
    failureRedirect: "/login",
    failureFlash: true,
    successFlash: "Welcome back!",
}), (req, res) => {
    
});

//Logout
router.get("/logout", (req, res) => {
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/campgrounds");
});


//FORGOT password-reset path
router.get("/forgot", (req, res) => {
    res.render("auth/forgot");
});

router.post("/forgot", async (req, res) => {

    try{
        //create a random token of 20 chars
        let token;
        crypto.randomBytes(20, (err, buf) => {
            token = buf.toString("hex");
        });

        //find a user with the email provided by the user
        await User.findOne({email: req.body.email}).then(async user => {
            //sent an error message if an user with that email cant be found
            if(!user){
                req.flash("error", "No account is associated with that account!");
                return res.redirect("/forgot");
            }

            //create the reset token and duration
            user.resetPasswordToken = token;
            user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; //1 hour
            
            //save the user and then create the nodemailer transport with oAuth2
            await user.save().then(user => {
                const transport = nodemailer.createTransport({
                    host: "smtp.gmail.com",
                    auth: {
                        type: "OAuth2",
                        user: "fornax.elit@gmail.com",
                        clientId: process.env.GOOGLE_CLIENT_ID,
                        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                        refreshToken: process.env.GOOGLE_REFRESH_TOKEN                              
                    }
                });
        
                //this are the contents of the email
                const mailOptions = {
                    to: user.email,
                    from: "fornax.elit@gmail.com",
                    subject: "YelcCamp Password Reset!",
                    text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                    'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                    'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                    'If you did not request this, please ignore this email and your password will remain unchanged.\n'
                };
        
                //send the actual mail
                transport.sendMail(mailOptions).then(() => {
                    req.flash("success", "An e-mail has been sent with further instructions!");
                    res.redirect("/forgot");
                }).catch(err => {
                    console.log("work");
                    console.log(err);
                })
            }).catch(err => {
                console.log(err);
            })
        }).catch(err => {
            console.log({message: err.message});
        });

    }catch(err){
        console.log(err);
    }
});

router.get("/reset/:token", async (req, res) => {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('/forgot');
        }
        res.render('auth/reset', {token: req.params.token});
      });
});

router.post("/reset/:token", [
    check("password").isLength({min: 5}).withMessage("be atleast 5 characters long!")
    .matches(/\d/).withMessage("contain a number!")
] , async (req,res) => {

    const errors = validationResult(req);
    if(errors.isEmpty()){
        await User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now()}})
        .then( user => {
            if(!user){
                req.flash("error", "Password token is invalid or has expired!");
                res.redirect("/forgot");
            }
            
            if(req.body.password === req.body.password2){
                //use passport-mongoose method to change the passowrd -> pass the new password
                user.setPassword(req.body.password).then(async () => {
                    //reset the token
                    user.resetPasswordToken = undefined;
                    user.resetPasswordExpires = undefined;

                    //save the changes and login the user -> callback is neccessary
                    await user.save().then(() => {
                        req.logIn(user, err => {
                            req.flash("succes", "Password successfully changed!");
                            res.redirect("/campgrounds");
                        });
                    }).catch(err => {
                        console.log(err);
                        res.redirect("back");
                    });
                });
            }else{
                req.flash("error", "Passwords do not match!");
                res.redirect("back");
            }

        }).catch(err => {
            console.log(err);
            req.flash("error", "Something went wrong!");
            res.redirect("/forgot");
        });
    }else{
        //handle the different errors        
        const error = errors.errors[0];
        console.log(error)
        if(error.param === "password"){
            req.flash("error", "Password must " + error.msg);
        }
        
        res.redirect("/reset/" + req.params.token);
    }
});

//USER SETTINGS
router.get("/settings",  middleware.isLoggedIn, (req, res) => {
    res.render("user/edit");
});

router.put("/settings", upload.single('profilePic'), middleware.isLoggedIn, [
    check("username").trim().not().isEmpty(),
    check("email").isEmail()
], async (req, res) => {

    //find the user by his username
    User.findOne({username: req.user.username}).then(async user => {
        user.username = req.body.username;
        user.email = req.body.email;

        if(req.file){
            if(user.profilePic !== "https://res.cloudinary.com/nikssan123/image/upload/v1580680721/profile_ir66l2.jpg"){
                try{
                    await cloudinary.v2.uploader.destroy(user.imageID);
                }catch(err){
                    req.flash("error", "Somehting went wrong!");
                    res.redirect("/campgrounds");
                }
            }
            await cloudinary.v2.uploader.upload(req.file.path).then(async result => {
                user.profilePic = result.secure_url;
                user.imageID = result.public_id;
            }).catch(err => {
                console.log({message: err.message});
                if(err)
                    req.flash("error", err.message);
                else
                    req.flash("error", "Something went wrong!");

                res.redirect("/campgrounds");
            });
        }

        await user.save().then(() => {
            req.logIn(user, err => {
                req.flash("success", "Successfully edited your account settings!");
                res.redirect("/campgrounds");
            });
        }).catch(err => {
            console.log(err);
            req.flash("error", "Something went wrong!");
            res.redirect("/settings");
        });
    }).catch(err => {
        console.log(err);
        req.flash("error", "Something went wrong!");
        res.redirect("/settings");
    });
    
});

router.delete("/settings", middleware.isLoggedIn, (req, res) => {
    User.findOneAndDelete({_id: req.user._id}).then(async user => {
        console.log(user);
        if(req.user.profilePic !== "https://res.cloudinary.com/nikssan123/image/upload/v1580680721/profile_ir66l2.jpg"){
            try{
                await cloudinary.v2.uploader.destroy(user.imageID);
            }catch(err){
                req.flash("error", "Somehting went wrong!");
                res.redirect("/campgrounds");
            }
        }
        req.flash("error", "Successfully deleted account!");
        res.redirect("/campgrounds");
    }).catch(err => {
        console.log({message: err.message});
        req.flash("error", "Something went wrong!");
        res.redirect("/settings");
    });
});


router.get("/app-ads.txt", (req,res) => {
    res.sendFile(__dirname + "/app-ads.txt");
});


module.exports = router;