import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import { generateQuiz } from '../services/aiService.js';
import { logActivity } from '../services/activityService.js';
import { resolveSource } from '../services/sourceService.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, findOwned, ok, parsePaging } from '../utils/http.js';
import { scoreAttempt } from '../utils/scoring.js';

// Never send correct answers or explanations to the client before submission.
const forTaking = (quiz) => ({
  _id: quiz._id,
  title: quiz.title,
  difficulty: quiz.difficulty,
  createdAt: quiz.createdAt,
  questions: quiz.questions.map((q) => ({ _id: q._id, question: q.question, options: q.options, topic: q.topic })),
});

export const generate = asyncHandler(async (req, res) => {
  const { documentId, noteId, count, difficulty } = req.body;
  const src = await resolveSource(req.user._id, { documentId, noteId });
  const questions = await generateQuiz({ text: src.text, count, difficulty });
  const quiz = await Quiz.create({
    user: req.user._id,
    document: src.document,
    title: `Quiz: ${src.title}`.slice(0, 120),
    difficulty,
    questions,
  });
  logActivity(req.user._id, 'quiz_generated', `Generated ${quiz.title}`, quiz._id);
  ok(res, forTaking(quiz), null, 201);
});

export const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePaging(req.query);
  const filter = { user: req.user._id };
  const [quizzes, total] = await Promise.all([
    Quiz.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Quiz.countDocuments(filter),
  ]);
  const stats = await QuizAttempt.aggregate([
    { $match: { user: req.user._id, quiz: { $in: quizzes.map((q) => q._id) } } },
    { $group: { _id: '$quiz', attempts: { $sum: 1 }, best: { $max: '$percentage' }, last: { $last: '$percentage' } } },
  ]);
  const byQuiz = new Map(stats.map((s) => [String(s._id), s]));
  const items = quizzes.map((q) => ({
    _id: q._id, title: q.title, difficulty: q.difficulty, createdAt: q.createdAt, questionCount: q.questions.length,
    attempts: byQuiz.get(String(q._id))?.attempts || 0, best: byQuiz.get(String(q._id))?.best ?? null,
  }));
  ok(res, items, { page, limit, total, pages: Math.ceil(total / limit) });
});

export const getOne = asyncHandler(async (req, res) => ok(res, forTaking(await findOwned(Quiz, req.params.id, req.user._id))));

export const submit = asyncHandler(async (req, res) => {
  const quiz = await findOwned(Quiz, req.params.id, req.user._id);
  const { answers } = req.body;
  if (answers.length !== quiz.questions.length) throw new ApiError(400, 'Answer every question slot (use null to skip).');
  const result = scoreAttempt(quiz.questions, answers);
  const attempt = await QuizAttempt.create({
    user: req.user._id, quiz: quiz._id, quizTitle: quiz.title, answers, ...result,
  });
  logActivity(req.user._id, 'quiz_attempt', `Scored ${result.percentage}% on ${quiz.title}`, quiz._id);
  ok(res, attempt, null, 201);
});

export const attempts = asyncHandler(async (req, res) => {
  const quiz = await findOwned(Quiz, req.params.id, req.user._id);
  ok(res, await QuizAttempt.find({ quiz: quiz._id, user: req.user._id }).select('-review -answers').sort({ createdAt: -1 }).limit(30));
});

export const getAttempt = asyncHandler(async (req, res) => ok(res, await findOwned(QuizAttempt, req.params.attemptId, req.user._id)));

export const remove = asyncHandler(async (req, res) => {
  const quiz = await findOwned(Quiz, req.params.id, req.user._id);
  await QuizAttempt.deleteMany({ quiz: quiz._id, user: req.user._id });
  await quiz.deleteOne();
  ok(res, { deleted: true });
});
