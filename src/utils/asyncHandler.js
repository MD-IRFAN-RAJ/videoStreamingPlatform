//utils to handle async operations in Express.js

const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
            .catch((error) => (next)
                );
    }

}
export {asyncHandler}









































// const asyncHandler = (fn) => async(req,res,next) => {
//     try{

//     }catch(error){
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message || 'Internal Server Error',
//             error: error
//         })
//     }
// }   //this is a higher-order function that takes an async function as an argument

// export default asyncHandler;