import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
const password = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100)
  .regex(/[A-Za-z]/, 'Password needs at least one letter')
  .regex(/\d/, 'Password needs at least one number');

export const signupSchema = z
  .object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
    email: z.string().trim().toLowerCase().email('Enter a valid email'),
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(60).optional(),
  language: z.string().trim().min(2).max(40).optional(),
});

export const passwordChangeSchema = z.object({ currentPassword: z.string().min(1), newPassword: password });
export const deleteAccountSchema = z.object({ password: z.string().min(1, 'Password is required') });

export const renameSchema = z.object({ title: z.string().trim().min(1, 'Title is required').max(120) });

export const chatSchema = z.object({
  content: z.string().trim().min(1, 'Type a question').max(2000),
  conversationId: objectId.optional(),
});

export const notesGenerateSchema = z.object({
  documentId: objectId,
  type: z.enum(['summary', 'detailed', 'chapter', 'concepts', 'definitions', 'revision', 'beginner']),
  language: z.string().trim().min(2).max(40).default('English'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
  format: z.enum(['bullets', 'paragraphs', 'mixed']).default('mixed'),
});

export const noteUpdateSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  content: z.string().max(100000).optional(),
});

const source = { documentId: objectId.optional(), noteId: objectId.optional() };
const needSource = (d) => d.documentId || d.noteId;

export const quizGenerateSchema = z
  .object({ ...source, count: z.coerce.number().int().min(3).max(20).default(8), difficulty: z.enum(['easy', 'medium', 'hard']).default('medium') })
  .refine(needSource, { message: 'Choose a document or a note', path: ['documentId'] });

export const attemptSchema = z.object({
  answers: z.array(z.number().int().min(0).max(3).nullable()).min(1).max(50),
});

export const flashGenerateSchema = z
  .object({ ...source, count: z.coerce.number().int().min(5).max(40).default(15) })
  .refine(needSource, { message: 'Choose a document or a note', path: ['documentId'] });

export const reviewSchema = z.object({ rating: z.enum(['easy', 'medium', 'difficult']) });
