import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['upload', 'chat', 'note', 'quiz_generated', 'quiz_attempt', 'flashcards_generated', 'flashcard_review'],
      required: true,
    },
    label: { type: String, maxlength: 200 },
    ref: { type: mongoose.Schema.Types.ObjectId },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);
schema.index({ user: 1, createdAt: -1 });

export default mongoose.model('StudyActivity', schema);
