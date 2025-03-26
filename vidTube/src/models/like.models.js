/* 
id string pk
  comment ObjectId comments
  createdAt Date
  updatedAt Date
  video ObjectId video
  likedBy ObjectId users
  tweet ObjectId tweets

*/


import mongoose from "mongoose";
import { Schema } from "mongoose";

const likeSchema = new Schema(
    {
        comment:{
            type:Schema.Types.ObjectId,
            ref:"Comment"
        },
        video:{
            type:Schema.Types.ObjectId,
            ref:"Video"
        },
        likedBy:{
            type:Schema.Types.ObjectId,
            ref:"User",
        },
        tweet:{
            type:Schema.Types.ObjectId,
            ref:"Tweet"
        }
    },
    {
        timeStamps:true
    }
)

export const Like = mongoose.model("Like",likeSchema);