const express = require("express");
const router = express.Router();
const Campground = require("../models/campground");
const middleware = require("../middleware");
const nodeGeocoder = require("node-geocoder");

require("dotenv").config(); 

const apiKey = process.env.GEOCODER_API_KEY;

const geocoder = nodeGeocoder({provider: "google", httpAdapter: "https",  apiKey: apiKey, formatter: null});

//Make the functions async !!!!
//INDEX ROUTE
router.get("/",  async (req, res)=>{
    //Get campgrounds from the db

    //page limit
    const limit = 8;
    const pageQuery = parseInt(req.query.page);
    const page = pageQuery ? pageQuery : 1;

    //first thing to show on the page
    const startIndex = (page - 1) * limit;

    //limit the search with the page limit variable and skip to the start index
    await Campground.find({}).limit(limit).skip(startIndex).exec()
    .then(async allCampgrounds => {
        await Campground.countDocuments().exec()
        .then(count => {
            res.render("campgrounds/index", {
                campgrounds: allCampgrounds,
                current: page,
                pages: Math.ceil(count / limit),
                page: "home"
            });
        }).catch(err => {
            console.log({message: err.message});
        });

    }).catch(err => {
        console.log({message: err.message});
    });

    // Campground.find({})
    // .then(campgrounds => {
    //     res.render("campgrounds/index", {campgrounds: campgrounds, page: "home"});
    // }).catch(err => {
    //     console.log({message: err.message});
    // });
});

//CREATE ROUTE
router.post("/", middleware.isLoggedIn ,(req, res)=>{
    //req.body.campground has the prepared javaScript object
    const name = req.body.name;
    const price = req.body.price;
    const image = req.body.image;
    const description = req.body.description;
    const author = {
        id: req.user.id,
        username: req.user.username
    };
    //geocodes the addres 
    geocoder.geocode(req.body.location, (err, data) =>{

        if(err || !data.length){
            console.log(err);
            req.flash("error", "Invalid address");
            return res.redirect("back");
        }
        const lat = data[0].latitude;
        const lng = data[0].longitude;
        const location = data[0].formattedAddress;
        
        const newCampground = {name: name, price:price, image: image, description: description, location: location, lat: lat, lng: lng ,author: author};
        Campground.create(newCampground)
        .then(campground => {
            console.log("Newly added campground!");
            console.log(campground);
            req.flash("success", "Successfully added a new campground!");
            res.redirect("/campgrounds/" + campground.id);
        }).catch(err => {
            console.log({message: err.message});
            req.flash("error", "Something went wrong!");
            res.redirect("/campgrounds");
        });
    });
    
    //redirect back to get campgrounds
    
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
        req.flash("error", "Something went wrong!");
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
    geocoder.geocode(req.body.location, (err, data) => {
        if(err || !data.length){
            req.flash("error", "Invalid address!");
            res.redirect("back");
        }

        req.body.campground.lat = data[0].latitude;
        req.body.campground.lng = data[0].longitude;
        req.body.campground.location = data[0].formattedAddress;

        Campground.findByIdAndUpdate(req.params.id, req.body.campground)
        .then(campground => {
            req.flash("success", "Successfully edited " + campground.name);
            res.redirect("/campgrounds/" + req.params.id);
        }).catch(err => {
            console.log({message: err.message});
            res.redirect("/campgrounds/" + req.params.id);
        });
    });
    
})

//DESTROY ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership ,(req, res) => {
    Campground.findByIdAndRemove(req.params.id)
    .then(() => {
        req.flash("success", "Successfully deleted the campground!");
        res.redirect("/campgrounds");
    }).catch(err => {
        console.log({message: err.message});
        res.redirect("/campgrounds");
    });
});

module.exports = router;
