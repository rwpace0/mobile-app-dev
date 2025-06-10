import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif'];
  
  if (file.fieldname === 'avatar') {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and GIF images are allowed for avatars.'), false);
    }
  } else if (file.fieldname === 'exerciseMedia') {
    // Check if user is uploading to their own exercise
    const isUserExercise = req.body.isUserExercise === 'true';
    
    if (isUserExercise) {
      // For user exercises, only allow images
      if (allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only images (JPEG, PNG, GIF) are allowed for user exercises.'), false);
      }
    } else {
      // For public exercises (admin/system), allow both images and videos
      const allowedVideoTypes = ['video/mp4', 'video/quicktime'];
      if ([...allowedImageTypes, ...allowedVideoTypes].includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF) and videos (MP4, MOV) are allowed for public exercises.'), false);
      }
    }
  } else {
    cb(new Error('Invalid field name'), false);
  }
};

const limits = {
  avatar: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  exerciseMedia: {
    fileSize: 5 * 1024 * 1024, // 5MB for images
  }
};

export const uploadAvatar = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits.avatar
}).single('avatar');

export const uploadExerciseMedia = multer({
  storage: storage, // Always use memory storage since we only accept images now
  fileFilter: fileFilter,
  limits: limits.exerciseMedia
}).single('exerciseMedia');

export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File size too large. Maximum size is 2MB for avatars and 5MB for exercise images.'
      });
    }
    return res.status(400).json({ error: err.message });
  }
  next(err);
}; 