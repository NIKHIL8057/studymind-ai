import DocumentModel from '../models/Document.js';
import Flashcard from '../models/Flashcard.js';
import FlashcardDeck from '../models/FlashcardDeck.js';
import Note from '../models/Note.js';
import QuizAttempt from '../models/QuizAttempt.js';
import StudyActivity from '../models/StudyActivity.js';
import { generateRecommendations } from '../services/aiService.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok } from '../utils/http.js';

async function weakTopics(user, limit = 5) {
  const rows = await QuizAttempt.aggregate([
    { $match: { user } },
    { $unwind: '$topicStats' },
    { $group: { _id: '$topicStats.topic', correct: { $sum: '$topicStats.correct' }, total: { $sum: '$topicStats.total' } } },
    { $match: { total: { $gte: 2 } } },
    { $project: { topic: '$_id', _id: 0, total: 1, correct: 1, accuracy: { $divide: ['$correct', '$total'] } } },
    { $match: { accuracy: { $lt: 0.7 } } },
    { $sort: { accuracy: 1, total: -1 } },
    { $limit: limit },
  ]);
  return rows;
}

export const overview = asyncHandler(async (req, res) => {
  const user = req.user._id;
  const since = new Date(Date.now() - 13 * 86400000);
  since.setHours(0, 0, 0, 0);

  const [documents, notes, decks, attemptAgg, trend, activityAgg, reviewed, weak, recent] = await Promise.all([
    DocumentModel.countDocuments({ user, status: 'ready' }),
    Note.countDocuments({ user }),
    FlashcardDeck.countDocuments({ user }),
    QuizAttempt.aggregate([{ $match: { user } }, { $group: { _id: null, count: { $sum: 1 }, avg: { $avg: '$percentage' } } }]),
    QuizAttempt.find({ user }).sort({ createdAt: -1 }).limit(20).select('percentage quizTitle createdAt').lean(),
    StudyActivity.aggregate([
      { $match: { user, createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    ]),
    Flashcard.aggregate([
      { $match: { user, 'reviews.0': { $exists: true } } },
      { $group: { _id: '$topic', count: { $sum: { $size: '$reviews' } } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]),
    weakTopics(user),
    StudyActivity.find({ user }).sort({ createdAt: -1 }).limit(8).lean(),
  ]);

  const byDay = new Map(activityAgg.map((a) => [a._id, a.count]));
  const activityByDay = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(since.getTime() + i * 86400000);
    const key = d.toISOString().slice(0, 10);
    return { date: key, count: byDay.get(key) || 0 };
  });

  ok(res, {
    totals: {
      documents, notes, flashcardDecks: decks,
      quizzesCompleted: attemptAgg[0]?.count || 0,
      avgScore: attemptAgg[0] ? Math.round(attemptAgg[0].avg) : null,
    },
    scoreTrend: trend.reverse().map((t) => ({ date: t.createdAt, percentage: t.percentage, title: t.quizTitle })),
    activityByDay,
    reviewedTopics: reviewed.map((r) => ({ topic: r._id, count: r.count })),
    weakTopics: weak,
    recent,
  });
});

export const recommendations = asyncHandler(async (req, res) => {
  const [agg, weak] = await Promise.all([
    QuizAttempt.aggregate([{ $match: { user: req.user._id } }, { $group: { _id: null, count: { $sum: 1 }, avg: { $avg: '$percentage' } } }]),
    weakTopics(req.user._id),
  ]);
  if (!agg[0]) throw new ApiError(400, 'Complete at least one quiz to get recommendations.');
  if (!weak.length) return ok(res, { text: 'No weak topics detected yet. Keep practicing with more quizzes to get topic-level suggestions.', generated: false });
  const text = await generateRecommendations({ weakTopics: weak, avgScore: Math.round(agg[0].avg), attempts: agg[0].count });
  ok(res, { text, generated: true });
});
