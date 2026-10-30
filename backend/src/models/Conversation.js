import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
    title: { type: String, default: 'New conversation', maxlength: 120 },
  },
  { timestamps: true }
);
schema.index({ user: 1, document: 1, updatedAt: -1 });

export default mongoose.model('Conversation', schema);
