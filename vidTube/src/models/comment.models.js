/*  id string pk
  createdAt Date
  updatedAt Date
  video ObjectId videos
  owner ObjectId video
   */

import mongoose from "mongoose";
import { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const commentSchema = new Schema(
    {
        video:{
            type:Schema.Types.ObjectId,
            ref:"Video"
        },
        owner:{
            type:Schema.Types.ObjectId,
            ref: "Video"
        },
        content:{
            type:String,
            required:true,
        }
    },
    {
        timestamps:true
    }
)

commentSchema.plugin(mongooseAggregatePaginate)


export const Comment = mongoose.model("Comment",commentSchema)