import assert from 'node:assert/strict';
import test from 'node:test';
import { quizItem, parseList } from '../src/validators/aiSchemas.js';
import { cosine, keywordScore } from '../src/services/retrievalService.js';

const good = { question: 'What is ATP?', options: ['a', 'b', 'c', 'd'], correctIndex: 2, explanation: 'Energy currency', topic: 'Energy' };

test('parseList keeps valid quiz items and drops malformed ones', () => {
  const raw = JSON.stringify({ questions: [good, { question: 'bad', options: ['a'] }, { ...good, correctIndex: 9 }] });
  assert.equal(parseList(raw, 'questions', quizItem).length, 1);
});

test('parseList tolerates markdown code fences', () => {
  const raw = '```json\n' + JSON.stringify({ questions: [good] }) + '\n```';
  assert.equal(parseList(raw, 'questions', quizItem)[0].topic, 'Energy');
});

test('parseList throws a friendly error on garbage or empty results', () => {
  assert.throws(() => parseList('not json', 'questions', quizItem), /unexpected format/);
  assert.throws(() => parseList('{"questions":[]}', 'questions', quizItem), /unexpected format/);
});

test('cosine similarity and keyword scoring', () => {
  assert.ok(Math.abs(cosine([1, 0], [1, 0]) - 1) < 1e-9);
  assert.equal(cosine([1, 0], [0, 1]), 0);
  assert.ok(keywordScore('what is photosynthesis', 'Photosynthesis happens in chloroplasts') > keywordScore('what is photosynthesis', 'unrelated text'));
});
