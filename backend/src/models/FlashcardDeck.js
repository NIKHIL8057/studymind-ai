import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    title: { type: String, required: true, maxlength: 120 },
    cardCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);
schema.index({ user: 1, createdAt: -1 });

export default mongoose.model('FlashcardDeck', schema);
