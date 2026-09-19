import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env.js';
import { badRequest } from '../utils/AppError.js';

// Netlify/Lambda filesystem is read-only except /tmp
const uploadRoot = env.isNetlify
  ? path.join('/tmp', env.uploadDir)
  : path.resolve(process.cwd(), env.uploadDir);

try {
  fs.mkdirSync(uploadRoot, { recursive: true });
} catch {
  // Ignore on read-only FS; uploads will fail at request time if unwritable
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    try {
      fs.mkdirSync(uploadRoot, { recursive: true });
      cb(null, uploadRoot);
    } catch (err) {
      cb(err);
    }
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${unique}${ext}`);
  },
});

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export const uploadProductImages = multer({
  storage,
  limits: { fileSize: env.maxUploadSizeMb * 1024 * 1024, files: 8 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) {
      return cb(badRequest('Only JPEG, PNG, WebP, and GIF images are allowed'));
    }
    return cb(null, true);
  },
}).array('images', 8);
