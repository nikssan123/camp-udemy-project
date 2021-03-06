const express = require("express");
//will take params from the app.js => take the :id passed
const router = express.Router({mergeParams: true});
const Campground = require("../models/campground");
const Comment = require("../models/comment");
const User = require("../models/user");
const Notification = require("../models/notification");
const middleware = require("../middleware");



//Not used anymore
//Comments new route
// router.get("/new", middleware.isLoggedIn ,(req, res) => {
//     Campground.findById(req.params.id)
//     .then(campground => {
//         res.render("comments/new", {campground: campground});
//     }).catch(err => {
//         console.log({message: err.message});
//         res.redirect("/campgrounds");
//     })
    
// });

//Comments create route
router.post("/", middleware.isLoggedIn ,(req, res) => {
    //find campground by id
    Campground.findById(req.params.id)
    .then(campground => {
        //create new comment
        Comment.create(req.body.comment)
        .then(async comment => {
            try{  
                const campUser = await User.findById(campground.author.id);
                if(campUser.id !== req.user.id){
                    const newNotification = {
                        text: req.user.username + " commented your post!",
                        link: "/campgrounds/" + campground.id
                    }
                    const notification = await Notification.create(newNotification);
    
                    
                    campUser.notifications.push(notification);
                    await campUser.save();
                }
               

                //add the user id and username association to the comment
                comment.author.id = req.user.id;
                comment.author.username = req.user.username;
                comment.author.profilePic = req.user.profilePic;
                await comment.save();
                //add the comment to the campground
                campground.comments.push(comment);
                await campground.save();
                req.flash("success", "Successfully added comment!");
                //redirect 
                res.redirect("/campgrounds/" + req.params.id);
            }catch(err){
                console.log(err);
                req.flash("error", "Something went wrong!");
                res.redirect("/campgrounds/" + req.params.id);
            }
            
        }).catch(err => {
            console.log({message: err});
            console.log(err);
            req.flash("error", "Something went wrong!");
            res.redirect("/campgrounds/" + req.params.id);
        });
    }).catch(err => {
        console.log({message: err});
        console.log(err);
        req.flash("error", "Something went wrong!");
        res.redirect("/campgrounds/" + req.params.id);
    });
});

//not used anymore
//EDIT ROUTE
// router.get("/:comment_id/edit", middleware.checkCommentOwnership, (req, res) => {
//     Comment.findById(req.params.comment_id)
//     .then(comment => {
//         res.render("comments/edit", {campground_id: req.params.id, comment: comment});
//     }).catch(err => {
//         console.log({message: err.message});
//         res.redirect("back");
//     });
    
// });

//UPDATE ROUTE
router.put("/:comment_id", middleware.checkCommentOwnership, (req, res) => {
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment)
    .then(()=>{
        req.flash("success", "Successfully edited the comment!");
        res.redirect("/campgrounds/" + req.params.id);
    }).catch(err => {
        console.log({message: err.message});
        res.redirect("campgrounds/" + req.params.id);
    });
});

//DELETE ROUTE
router.delete("/:comment_id", middleware.checkCommentOwnership,  (req, res) => {

    Campground.findById(req.params.id)
    .then(campground => {
        //array.some() method is used to find the comment in the comments array and pull it from that campground
        campground.comments.some(comment => {
            if(comment.equals(req.params.comment_id)){
                campground.comments.pull(comment);
            }
        });

        Comment.findByIdAndDelete(req.params.comment_id)
        .then(()=>{
            req.flash("success", "Comment deleted!");
            res.redirect("back");
        }).catch(err => {
            console.log({message: err.message});
            req.flash("error", "Something went wrong!");
            res.redirect("back");
        });
    }).catch(err => {
        console.log({message: err.message});
        req.flash("error", "Something went wrong!");
        res.redirect("back");
    })

});


module.exports = router;