const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
   userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String },                         
  mediaUrl: { type: String, required: true },     
  mediaType: { 
    type: String, 
    enum: ["image", "video"], 
    required: true 
  },                                             
  createdAt: { type: Date, default: Date.now } ,
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }
]



});

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
