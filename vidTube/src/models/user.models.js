/*   id string pk
  watchHistory ObjectId[] videos
  username string
  email string
  fullName string
  avatar string
  coverImage string
  password string
  refreshToken string
  createdAt Date
  updatedAt Date */

import mongoose,{ Schema } from "mongoose";
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'


const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true
        },
        email:{
            type:String,
            required: true,
            unique:true,
            lowercase:true,
            trim:true,
        },
        fullname:{
            type: String,
            required: true,
            trim:true,
            index:true
        },
        avatar:{
            type:String, //Cloudinary URL
            required:true,
            
        },
        coverImage:{
            type:String, //Cloudinary URL
        },
        watchHistory:[
            {
                type: Schema.Types.ObjectId,
                ref: "Video" //Mention the schema you're referring
            }
        ],
        password:{
            type:String,
            required:[true,"Password is required"]
        },
        refreshToken:{
            type:String
        }
    },
    { timestamps:true }
)

userSchema.pre("save", async function(next){
    //Its not this.modified, its this.isModified
    if(!this.isModified("password")) return next();
    this.password = bcrypt.hash(this.password,10);
    next()
})

//To check the correct password
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(this.password,password)
}

userSchema.methods.generateAccessToken = function(){
    //Short lived access token
    return jwt.sign({ // Give the payload
        _id:this._id,
        email: this.email,
        username: this.username,
        fullname:this.fullname
        },
    process.env.ACCESS_TOKEN_SECRET, //Secret
    {expiresIn: process.env.ACCESS_TOKEN_EXPIRY})
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id:this._id
        },
    process.env.REFRESH_TOKEN_SECRET,
    {expiresIn: process.env.REFRESH_TOKEN_EXPIRY})
}




export const User = mongoose.model("User",userSchema);