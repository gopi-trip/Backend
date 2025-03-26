/* 
 id string pk
  videoFile string
  thumbnail string
  owner ObjectId users
  title string
  description string
  duration number
  views number
  isPublished boolean
  createdAt Date
  updatedAt Date
   */


import mongoose from "mongoose";
import { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema = new Schema(
    {
        videoFile:{
            type:String, //Cloudinary URL
            required: true
        },
        thumbnail:{
            type:String,
            required:true
        },
        title:{
            type:String,
            required:true
        },
        description:{
            type:String,
            
        },
        views:{
            type:Number,
            default:0
        },
        duration:{
            type:Number,
            required:true
        },
        isPublished: {
            type:Boolean,
            default:true
        },
        owner:{
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    { timestamps:true},

);

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video",videoSchema);