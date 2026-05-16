import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ['image/jpeg', 'image/png'];

  if (file.fieldname === 'avatar') {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG and PNG images are allowed for avatars.'), false);
    }
  } else if (file.fieldname === 'exerciseMedia') {
    // Check if user is uploading to their own exercise
    const isUserExercise = req.body.isUserExercise === 'true';

    if (isUserExercise) {
      // For user exercises, only allow images
      if (allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Only JPEG or PNG images are allowed for user exercises.'), false);
      }
    } else {
      // For public exercises (admin/system), allow both images and videos
      const allowedVideoTypes = ['video/mp4', 'video/quicktime'];
      if ([...allowedImageTypes, ...allowedVideoTypes].includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPEG/PNG images and MP4/MOV videos are allowed for public exercises.'), false);
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
    fileSize: 500 * 1024, // 500KB for exercise poster images (~40KB typical)
  },
  exerciseVideo: {
    fileSize: 10 * 1024 * 1024, // 10MB for demo clips (~50–80KB typical)
  }
};

export const uploadAvatar = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits.avatar
}).single('avatar');

export const uploadExerciseMedia = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits.exerciseMedia
}).single('exerciseMedia');

export const uploadExerciseVideo = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, '/tmp'); // Use temp directory for video processing
    },
    filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedVideoTypes = ['video/mp4', 'video/quicktime'];
    if (allowedVideoTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MP4 and MOV videos are allowed.'), false);
    }
  },
  limits: limits.exerciseVideo
}).single('exerciseVideo');

export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File size too large. Maximum size is 2MB for avatars, 500KB for exercise images, and 10MB for exercise videos.'
      });
    }
    return res.status(400).json({ error: err.message });
  }
  next(err);
}; 