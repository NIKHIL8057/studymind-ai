import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    content: { type: String, required: true, maxlength: 100000 },
    type: { type: String, required: true },
    options: { type: Object, default: {} },
  },
  { timestamps: true }
);
schema.index({ user: 1, updatedAt: -1 });

export default mongoose.model('Note', schema);
