import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    deck: { type: mongoose.Schema.Types.ObjectId, ref: 'FlashcardDeck', required: true },
    front: { type: String, required: true, maxlength: 1000 },
    back: { type: String, required: true, maxlength: 2000 },
    topic: { type: String, default: 'General' },
    difficulty: { type: String, enum: ['easy', 'medium', 'difficult', null], default: null },
    reviews: [{ _id: false, rating: { type: String, enum: ['easy', 'medium', 'difficult'] }, at: { type: Date, default: Date.now } }],
  },
  { timestamps: true }
);
schema.index({ deck: 1 });
schema.index({ user: 1 });

export default mongoose.model('Flashcard', schema);
