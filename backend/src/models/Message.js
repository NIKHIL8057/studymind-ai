import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true, maxlength: 20000 },
    supported: { type: Boolean },
    sources: [{ _id: false, page: Number }],
  },
  { timestamps: true }
);
schema.index({ conversation: 1, createdAt: 1 });

export default mongoose.model('Message', schema);
