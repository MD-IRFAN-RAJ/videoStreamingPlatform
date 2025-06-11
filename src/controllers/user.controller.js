import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from '../utils/ApiError.js';
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/fileUpload.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import bcrypt from "bcryptjs"; // Ensure this is installed

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
  const hashedPassword = await bcrypt.hash(password, 10);

  // ✅ Create user in DB
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password: hashedPassword,
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

export { registerUser };
