import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from '../utils/apiError.js'
import { User } from '../models/user.models.js'
import { uploadOnCloudinary,deleteFromCloudinary } from '../utils/cloudinary.js'
import { apiResponse } from "../utils/apiResponse.js";

const generateAccessAndRefreshTokens = async (userId) => {
   try {
     const user = await User.findById(userId)
     if(!user){
         throw new apiError(404,"User could not be found")
     }
     const accessToken = user.generateAccessToken()
     const refreshToken = user.generateRefreshToken()
 
     user.refreshToken = refreshToken
     await user.save({validateBeforeSave:false})
     return {accessToken,refreshToken}
   } catch (error) {
        throw new apiError(404,"Something went wrong while generating access and refresh tokens",error)
   }
}

const registerUser = asyncHandler(
    async (req,res) => {
        //Step-1 - Accept data from the user
        const { fullname,email,username,password } = req.body

        //Validaion (Only for name)
        /* if(fullname?.trim() === ''){
            throw new apiError(400,"Full name is required")
        } */

        //Validation for each field
       if(
        [fullname,username,email,password].some(field => field?.trim() === "")
       ){
        throw new apiError(400,"All fields are required")
       }

    // Finding user using the username or email
    const existedUser = await User.findOne({
        $or: [{ username },{ email }] 
    })

    //If user exists, throw an error
    if(existedUser){
        throw new apiError(409,"User with this email or username already exists")
    }

    console.warn(req.files);
    const avatarLocalPath = req.files?.avatar?.[0]?.path
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path

    //If avatar isn't there then throw an error
    if(!avatarLocalPath){
        throw new apiError(400,"Avatar file is missing!")
    }

    //Edit: Previous Uploading process for avatar and cover image files 
  /*   const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = ""
    if(!coverImageLocalPath){
        throw new apiError(400,"Cover Image is missing!")
    }else{
        coverImage = await uploadOnCloudinary(coverImageLocalPath)
    } */
    
    //Uploading the avatar file to Cloudinary
    let avatar;
    try {
        avatar = await uploadOnCloudinary(avatarLocalPath)
        console.log("Uploaded avatar",avatar);
        
    } catch (error) {
        console.log("Error uploading avatar",error);
        throw new apiError(500,"Failed to upload avatar")
    }

    //Uploading the cover image to Cloudinary
    let coverImage;
    try {
        coverImage = await uploadOnCloudinary(coverImageLocalPath)
        console.log("Uploaded CoverImage",coverImage);
        
    } catch (error) {
        console.log("Error uploading avatar",error);
        throw new apiError(500,"Failed to upload coverImage")
    }

    //Creating a user (We've already checked if he/she exists or not)
    try {
        const user = await User.create({
            fullname,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username: username.toLowerCase()
        });
        
        //Verify if the user was created or not
        //So, we fetch the user using its _id (using MongoDB)
        //We're intentionally deselecting certain fields such as the password and the refresh token so we don't fetch that
        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        )
        
        //Now we check if the user was created or not
        if(!createdUser){
            throw new apiError(500,"Something went wrong while registering a user")
        }
        
        //All goes superb! So, we send the response to the frontend.
        return res
            .status(201)
            .json(new apiResponse(201,createdUser,"User registered successfully"))
    } catch (error) {
        console.log("User Creation failed");
        //Remove the avatar and cover images
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

const loginUser = asyncHandler(
    async(req,res) => {
        //1.Get data from body
        const {username,email,password} = req.body
        //2.Run Checks if you want
        if(!email){
            throw new apiError(400,"Email is required")
        }

        const user = await User.findOne({
            $or: [{username},{email}]
        })

        if(!user){
            throw new apiError(404,"User not found")
        }

        //3.Validate Password
        const isPasswordValid = await user.isPasswordCorrect(password)
        
        if(!isPasswordValid){
            throw new apiError(401,"Invalid Credentials")
        }

        const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)

        const loggedInUser = await User.findById(user._id)
            .select("-password -refreshToken")

        const options = {
            httpOnly: true, //This makes the cookie non-modifiable from the client side, only we can modify this
            secure: process.env.NODE_ENV === "production"
        }

        //4. Send this data
        return res
            .status(200)
            .cookie("accessToken",accessToken,options)
            .cookie("refreshToken",refreshToken,options)
            .json(new apiResponse(
                200,
                { user: loggedInUser,accessToken,refreshToken },
                "User logged in successfully"
            ))

    }
)


export { 
    registerUser,
    loginUser
 }