import Conversation from '../models/Conversation.js';
import DocumentModel from '../models/Document.js';
import Message from '../models/Message.js';
import { answerQuestion } from '../services/aiService.js';
import { logActivity } from '../services/activityService.js';
import { retrieve } from '../services/retrievalService.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, findOwned, ok } from '../utils/http.js';

export const listConversations = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.document) filter.document = req.query.document;
  ok(res, await Conversation.find(filter).sort({ updatedAt: -1 }).limit(50));
});

export const getMessages = asyncHandler(async (req, res) => {
  const convo = await findOwned(Conversation, req.params.id, req.user._id);
  ok(res, await Message.find({ conversation: convo._id }).sort({ createdAt: 1 }).limit(200));
});

export const deleteConversation = asyncHandler(async (req, res) => {
  const convo = await findOwned(Conversation, req.params.id, req.user._id);
  await Message.deleteMany({ conversation: convo._id });
  await convo.deleteOne();
  ok(res, { deleted: true });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const doc = await findOwned(DocumentModel, req.params.docId, req.user._id);
  if (doc.status !== 'ready') throw new ApiError(409, 'This document is still processing or failed to process.');
  const { content, conversationId } = req.body;

  let convo;
  if (conversationId) {
    convo = await findOwned(Conversation, conversationId, req.user._id);
    if (String(convo.document) !== String(doc._id)) throw new ApiError(400, 'Conversation belongs to a different document.');
  }

  // Retrieve + answer first, so a failed AI call leaves no orphan messages (the client can simply retry).
  const history = convo ? (await Message.find({ conversation: convo._id }).sort({ createdAt: -1 }).limit(6)).reverse() : [];
  const chunks = await retrieve(req.user._id, doc._id, content);
  const result = chunks.length
    ? await answerQuestion({ question: content, chunks, history, language: req.user.language })
    : { answer: 'The document does not provide enough information to answer that question.', supported: false, pages: [] };

  if (!convo) convo = await Conversation.create({ user: req.user._id, document: doc._id, title: content.slice(0, 80) });
  const userMessage = await Message.create({ conversation: convo._id, user: req.user._id, role: 'user', content });
  const assistantMessage = await Message.create({
    conversation: convo._id,
    user: req.user._id,
    role: 'assistant',
    content: result.answer,
    supported: result.supported,
    sources: result.pages.map((page) => ({ page })),
  });
  convo.updatedAt = new Date();
  await convo.save();
  logActivity(req.user._id, 'chat', `Asked about ${doc.title}`, doc._id);
  ok(res, { conversation: convo, userMessage, assistantMessage });
});
