const Comment = require("../models/comment");
const Campground = require("../models/campground");
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


module.exports = middlewareObj;