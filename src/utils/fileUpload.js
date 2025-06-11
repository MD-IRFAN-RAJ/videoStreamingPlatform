import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';   //file system module to handle file operations


// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Click 'View API Keys' above to copy your cloud name
    api_key: process.env.CLOUDINARY_API_KEY, // Click 'View API Keys' above to copy your API key
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            throw new Error('No file path provided');
            return null;
        }
        //upload the file to cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto', // Automatically detect the resource type (image, video, etc.)
        });

        // file has been uploaded successfully
        // console.log('File uploaded successfully:', response.url);
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath); // Delete the file from local storage if upload fails
        console.error('Error uploading file to Cloudinary:', error.message);
        return null;
    }

}



export {uploadOnCloudinary};
