import mongoose from 'mongoose';

const question = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: { type: [String], validate: (v) => v.length === 4 },
    correctIndex: { type: Number, min: 0, max: 3, required: true },
    explanation: { type: String, required: true },
    topic: { type: String, default: 'General' },
  },
  { _id: true }
);

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    title: { type: String, required: true, maxlength: 120 },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    questions: { type: [question], validate: (v) => v.length > 0 },
  },
  { timestamps: true }
);
schema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Quiz', schema);
