import assert from "node:assert/strict";
import test from "node:test";
import {
  collectScoreSamples,
  median,
  medianScores,
  scoresMeetThresholds,
} from "../../scripts/lighthouse-scores.mjs";

test("median returns the middle score without mutating input", () => {
  const values = [1, 0.94, 0.99];

  assert.equal(median(values), 0.99);
  assert.deepEqual(values, [1, 0.94, 0.99]);
});

test("median averages the two middle scores for an even sample", () => {
  assert.equal(median([0.4, 0.8, 0.2, 0.6]), 0.5);
});

test("median rejects empty or non-finite samples", () => {
  assert.throws(() => median([]), TypeError);
  assert.throws(() => median([1, Number.NaN]), TypeError);
});

test("medianScores evaluates every requested Lighthouse category", () => {
  const samples = [
    { accessibility: 1, performance: 0.94 },
    { accessibility: 0.98, performance: 1 },
    { accessibility: 0.99, performance: 0.97 },
  ];

  assert.deepEqual(medianScores(samples, ["accessibility", "performance"]), {
    accessibility: 0.99,
    performance: 0.97,
  });
});

test("scoresMeetThresholds accepts equality and rejects low or missing scores", () => {
  const thresholds = { accessibility: 0.95, performance: 0.95 };

  assert.equal(
    scoresMeetThresholds({ accessibility: 1, performance: 0.95 }, thresholds),
    true,
  );
  assert.equal(
    scoresMeetThresholds({ accessibility: 1, performance: 0.94 }, thresholds),
    false,
  );
  assert.equal(scoresMeetThresholds({ accessibility: 1 }, thresholds), false);
});

test("collectScoreSamples stops after a passing first sample", async () => {
  const sampleNumbers = [];

  const result = await collectScoreSamples(
    async (sampleNumber) => {
      sampleNumbers.push(sampleNumber);
      return { performance: 1 };
    },
    { performance: 0.95 },
  );

  assert.deepEqual(sampleNumbers, [1]);
  assert.deepEqual(result, {
    samples: [{ performance: 1 }],
    scores: { performance: 1 },
  });
});

test("collectScoreSamples confirms an initial miss with a three-run median", async () => {
  const scoreSequence = [0.94, 1, 0.98];
  const sampleNumbers = [];

  const result = await collectScoreSamples(
    async (sampleNumber) => {
      sampleNumbers.push(sampleNumber);
      return { performance: scoreSequence[sampleNumber - 1] };
    },
    { performance: 0.95 },
  );

  assert.deepEqual(sampleNumbers, [1, 2, 3]);
  assert.deepEqual(result, {
    samples: [{ performance: 0.94 }, { performance: 1 }, { performance: 0.98 }],
    scores: { performance: 0.98 },
  });
});

test("collectScoreSamples keeps a persistent regression below the budget", async () => {
  const scoreSequence = [0.94, 0.92, 0.96];

  const result = await collectScoreSamples(
    async (sampleNumber) => ({
      performance: scoreSequence[sampleNumber - 1],
    }),
    { performance: 0.95 },
  );

  assert.equal(result.scores.performance, 0.94);
  assert.equal(
    scoresMeetThresholds(result.scores, { performance: 0.95 }),
    false,
  );
});
