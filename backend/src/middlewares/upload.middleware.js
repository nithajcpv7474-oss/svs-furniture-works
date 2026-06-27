import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import logger from '../utils/logger.js';

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config: use memory storage so we can optimize images before writing to disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Accept only images and PDFs
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and PDFs are allowed.'), false);
  }
};

export const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

// Middleware to process and optimize images
export const optimizeImages = async (req, res, next) => {
  if (!req.files && !req.file) return next();

  const filesToProcess = req.files ? 
    (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) 
    : [req.file];

  try {
    await Promise.all(
      filesToProcess.map(async (file) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        
        if (file.mimetype.startsWith('image/')) {
          // Convert to WebP and compress
          const filename = `${file.fieldname}-${uniqueSuffix}.webp`;
          const filepath = path.join(uploadDir, filename);
          
          await sharp(file.buffer)
            .resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 80 })
            .toFile(filepath);
            
          file.filename = filename;
          file.path = filepath;
          file.mimetype = 'image/webp';
        } else {
          // It's a PDF, just save it directly
          const filename = `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`;
          const filepath = path.join(uploadDir, filename);
          
          await fs.promises.writeFile(filepath, file.buffer);
          
          file.filename = filename;
          file.path = filepath;
        }
      })
    );
    next();
  } catch (error) {
    logger.error(`Image optimization failed: ${error.message}`);
    next(new Error('Failed to process uploaded file'));
  }
};
