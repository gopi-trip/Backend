/* 
id string pk
  subscriber ObjectId users
  channel ObjectId users
  createdAt Date
  updatedAt Date
   */


import mongoose from "mongoose";
import { Schema } from "mongoose";

const subsSchema = new Schema(
    {
        subscriber:{
            type:Schema.Types.ObjectId,
            ref:"User"
        },
        channel:{
            type:Schema.Types.ObjectId,
            ref:"User"
        }
    },
    {
        timeStamps:true
    }
)

export const Subscription = mongoose.model("Subscription",subsSchema)