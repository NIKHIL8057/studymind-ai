/**
 * Scores a quiz attempt on the server. `questions` come from the database,
 * `answers` from the client (selected option index or null). The client never sends correct answers.
 */
export function scoreAttempt(questions, answers) {
  const topics = new Map();
  const review = questions.map((q, i) => {
    const selectedIndex = Number.isInteger(answers[i]) ? answers[i] : null;
    const isCorrect = selectedIndex === q.correctIndex;
    const t = topics.get(q.topic) || { topic: q.topic, correct: 0, total: 0 };
    t.total += 1;
    if (isCorrect) t.correct += 1;
    topics.set(q.topic, t);
    return {
      question: q.question,
      options: q.options,
      selectedIndex,
      correctIndex: q.correctIndex,
      isCorrect,
      explanation: q.explanation,
      topic: q.topic,
    };
  });
  const score = review.filter((r) => r.isCorrect).length;
  const total = questions.length;
  return {
    score,
    total,
    percentage: total ? Math.round((score / total) * 100) : 0,
    review,
    topicStats: [...topics.values()],
  };
}
