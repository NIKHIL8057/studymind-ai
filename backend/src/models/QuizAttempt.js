import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    quizTitle: { type: String, maxlength: 120 },
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    percentage: { type: Number, required: true },
    answers: [Number],
    review: { type: [Object], default: [] },
    topicStats: [{ _id: false, topic: String, correct: Number, total: Number }],
  },
  { timestamps: true }
);
schema.index({ user: 1, createdAt: -1 });
schema.index({ quiz: 1, createdAt: -1 });

export default mongoose.model('QuizAttempt', schema);
