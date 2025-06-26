import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from '../utils/ApiError.js';
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/fileUpload.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"


//function to generate tokens
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });   //don't validate to avoid passing compulsory fields again

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating refresh and access token");
  }
};

//register user logic
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body;
  console.log("Email received from frontend:", email);

  // ✅ Validate required fields
  if ([fullName, email, username, password].some(field =>
    typeof field !== "string" || field.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // ✅ Check for existing user
  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  // ✅ Extract file paths safely
  const avatarLocalPath = req.files?.avatar?.[0]?.path;

  let coverImageLocalPath;
  if (Array.isArray(req.files?.coverImage) && req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  // ✅ Avatar is mandatory
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required");
  }

  // ✅ Upload avatar and optional cover image to Cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar || !avatar.url) {
    throw new ApiError(400, "Failed to upload avatar to Cloudinary");
  }

  let coverImage = {};
  if (coverImageLocalPath) {
    coverImage = await uploadOnCloudinary(coverImageLocalPath);
  }

  // ✅ Hash password
  // const hashedPassword = await bcrypt.hash(password, 10);

  // ✅ Create user in DB
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,// password is already hashed in user.model
    username: username.toLowerCase()
  });

  // ✅ Retrieve created user without sensitive fields
  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  // ✅ Send response
  return res.status(201).json(
    new ApiResponse(201, createdUser, "User registered successfully")
  );
});

//login user logic
const loginUser = asyncHandler(async (req, res) => {
  // req body se data lao
  const { email, username, password } = req.body;

  // username or email
  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  }

  console.log("Login input received:", { email, username });

  // find the user in DB
  const user = await User.findOne({
    $or: [{ username }, { email }] // used to select from multiple keys ...either search email or username
  });

  console.log("User found in DB:", user);

  // if user not found
  if (!user) {
    throw new ApiError(404, "User does not exist!");
  }

  // check password
  const isPasswordValid = await user.isPasswordCorrect(password);
  console.log("Is password valid?:", isPasswordValid);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Password");
  }

  // generate access and refresh token and send to user
  // { it's better to create method for later use }
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

  console.log("Tokens generated:", { accessToken, refreshToken });

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

  // send in cookies
  // { step1 } - design options which are objects
  const options = {
    httpOnly: true,
    secure: false, // set true in production
    sameSite: "Lax"
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken
        },
        "User logged in Successfully"
      )
    );
});

//logout user
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id, {
      $unset: {
        refreshToken: 1//remove the field from doc
      }
    }, {
      new: true
    }
  );

  const options = {
    httpOnly: true,
    secure: false, // set true in production
    sameSite: "Lax"
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out"));
});



//refresh access token
const refreshAccessToken = asyncHandler(async(req,res)=>{ 
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken){
    throw new ApiError(401,"unauthorized request")
  }
 
  //check token with jwt token 
  try {
    const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
  
    const user = await User.findById(decodeToken?._id)
    if(!user){
      throw new ApiError(401,"invalid refresh token ")
    }
  
    if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401,"refresh token has expired ")
    }
  
    const options= {
      httpOnly : true,
      secure : true
    }
  
    const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    return res.status(200).cookie("accessToken",accessToken, options).cookie("refreshToken", newRefreshToken, options).json(new ApiResponse(
      200,
      {accessToken, refreshToken: newRefreshToken},
      "Access token refreshed successfully"
    ))
  } catch (error) {
      throw new ApiError(401,error?.message || "Invaid refresh token" )
  }

}
)


const changeCurrentPassword = asyncHandler(async(req,res) =>{
  const {oldPassword,newPassword} = req.body
  const user = await User.findById(req.user?._id)

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if(!isPasswordCorrect){
    throw new ApiError(400,"Invalid old password")
  }

  user.password = newPassword

  await user.save({validateBeforeSave : false})

  return res
  .status(200)
  .json( new ApiResponse(200,{},"Password changed successfully"))

})


const getCurrentUser = asyncHandler(async (req,res) => {
  return res
  .status(200)
  .json(new ApiResponse(200,req.user, "Current user fetched successfully"))
})


const updateAccountDetails = asyncHandler(async(req,res)=>{

  const {fullName,email} = req.body
  if(!fullName || !email ){
    throw new ApiError(400,"All fields are required")
  }

 const user = await User.findByIdAndUpdate(
  req.user?._id,
  {
    $set:{
      fullName,
      email:email
    }
  },
  {new:true}
).select("-password")
})

const updateUserAvatar =asyncHandler(async(req,res)=>{
  const avatarLocalPath = req.file?.path
  if(!avatarLocalPath){
    throw new ApiError(400," Avatar file is missing ")

  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)

  if(!avatar.url){
    throw new ApiError(400,"Error while uploading on avatar")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    //what to update
    {
      //$set mongo method 
      $set:{
        avatar : avatar.url
      }

    },
    {new:true}
  ).select("-password")  //what not ro change

  return res
  .status(200)
  .json(
    new ApiResponse(200,user,"avatar image updated successfully")
  )



})


const updateUserCoverImage =asyncHandler(async(req,res)=>{
  const coverImageLocalPath = req.file?.path
  if(!coverImageLocalPath){
    throw new ApiError(400," cover img file is missing ")

  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!coverImage.url){
    throw new ApiError(400,"Error while uploading on cover image")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    //what to update
    {
      //$set mongo method 
      $set:{
        coverImage : coverImage.url
      }

    },
    {new:true}
  ).select("-password")  //what not ro change

  return res
  .status(200)
  .json(
    new ApiResponse(200,user,"cover image updated successfully")
  )
})


const getUserChannelProfile = asyncHandler(async(req,res) => {
  const {username} = req.params

  if(!username?.trim()){
    throw new ApiError(400,"username is missing")
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()

      }
    },
    {
        $lookup:{
          from: "Subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers"
        }
    },
    {
      $lookup:{
          from: "Subscriptions",
          localField: "_id",
          foreignField: "subscriber",
          as: "subscribedTo"
      }
    },
    {
      $addFields:{
        subscribersCount : {
          $size: "$subscribers"
        },
        channelsSubscribedToCount:{
          $size:"$subscribedTo"
        },
        isSubscribed:{
          $cond:{
            if:{$in:[req.user?._id,"$subscribers.subscriber"]},
            then:true,
            else: false
          }
        } 
      }
    },
    {
      //give selected thing to user
      $project:{
        fullName:1,
        username:1,
        subscribersCount:1,
        channelsSubscribedToCount:1,
        isSubscribed:1,
        avatar:1,
        coverImage:1,
        email:1,

      }
    }
    
  ])

  if(!channel?.length){
    throw new ApiError(404,"channel does not exists")
  }

  return res
  .status(200)
  .json(
    new ApiResponse(200,channel[0],"User channel fetched successfully")

  )

})


const getWatchHistory= asyncHandler(async(req,res)=>{
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)

      }
    },
    //another pipeline
    {
      $lookup:{
        from:"videos",
        localField:"watchHistory",
        foreignField:"_id",
        as:"watchHistory",
        pipeline:[
          {
            $lookup:{
              from:"users",
              localField:"owner",
              foreignField:"_id",
              as:"owner",
              pipeline:[
                {
                  $project:{
                    fullname:1,
                    username:1,
                    avatar:1,

                  }
                }
              ]
            }
          },
          {
            $addFields:{
              owner:{
                $first:"$owner"
              }
            }
          }
        ]
      }
    }
  ])

  return res
  .status(200)
  .json(
    new ApiResponse(200,user[0].watchHistory,"watch history fetched successfully")
  )
})




export { 
   registerUser,
   loginUser, 
   logoutUser,
   refreshAccessToken,
   getCurrentUser,
   changeCurrentPassword,
   updateAccountDetails,
   updateUserAvatar,
   updateUserCoverImage,
   getWatchHistory,
   getUserChannelProfile
  };
