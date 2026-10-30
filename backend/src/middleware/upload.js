import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export const userUploadDir = (userId) => path.resolve(env.uploadDir, String(userId));

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = userUploadDir(req.user._id);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  // Random server-side file name: the client file name is never used on disk.
  filename: (_req, _file, cb) => cb(null, `${crypto.randomUUID()}.pdf`),
});

export const uploadPdf = multer({
  storage,
  limits: { fileSize: env.maxFileMb * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype === 'application/pdf' && file.originalname.toLowerCase().endsWith('.pdf');
    cb(ok ? null : new ApiError(400, 'Only PDF files are allowed.'), ok);
  },
}).single('file');
