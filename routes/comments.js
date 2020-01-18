const express = require("express");
//will take params from the app.js => take the :id passed
const router = express.Router({mergeParams: true});
const Campground = require("../models/campground");
const Comment = require("../models/comment");
const middleware = require("../middleware");

//Comments new route
router.get("/new", middleware.isLoggedIn ,(req, res) => {
    Campground.findById(req.params.id)
    .then(campground => {
        res.render("comments/new", {campground: campground});
    }).catch(err => {
        console.log({message: err.message});
        res.redirect("/campgrounds");
    })
    
});

//Comments create route
router.post("/", middleware.isLoggedIn ,(req, res) => {
    //find campground by id
    Campground.findById(req.params.id)
    .then(campground => {
        //create new comment
        Comment.create(req.body.comment)
        .then(async comment => {
            //add the user id and username association to the comment
            comment.author.id = req.user.id;
            comment.author.username = req.user.username;
            await comment.save();
            //add the comment to the campground
            campground.comments.push(comment);
            await campground.save();
            req.flash("success", "Successfully added comment!");
            //redirect 
            res.redirect("/campgrounds/" + req.params.id);
        }).catch(err => {
            console.log({message: err.message});
            req.flash("error", "Something went wrong!");
            res.redirect("/campgrounds/" + req.params.id);
        });
    }).catch(err => {
        console.log({message: err.message});
        req.flash("error", "Something went wrong!");
        res.redirect("/campgrounds/" + req.params.id);
    });
});

//EDIT ROUTE
router.get("/:comment_id/edit", middleware.checkCommentOwnership, (req, res) => {
    Comment.findById(req.params.comment_id)
    .then(comment => {
        res.render("comments/edit", {campground_id: req.params.id, comment: comment});
    }).catch(err => {
        console.log({message: err.message});
        res.redirect("back");
    });
    
});

//UPDATE ROUTE
router.put("/:comment_id", middleware.checkCommentOwnership, (req, res) => {
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment)
    .then(()=>{
        res.redirect("/campgrounds/" + req.params.id);
    }).catch(err => {
        console.log({message: err.message});
        res.redirect("campgrounds/" + req.params.id);
    });
});

//DELETE ROUTE
router.delete("/:comment_id", middleware.checkCommentOwnership,  (req, res) => {
    Comment.findByIdAndDelete(req.params.comment_id)
    .then(()=>{
        req.flash("success", "Comment deleted!");
        res.redirect("back");
    }).catch(err => {
        console.log({message: err.message});
        req.flash("error", "Something went wrong!");
        res.redirect("back");
    });
});


module.exports = router;