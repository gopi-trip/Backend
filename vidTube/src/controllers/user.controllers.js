import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from '../utils/apiError.js'
import { User } from '../models/user.models.js'
import { uploadOnCloudinary,deleteFromCloudinary } from '../utils/cloudinary.js'
import { apiResponse } from "../utils/apiResponse.js";
import jwt from 'jsonwebtoken'
import { verifyJWT } from "../middlewares/auth.middlewares.js";
//Give user the refresh token
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

    // Finding user using the username or email to check if he/she exists
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
        //We're intentionally deselecting certain fields such as the password and the refresh token so we don't fetch them
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

//Route for .....?
const loginUser = asyncHandler(
    async(req,res) => {
        //1.Get data from body
        const {username,email,password} = req.body
        //2.Run Checks if you want
        if(!email){
            throw new apiError(400,"Email is required")
        }

        //Find the user either by username or email
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

        //Generate access and refresh tokens
        const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)
        
        //Grab the logged in user
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

const logoutUser = asyncHandler(
    async(req,res) =>{
        await User.findByIdAndUpdate(
            //Need to comeback here after middleware
            req.user._id,
            {
                $set: {
                    refreshToken: undefined
                }
            },
            {
                new:true
            }
        )
        const options = {
            httpOnly:true,
            secure:process.env.NODE_ENV === "production"
        }

        return res.status(200)
            .clearCookie("acccessToken",options)
            .clearCookie("refreshToken",options)
            .json( new apiResponse(200,{},"User logged out successfully"))

    }
)

const refreshAccessToken = asyncHandler(
    async(req,res) => {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

        if(!incomingRefreshToken){
            throw new Error(401,"Refresh token is required")
        }

        try {
           const decodedToken =  jwt.verify(
                incomingRefreshToken,
                process.env.REFRESH_TOKEN_SECRET
            )
            const user = await User.findById(decodedToken?._id)

            if(!user){
                throw new apiError(401,"Invalid refresh token")
            }

            if(user?.refreshToken !== incomingRefreshToken){
                throw new apiError(401,"Refresh Token is expired")
            }

            const options = {
                httpOnly:true,
                secure: process.env.NODE_ENV === "production",
            }
          const {accessToken,refreshToken: newRefreshToken} = await generateAccessAndRefreshTokens(user._id)

          return res
                .status(200)
                .cookie("accessToken",accessToken,options)
                .cookie("refreshToken",newRefreshTokenefreshToken,options)
                .json(new apiResponse(
                    200,
                    {accessToken,
                        refreshToken:newRefreshToken
                    },
                    "Access token refreshed successfully"
                ))
        }catch (error) {
            throw new apiError(500,"Something went wrong while generating access token")
        }
    }
)


const changeCurrentPassword = asyncHandler(async (req,res) => {
    const {oldPassword,newPassword} = req.body

    const user = await User.findById(req.user?._id)

    const passValid = await user.isPasswordCorrect(oldPassword);

    if(!passValid){
        throw new apiError(401,"You've entered the wrong password!")
    }

    user.password = newPassword

    await user.save({validateBeforeSave: false})

    return res.status(200).json(new apiResponse(200,{},"Password changed successfully"))

})

const getCurrentUser = asyncHandler(async (req,res) => {
    return res.status(200).json(new apiResponse(200,req.user,"current user details"))
})

const updateAccountDetails = asyncHandler(async (req,res) => {
    const {fullname,email} = req.body

    //Validation
    if(!fullname || !email){
        throw new apiError(400,"Fullname and email are required")
    }


    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email
            }
        },
        {new: true}
    ).select(" -password -refreshToken")

    return res.status(200)
            .json(new apiResponse(200,user,"Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async (req,res) => {
    //Access the avatar local file path
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new apiError(401,"Avatar file path is required!")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new apiError(401,"Something went wrong while uploading the avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new:true}
    ).select("-password -refreshToken")

    res.status(200).json(new apiResponse(200,user,"Avatar has been updated successfully"))

})

const updateUserCoverImage = asyncHandler(async (req,res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new apiError(401,"Cover Image file path is required!")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    const user  = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        }
    ).select("-password -refreshToken")

    res.status(200).json(new apiResponse(200,user,"Cover Image has been updated successfully"))

})

const getUserChannelProfile = asyncHandler(async(req,res) => {
    const {username} = req.params
    
    if(!username?.trim()){
        throw new apiError(401,"Username does not exists!");
    }

    const channel = await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        //How many have subscribed to you
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        //How many channels have I subscribed to
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField: "subcriber",
                as: "subscribedTo"
            }
        },
        //Now adding these fields to the user
        {
            $addFields:{
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id,"$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }, 
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed: 1,
                avatar: 1,
                coverImage:1,
                email:1,
            }
        }
    ])

    if(!channel?.length){
        throw new apiError(401,"Channel does not exist!")
    }


    console.log(channel);

    return res
        .status(200)
        .json(new apiResponse(200,channel[0],"User channel fetched successfully!"))
})

const getWatchHistory = asyncHandler(async(req,res) => {
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner"
                        }
                    },
                    {
                        $project: {
                            username:1,
                            fullname:1,
                            avatar:1,
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "owner"
                            }
                        }
                    }
                ]
            }
        },
        {

        }
    ])

    if(!user?.trim()){
        throw new apiError(401,"User not found!")
    }

    return res
        .status(200)
        .json(new apiResponse(200,user[0].watchHistory, "Watch History fetched successfully!"))
})

export { 
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
 }