import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    language: { type: String, default: 'English', maxlength: 40 },
    aiUsage: { date: String, count: { type: Number, default: 0 } },
  },
  { timestamps: true }
);

schema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.aiUsage;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('User', schema);
