const mongoose = require("mongoose");
const Campground = require("./models/campground");
const Comment = require("./models/comment");

const data = [
    {
        name: "Clouds Rust",
        image: "https://images.unsplash.com/photo-1497900304864-273dfb3aae33?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1088&q=80",
        description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Nobis dolores non atque magni officiis a ad! Architecto nihil quam adipisci,ut minima aliquid atque, ad quod iusto ex nesciunt incidunt illo fuga facilis. Porro impedit beatae rem?"
    },
    {
        name: "Icy Mountains",
        image: "https://images.unsplash.com/photo-1534806826444-f55ae657104d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=967&q=80",
        description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Nobis dolores non atque magni officiis a ad! Architecto nihil quam adipisci,ut minima aliquid atque, ad quod iusto ex nesciunt incidunt illo fuga facilis. Porro impedit beatae rem?"    },
    {
        name: "Forest Hut",
        image: "https://images.unsplash.com/photo-1455763916899-e8b50eca9967?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1050&q=80",
        description: "Lorem ipsum dolor sit amet consectetur adipisicing elit. Nobis dolores non atque magni officiis a ad! Architecto nihil quam adipisci,ut minima aliquid atque, ad quod iusto ex nesciunt incidunt illo fuga facilis. Porro impedit beatae rem?"    }
];

async function seedDB(){
    //Remove all Campgrounds
    try{
        await Promise.all([
            Comment.deleteMany({}),
            Campground.deleteMany({})
        ]);
        console.log("Removed all campgrounds and comments");
    }catch(err){
        console.log({message: err.message});
    }

    data.forEach(seed => {
        Campground.create(seed)
        .then(campground => {
            console.log("Added campground!");
            Comment.create(
                {
                    text: "A great place to relax",
                    author: "Homer"
                }
            ).then(async comment => {
                campground.comments.push(comment);
                console.log("Added a comment");
                await campground.save();
            }).catch(err => {
                console.log(err);
            });
        }).catch(err => {
            console.log(err);
        });
      
    });
    //add campgrounds
    
}

module.exports = seedDB;