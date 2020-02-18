const express = require("express");
const router = express.Router({mergeParams: true});
const User = require("../models/user");
const Campground = require("../models/campground");
const Review = require("../models/review");
const middleware = require("../middleware");

//CREATE ROUTE
router.post("/", middleware.checkReviewExistence, async (req,res) => {
    try{
        const campground = await Campground.findById(req.params.id).populate("reviews").exec();
        const newReview = {
            rating: req.body.rating,
            text: req.body.text
        }

        Review.create(newReview).then(async review => {
            review.author.id = req.user.id;
            review.author.username = req.user.username;
            review.author.profilePic = req.user.profilePic;
            review.campground = campground.id;
            await review.save();

            campground.reviews.push(review);
            campground.rating = averages(campground.reviews);
            await campground.save();
            req.flash("success", "Successfully added a new review!");
            res.redirect("/campgrounds/" + campground.id);
            
        }).catch(err => {
            console.log(err);
            req.flash("error", "Something went wrong!");
            res.redirect("back");
        });
    }catch(err){
        console.log(err);
        req.flash("error", "Something went wrong!");
        res.redirect("back");
    }
   
});

//EDIT route
router.put("/:reviewID", middleware.checkCampgroundOwnership, async (req, res) => {
    const review = await Review.findByIdAndUpdate(req.params.reviewID, req.body.review);

    const campground = await Campground.findById(req.params.id).populate("reviews").exec();

    campground.rating = averages(campground.reviews);

    campground.save();

    req.flash("success", "Successfully edited your review!");
    res.redirect("back");
});


//DELETE route
router.delete("/:reviewID", middleware.checkCampgroundOwnership, async (req, res) => {
    try{
        const review = await Review.findByIdAndDelete(req.params.reviewID).exec();

        const campground = await Campground.findById(req.params.id).populate("reviews").exec();
        campground.reviews.pull(review);
        campground.rating = averages(campground.reviews);
        campground.save();
        
        req.flash("success", "Successfully deleted your review!");
        res.redirect("back");
    }catch(err){
        console.log(err);
        req.flash("error", "Something went wrong!");
        res.redirect("back");
    }
    
});

//functions
function averages(reviews) {
    var sum = 0;
    if(!reviews || reviews.length == 0){
        return 0;
    }
    else{
        reviews.forEach(element => {
            sum += element.rating;
        });
    }
    return Number(sum / reviews.length);
}


module.exports = router;