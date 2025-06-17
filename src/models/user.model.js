import mongoose , { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';


const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true  //optimizes the search for this field
        },
        email:{
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true  //optimizes the search for this field

        },
        avatar : {
            type: String, // URL to the avatar image (cloudinary or gravatar)
            required : true,
        },
        coverImage: {
            type: String, // URL to the cover image (cloudinary or gravatar)
            
        },
        watchHistory : [{
            type : Schema.Types.ObjectId,
            ref : 'Video' // Reference to the Video model
        }],
        password: {
            type: String,
            required: [true, 'Password is required'],
            
        },
        refreshToken: {
            type: String,
        },


    },
    {
        timestamps: true, // Automatically manage createdAt and updatedAt fields
        
    }
)

userSchema.pre('save', async function(next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }
    next();
})

userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password);
}




//access token expires in short time
userSchema.methods.generateAccessToken = function() {
    return jwt.sign({
        _id: this._id,
        email: this.email,
        username: this.username,
        fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET, 
    {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY// Access token expiration time
    },
)
}

//refresh token expires after a longer duration 
userSchema.methods.generateRefreshToken = function() {
    return jwt.sign({
        _id: this._id,
        
    },
    process.env.REFRESH_TOKEN_SECRET, 
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY// Access token expiration time
    }
)
}


export const User = mongoose.model('User', userSchema);