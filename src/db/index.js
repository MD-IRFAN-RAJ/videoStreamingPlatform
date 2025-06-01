import mongoose from 'mongoose'
import { DB_NAME } from '../constants.js'

const connectDB = async () => {
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

        console.log(`MongoDB connected successfully ! DB HOST: ${connectionInstance.connection.host}`);

        // Handle server errors
        mongoose.connection.on('error', (error) => {
            console.error('MongoDB connection error:', error)
            process.exit(1) // Exit the process with failure
        })
    }catch(error){
        console.error('Error connecting to MongoDB:', error)
        process.exit(1) // Exit the process with failure
    }
}

// Export the connectDB function
export default connectDB;



//method 2

/*import mongoose from 'mongoose'
import {DB_NAME} from "./constants.js"

import express from 'express'

const app=express()

;(async() => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

        app.on('error', (error) => {
            console.error('Server error:', error)
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`)
        })
    }catch(error){
        console.error('Error connecting to MongoDB:', error)
        throw error
    }
})() //IIFE immediately invoked function expression
*/

