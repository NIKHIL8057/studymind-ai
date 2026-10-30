import Flashcard from '../models/Flashcard.js';
import FlashcardDeck from '../models/FlashcardDeck.js';
import { generateFlashcards } from '../services/aiService.js';
import { logActivity } from '../services/activityService.js';
import { resolveSource } from '../services/sourceService.js';
import { asyncHandler, findOwned, ok, parsePaging } from '../utils/http.js';

export const generate = asyncHandler(async (req, res) => {
  const { documentId, noteId, count } = req.body;
  const src = await resolveSource(req.user._id, { documentId, noteId });
  const cards = await generateFlashcards({ text: src.text, count });
  const deck = await FlashcardDeck.create({
    user: req.user._id, document: src.document, title: `Flashcards: ${src.title}`.slice(0, 120), cardCount: cards.length,
  });
  await Flashcard.insertMany(cards.map((c) => ({ ...c, user: req.user._id, deck: deck._id })));
  logActivity(req.user._id, 'flashcards_generated', `Generated ${deck.title}`, deck._id);
  ok(res, deck, null, 201);
});

export const listDecks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePaging(req.query);
  const filter = { user: req.user._id };
  const [items, total] = await Promise.all([
    FlashcardDeck.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    FlashcardDeck.countDocuments(filter),
  ]);
  ok(res, items, { page, limit, total, pages: Math.ceil(total / limit) });
});

export const getDeck = asyncHandler(async (req, res) => {
  const deck = await findOwned(FlashcardDeck, req.params.id, req.user._id);
  const cards = await Flashcard.find({ deck: deck._id, user: req.user._id }).sort({ createdAt: 1 });
  ok(res, { deck, cards });
});

export const review = asyncHandler(async (req, res) => {
  const card = await findOwned(Flashcard, req.params.cardId, req.user._id);
  card.difficulty = req.body.rating;
  card.reviews.push({ rating: req.body.rating });
  await card.save();
  logActivity(req.user._id, 'flashcard_review', 'Reviewed a flashcard', card.deck);
  ok(res, card);
});

export const removeDeck = asyncHandler(async (req, res) => {
  const deck = await findOwned(FlashcardDeck, req.params.id, req.user._id);
  await Flashcard.deleteMany({ deck: deck._id, user: req.user._id });
  await deck.deleteOne();
  ok(res, { deleted: true });
});
