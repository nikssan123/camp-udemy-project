const express = require("express");
const router = express.Router();
const Campground = require("../models/campground");
const Comment = require("../models/comment");
const Review = require("../models/review");
const Notification = require("../models/notification");
const User = require("../models/user");
const middleware = require("../middleware");
const nodeGeocoder = require("node-geocoder");
const FuzzySearch = require("fuzzy-search");
const multer = require("multer");
const cloudinary = require("cloudinary");

require("dotenv").config(); 

//set up nodeGeocoder
const apiKey = process.env.GEOCODER_API_KEY;

const geocoder = nodeGeocoder({provider: "google", httpAdapter: "https",  apiKey: apiKey, formatter: null});

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

//INDEX ROUTE
router.get("/",  async (req, res)=>{

    //Get the searched keyword
    let keyword = req.query.word;
    //page limit
    const limit = keyword ? undefined : 8;
    const pageQuery = parseInt(req.query.page);
    const page = pageQuery ? pageQuery : 1;

    //first thing to show on the page
    const startIndex = (page - 1) * limit;

    keyword ? keyword = keyword : keyword = {};
    
    //limit the search with the page limit variable and skip to the start index
    await Campground.find({}).limit(limit).skip(startIndex).exec()
        .then(async allCampgrounds => {
            //search in allCampgrounds array for name, description and author propties
            const searcher = new FuzzySearch(allCampgrounds, ['name', 'description', 'author'], {
                caseSensitive: false,
            });
            const result = searcher.search(keyword);
            await Campground.countDocuments().exec()
            .then(count => {
                res.render("campgrounds/index", {
                    campgrounds: result.length === 0 ? allCampgrounds : result,
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
    
});

//CREATE ROUTE
router.post("/", middleware.isLoggedIn, upload.single("imageFile"), (req, res)=>{
    //req.body.campground has the prepared javaScript object
    const name = req.body.name;
    const price = req.body.price;
    let image = req.body.image;
    const description = req.body.description;
    const author = {
        id: req.user.id,
        username: req.user.username
    };
    //geocodes the addres 
    geocoder.geocode(req.body.location, async (err, data) =>{

        if(err || !data.length){
            console.log(err);
            req.flash("error", "Invalid address");
            return res.redirect("back");
        }
        const lat = data[0].latitude;
        const lng = data[0].longitude;
        const location = data[0].formattedAddress;

        
        
        //if there is a file provided by the user -> save the file -> else use the link
        if(req.file){
            await cloudinary.v2.uploader.upload(req.file.path).then(async result => {
                image = result.secure_url;
                imageID = result.public_id;
                const newCampground = {name: name, price:price, image: image, imageID: imageID, description: description, location: location, lat: lat, lng: lng ,author: author};
                await Campground.create(newCampground)
                .then(async campground => {
                    await createNotification(req.user, campground);
                    console.log("Newly added campground!");
                    console.log(campground);
                    req.flash("success", "Successfully added a new campground!");
                    res.redirect("/campgrounds/" + campground.id);
                    
                }).catch(err => {
                    console.log({message: err.message});
                    if(err)
                        req.flash("error", err.message);
                    else
                        req.flash("error", "Something went wrong!");
                    res.redirect("/campgrounds");
                });
            });
        }else{
            const newCampground = {name: name, price:price, image: image, imageID: undefined, description: description, location: location, lat: lat, lng: lng ,author: author};
            await Campground.create(newCampground)
            .then(async campground => {
                await createNotification(req.user, campground);
                console.log("Newly added campground!");
                console.log(campground);
                req.flash("success", "Successfully added a new campground!");
                res.redirect("/campgrounds/" + campground.id);
            }).catch(err => {
                console.log({message: err.message});
                if(err)
                        req.flash("error", err.message);
                else
                    req.flash("error", "Something went wrong!");
                res.redirect("/campgrounds");
            });
        }
    });
});

//NEW ROUTE
router.get("/new", middleware.isLoggedIn ,(req, res)=>{
    res.render("campgrounds/new");
});

//SHOW ROUTE
router.get("/:id", (req, res)=>{
    let id = req.params.id;
    //.populate("comments").exec() will populate the comments array of the Campground object
    Campground.findById(id).populate("comments likes reviews").exec()
    .then(campground => {
        campground.comments.reverse();
        campground.likes.reverse();
        campground.reviews.reverse();
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
router.put("/:id", middleware.checkCampgroundOwnership,  upload.single("imageFile"), (req, res) => {
    geocoder.geocode(req.body.location, (err, data) => {
        if(err || !data.length){
            req.flash("error", "Invalid address!");
            res.redirect("back");
        }

        req.body.campground.lat = data[0].latitude;
        req.body.campground.lng = data[0].longitude;
        req.body.campground.location = data[0].formattedAddress;
        
        Campground.findByIdAndUpdate(req.params.id, req.body.campground)
        .then(async campground => {
            //if the user has a uploaded a file override the campground.image
            if(req.file){
                try{
                    //if there is already an imageID saved -> remove the image from cloudinary
                    if(campground.imageID)
                        await cloudinary.v2.uploader.destroy(campground.imageID);

                    const result = await cloudinary.v2.uploader.upload(req.file.path);

                    //save the results
                    campground.imageID = result.public_id;
                    campground.image = result.secure_url;
                    await campground.save();
                }catch(err){
                    console.log(err);
                    req.flash("error", "Something went wrong!");
                    res.redirect("/campgrounds/" + campground.id + "/edit");
                }
            }
            
            req.flash("success", "Successfully edited " + campground.name);
            res.redirect("/campgrounds/" + req.params.id);
        }).catch(err => {
            console.log({message: err.message});
            res.redirect("/campgrounds/" + req.params.id);
        });
    
    });
    
})

//DESTROY ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership, (req, res) => {
    Campground.findById(req.params.id)
    .then(async campground => {
        
        if(campground.imageID){
            try{
                await cloudinary.v2.uploader.destroy(campground.imageID);
            }catch(err){
                req.flash("error", "Somehting went wrong!");
                res.redirect("/campgrounds");
            }
        }
        //FIX
        //Does not delete comment and reviews associated with that campground!!!
        try{
            Comment.deleteMany({id: {$in: campground.comments}}).then(() => {
                Review.deleteMany({id: {$in: campground.reviews}}).then(async ()=> {
                    await campground.remove();
                    req.flash("success", "Successfully deleted the campground!");
                    res.redirect("/campgrounds");
                });
            });
        }catch(err){
            console.log(err);
            req.flash("error", "Something went wrong!");
            res.redirect("back");
        }
    }).catch(err => {
        console.log({message: err.message});
        res.redirect("/campgrounds");
    });
});

//LIKES ROUTE

router.post("/:id/like", middleware.isLoggedIn, (req, res) => {
    Campground.findById(req.params.id)
    .then(async campground => {
        let isLiked = campground.likes.some(like => {
            return like.equals(req.user.id);
        });

        if(isLiked){
            campground.likes.pull(req.user.id);
        }else{
            campground.likes.push(req.user);
        }

        await campground.save();

        res.redirect("/campgrounds/" + req.params.id);
    }).catch(err => {
        console.log({message: err.message});
        req.flash("error", "Something went wrong!");
        res.redirect("/campgrounds/" + req.params.id);
    });
});

router.get("/:campID/:notID", async (req,res) => {
    // const user  = User.findById(req.user.id).populate("notifications");
    try{
        const notification = await Notification.findById(req.params.notID);
        notification.isRead = true;
        await notification.save();
        res.redirect("/campgrounds/" + req.params.campID);
    }catch(err){
        console.log(err);
        req.flash("error", "Something went wrong!");
        res.redirect("/campgrounds");
    }
    
});

// Functions
async function createNotification(user, campground){
    try{
        const currentUser = await User.findById(user.id).populate("followers").exec();
        console.log(currentUser);
        const newNotitication = {
            link: "/campgrounds/" + campground.id,
            text: currentUser.username + " created a new campground!"
        }
        const notification = await Notification.create(newNotitication);
        currentUser.followers.forEach(async follower => {
            console.log(follower);
            console.log(notification);
            follower.notifications.push(notification);
            follower.save();
        });
        
    }catch(err){
        console.log(err);
    }
}


module.exports = router;
