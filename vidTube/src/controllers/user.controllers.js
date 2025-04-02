import { asyncHandler } from "../utils/asyncHandler.js";
import {apiError} from '../utils/apiError.js'
import {User} from '../models/user.models.js'
import {uploadOnCloudinary,deleteFromCloudinary} from '../utils/cloudinary.js'
import { apiResponse } from "../utils/apiResponse.js";

const registerUser = asyncHandler(
    async (req,res) => {
        const {fullname,email,username,password} = req.body

        //Validaion - ??
        /* if(fullname?.trim() === ''){
            throw new apiError(400,"Full name is required")
        } */
       if(
        [fullname,username,email,password].some(field => field?.trim() === "")
       ){
        throw new apiError(400,"All fields are required")
       }

    const existedUser = await User.findOne({
        $or: [{username},{email}]
    })

    if(existedUser){
        throw new apiError(400,"User with this email or username already exists")
    }
    console.warn(req.files);
    const avatarLocalPath = req.files?.avatar?.[0]?.path
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path

    if(!avatarLocalPath){
        throw new apiError(400,"Avatar file is missing!")
    }

  /*   const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = ""
    if(!coverImageLocalPath){
        throw new apiError(400,"Cover Image is missing!")
    }else{
        coverImage = await uploadOnCloudinary(coverImageLocalPath)
    } */
    
    let avatar;
    try {
        avatar = await uploadOnCloudinary(avatarLocalPath)
        console.log("Uploaded avatar",avatar);
        
    } catch (error) {
        console.log("Error uploading avatar",error);
        throw new apiError(500,"Failed to upload avatar")
    }

    let coverImage;
    try {
        coverImage = await uploadOnCloudinary(coverImageLocalPath)
        console.log("Uploaded CoverImage",coverImage);
        
    } catch (error) {
        console.log("Error uploading avatar",error);
        throw new apiError(500,"Failed to upload coverImage")
    }


    try {
        const user = await User.create({
            fullname,
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
    } catch (error) {
        console.log("User Creation failed");
        if(avatar){
            await deleteFromCloudinary(avatar.public_id)
        }
        if(coverImage){
            await deleteFromCloudinary(coverImage.public_id)
        }
        throw new apiError(500,"Something went wrong while registering a user and Images were deleted")
    }
    }
)

export { 
    registerUser
 }