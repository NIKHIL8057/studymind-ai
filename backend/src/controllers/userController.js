import fs from 'node:fs/promises';
import bcrypt from 'bcrypt';
import Chunk from '../models/Chunk.js';
import Conversation from '../models/Conversation.js';
import DocumentModel from '../models/Document.js';
import Flashcard from '../models/Flashcard.js';
import FlashcardDeck from '../models/FlashcardDeck.js';
import Message from '../models/Message.js';
import Note from '../models/Note.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import StudyActivity from '../models/StudyActivity.js';
import User from '../models/User.js';
import { userUploadDir } from '../middleware/upload.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok } from '../utils/http.js';

export const updateProfile = asyncHandler(async (req, res) => {
  Object.assign(req.user, req.body);
  await req.user.save();
  ok(res, req.user);
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) throw new ApiError(400, 'Current password is incorrect.');
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();
  ok(res, { changed: true });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (!(await bcrypt.compare(req.body.password, user.passwordHash))) throw new ApiError(400, 'Password is incorrect.');
  const filter = { user: user._id };
  await Promise.all(
    [Chunk, Conversation, Message, DocumentModel, Note, Quiz, QuizAttempt, FlashcardDeck, Flashcard, StudyActivity].map((M) =>
      M.deleteMany(filter)
    )
  );
  await fs.rm(userUploadDir(user._id), { recursive: true, force: true });
  await user.deleteOne();
  res.clearCookie('token');
  ok(res, { deleted: true });
});
