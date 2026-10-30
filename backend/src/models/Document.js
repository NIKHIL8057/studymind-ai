import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    originalName: { type: String, required: true, maxlength: 255 },
    filePath: { type: String, required: true, select: false },
    size: { type: Number, required: true },
    pageCount: { type: Number, default: 0 },
    chunkCount: { type: Number, default: 0 },
    embedded: { type: Boolean, default: false },
    status: { type: String, enum: ['processing', 'ready', 'failed'], default: 'processing' },
    error: { type: String, default: '' },
  },
  { timestamps: true }
);
schema.index({ user: 1, createdAt: -1 });
schema.index({ user: 1, title: 1 });

export default mongoose.model('Document', schema);
