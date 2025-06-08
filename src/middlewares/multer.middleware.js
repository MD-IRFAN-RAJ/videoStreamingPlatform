import multer from 'multer';

const storage = multer.diskStorage({
    destination: function (req, file, cb){
        cb(null, './public/temp'); //cb is a callback function that tells multer where to store the file
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname + '-' + uniqueSuffix);
    }

    
});
export const upload = multer({ 
    storage,
     
});
