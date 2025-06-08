import express from "express";
import dotenv from 'dotenv';
import connectDB from './db/index.js';
import app from "./app.js"


dotenv.config({ 
  path: './env' 
});

// connect to the database
connectDB()
.then(()=>{
  app.listen(process.env.PORT || 8000,() =>{
    console.log(`Server is running on port ${process.env.PORT || 8000}`);
  })
})
.catch((err)=>{
  console.error('Database connection failed due to :', err);
  process.exit(1); // Exit the process with failure
})