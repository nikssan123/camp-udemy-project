const express = require("express");
const router = express.Router();
const Campground = require("../models/campground");
const middleware = require("../middleware");

//Make the functions async !!!!
//INDEX ROUTE
router.get("/",  (req, res)=>{
    //Get campgrounds from the db
    Campground.find({})
    .then(campgrounds => {
        res.render("campgrounds/index", {campgrounds: campgrounds});
    }).catch(err => {
        console.log({message: err.message});
    });
});

//CREATE ROUTE
router.post("/", middleware.isLoggedIn ,(req, res)=>{
    //req.body.campground has the prepared javaScript object
    const name = req.body.name;
    const price = req.body.price;
    const image = req.body.image;
    console.log("image");
    const description = req.body.description;
    const author = {
        id: req.user.id,
        username: req.user.username
    };
    const newCampground = {name: name, price:price, image: image, description: description, author: author};
    Campground.create(newCampground)
    .then(campground => {
        console.log("Newly added campground!");
        console.log(campground);
    }).catch(err => {
        console.log({message: err.message});
    });
    //redirect back to get campgrounds
    res.redirect("/campgrounds");
});

//NEW ROUTE
router.get("/new", middleware.isLoggedIn ,(req, res)=>{
    res.render("campgrounds/new");
});

//SHOW ROUTE
router.get("/:id", (req, res)=>{
    let id = req.params.id;
    //.populate("comments").exec() will populate the comments array of the Campground object
    Campground.findById(id).populate("comments").exec()
    .then(campground => {
        res.render("campgrounds/show", {campground: campground});
    }).catch(err => {
        console.log({message: err.message});
        res.redirect("/campgrounds");
    });
});

//EDIT ROUTE
router.get("/:id/edit", middleware.checkCampgroundOwnership, (req, res) => {
    Campground.findById(req.params.id).
    then(campground => {
        res.render("campgrounds/edit", {campground: campground});
    }).catch(err => {
        console.log({message: err.message});
        res.redirect("/campgrounds/" + req.params.id);
    });
});

//UPDATE ROUTE
router.put("/:id", middleware.checkCampgroundOwnership, (req, res) => {
    Campground.findByIdAndUpdate(req.params.id, req.body.campground)
    .then(campground => {
        res.redirect("/campgrounds/" + req.params.id);
    }).catch(err => {
        console.log({message: err.message});
        res.redirect("/campgrounds/" + req.params.id);
    })
})

//DESTROY ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership ,(req, res) => {
    Campground.findByIdAndRemove(req.params.id)
    .then(() => {
        res.redirect("/campgrounds");
    }).catch(err => {
        console.log({message: err.message});
        res.redirect("/campgrounds");
    });
});

module.exports = router;
