import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
const videoSchema = new Schema(
    {
        videoFile: {
            type: String, // URL to the video file (e.g., cloud storage link)
            required: true,
        },
        thumbnail: {
            type: String, // URL to the thumbnail image (e.g., cloud storage link)
            required: true,
        },
        title: {
            type: String,
            required: true,
            
        },
        description: {
            type: String,
            required: true,
            
        },
        duration : {
            type: Number, // Duration in seconds cloudnary or other storage
            required: true,
        },
        views : {
            type: Number, // Number of views
            default: 0,
        },
        isPublished: {
            type: Boolean, // Whether the video is published or not
            default: true,
        },
        owner : {
            type: Schema.Types.ObjectId, // Reference to the User model
            ref: 'User',
            required: true,
        }

    },
    { timestamps: true }
);

videoSchema.plugin(mongooseAggregatePaginate)



export const Video = mongoose.model('Video', videoSchema);