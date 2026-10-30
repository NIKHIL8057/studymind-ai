import mongoose from 'mongoose';

// Text chunks (with page numbers) used for retrieval. Embeddings are stored separately from document metadata.
const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  page: { type: Number, required: true },
  index: { type: Number, required: true },
  text: { type: String, required: true },
  embedding: { type: [Number], select: false, default: undefined },
});
schema.index({ document: 1, page: 1, index: 1 });
schema.index({ user: 1 });

export default mongoose.model('Chunk', schema);
