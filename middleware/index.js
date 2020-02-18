const Comment = require("../models/comment");
const Campground = require("../models/campground");
const Review = require("../models/review");
const middlewareObj = {};

middlewareObj.isLoggedIn = (req, res, next) => {
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You need to be logged in to do that!");
    res.redirect("/login");
}


middlewareObj.checkCommentOwnership = (req, res, next) => {
    if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id)
        .then(comment => {
            if(comment.author.id.equals(req.user.id) || req.user.isAdmin){
                next();
            }else{
                req.flash("error", "You don't have permission to do that!");
                res.redirect("back");
            }
        }).catch(err => {
            res.redirect("back");
        })
    }else{
        req.flash("error", "You need to be logged in to do that!");
        res.redirect("back");
    }
}

middlewareObj.checkCampgroundOwnership = (req, res, next) => {
    if(req.isAuthenticated()){
        Campground.findById(req.params.id).
        then(campground => {
            if(campground.author.id.equals(req.user.id) || req.user.isAdmin)
                next();
            else{
                req.flash("error", "You don't have permission to do that!");
                res.redirect("back");
            }
        }).catch(err => {
            console.log({message: err.message});
            req.flash("error", "Campground not found!");
            res.redirect("/campgrounds/" + req.params.id);
        });
    }else{
        req.flash("error", "You need to be logged in to do that!");
        res.redirect("back");
    }
}

middlewareObj.checkReviewOwnership = async (req, res, next) => {
    if(req.isAuthenticated()){
        try{
            const review = await Review.findById(req.params.review_id).exec();
            if(review.author.id.equals(req.user.id)){
                next();
            }else{
                req.flash("error", "You don't have permission to do that!");
                res.redirect("back");
            }
        }catch(err){
            console.log(err);
            req.flash("error", "Something went wrong!");
            res.redirect("back");
        }
    }
}

middlewareObj.checkReviewExistence = async (req, res, next) => {
    if(req.isAuthenticated()){
        try{
            const campground = await Campground.findById(req.params.id).populate("reviews").exec();
            if(!campground){
                req.flash("error", "Campground not found!");
                res.redirect("back");
            }else{
                const foundReview = campground.reviews.some(review => {
                    return review.author.id.equals(req.user.id);
                });

                if(foundReview){
                    req.flash("error", "You already wrote a review for that campground!");
                    return res.redirect("back");
                }
                next();
            }
        }catch(err){
            console.log(err);
            req.flash("error", "Something went wrong!");
            res.redirect("back");
        }
    }
}

module.exports = middlewareObj;