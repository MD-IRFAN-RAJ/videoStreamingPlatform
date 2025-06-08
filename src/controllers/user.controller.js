import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from '../utils/ApiError.js';
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/fileUpload"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req,res) => {
    //get user details from frontend
    const {fullName,email,username,password }=req.body
    console.log("email: ", email);

    //validation -not empty

     /*   if (fullName === ""){
        throw new ApiError(400, "Full name is required ") 
    }
or below code */
    if([fullName,email,username,password].some((field)=>
    field?.trim() =="")
    ){
        throw new ApiError(400, "All fields are required")
    }

    //check if user already exists: username and email

    const existedUser = User.findOne({
        $or : [{username},{ email },]
    })

    if(existedUser){
        throw new ApiError(409,"User with email or username already exist ")
    }

    //check for images, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    //check avatar )As it is compulsory
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    //upload them to cloudnary,avatar

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar is required   \ avatar not uploaded to cloudnary")
    }


    //create user object - create entry in DB

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage : coverImage?.url || "" ,
        email,
        password,
        username: username.toLowerCase()
    })

    //remove password and refresh token field from response

    // check user entered or not ....find by id

    const createdUser = await User.findById(user._id).select(
        //kya kya nahi chahaiye
        "-password -refreshToken"
    );

    //check for user creation 
    if(!createdUser){
        throw new ApiError(500,"Spmething went wrong while regstering user")
    }


    
    
    //return response 
    return res.status(201).json(
        new ApiResponse(200,createdUser, "User registered successfully ")
    )

    



    
    
} )


export {registerUser,}
