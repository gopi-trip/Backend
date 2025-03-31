import { asyncHandler } from "../utils/asyncHandler.js";
import {apiError} from '../utils/apiError.js'
import {User} from '../models/user.models.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import { apiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler(
    async (req,res) => {
        const {fullName,email,username,password} = req.body

        //Validaion - ??
        /* if(fullName?.trim() === ''){
            throw new apiError(400,"Full name is required")
        } */
       if(
        [fullName,username,email,password].some(field => field?.trim() === "")
       ){
        throw new apiError(400,"All fields are required")
       }

    const existedUser = await User.findOne({
        $or: [{username},{email}]
    })

    if(existedUser){
        throw new apiError(400,"User with this email or username already exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0]?.path

    if(!avatarLocalPath){
        throw new apiError(400,"Avatar file is missing!")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = ""
    if(!coverImageLocalPath){
        throw new apiError(400,"Cover Image is missing!")
    }else{
        coverImage = await uploadOnCloudinary(coverImageLocalPath)
    }
    
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new apiError(500,"Something went wrong while registering a user")
    }

    return res
        .status(201)
        .json(new apiResponse(201,createdUser,"User registered successfully"))
    }
)

export { 
    registerUser
 }