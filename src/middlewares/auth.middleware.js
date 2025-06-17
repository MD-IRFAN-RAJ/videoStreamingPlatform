import ApiError from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";

import jwt from "jsonwebtoken"
import {User} from "../models/user.model"

export const verifyJWT = asyncHandler(async(req,_,next) => {  // response was not used to replce it with _
   try {
     const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
 
     if (!token){
         throw new ApiError(401,"Unauthorized Request")
     }
 
     const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
 
     const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
 
     if(!user){
         // /TODO: discuss frontend
         throw new ApiError(401,"Invaid Access Token")
     }
     req.user =user;
     next()
   } catch (error) {
        throw new ApiError(401,error?.message || "invalid access token")
   }
    
})
