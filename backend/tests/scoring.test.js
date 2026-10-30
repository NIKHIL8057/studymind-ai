import assert from 'node:assert/strict';
import test from 'node:test';
import { scoreAttempt } from '../src/utils/scoring.js';

const questions = [
  { question: 'Q1?????', options: ['a', 'b', 'c', 'd'], correctIndex: 1, explanation: 'x', topic: 'Cells' },
  { question: 'Q2?????', options: ['a', 'b', 'c', 'd'], correctIndex: 3, explanation: 'y', topic: 'Cells' },
  { question: 'Q3?????', options: ['a', 'b', 'c', 'd'], correctIndex: 0, explanation: 'z', topic: 'DNA' },
];

test('scores correct, wrong and skipped answers on the server', () => {
  const r = scoreAttempt(questions, [1, 0, null]);
  assert.equal(r.score, 1);
  assert.equal(r.total, 3);
  assert.equal(r.percentage, 33);
  assert.equal(r.review[2].selectedIndex, null);
  assert.equal(r.review[2].isCorrect, false);
});

test('aggregates per-topic stats', () => {
  const r = scoreAttempt(questions, [1, 3, 1]);
  assert.deepEqual(r.topicStats.find((t) => t.topic === 'Cells'), { topic: 'Cells', correct: 2, total: 2 });
  assert.deepEqual(r.topicStats.find((t) => t.topic === 'DNA'), { topic: 'DNA', correct: 0, total: 1 });
});

test('perfect and zero scores', () => {
  assert.equal(scoreAttempt(questions, [1, 3, 0]).percentage, 100);
  assert.equal(scoreAttempt(questions, [0, 0, 1]).percentage, 0);
});
