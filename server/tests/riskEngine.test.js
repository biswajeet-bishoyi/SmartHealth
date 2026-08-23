const riskEngine = require('../services/riskEngine');

describe('riskEngine v2.0 — getRiskLevel thresholds', () => {
  const { getRiskLevel } = riskEngine;

  test('score 0 → LOW', () => {
    expect(getRiskLevel(0)).toBe('LOW');
  });

  test('score 30 → LOW (boundary)', () => {
    expect(getRiskLevel(30)).toBe('LOW');
  });

  test('score 31 → MEDIUM (just above LOW)', () => {
    expect(getRiskLevel(31)).toBe('MEDIUM');
  });

  test('score 60 → MEDIUM (boundary)', () => {
    expect(getRiskLevel(60)).toBe('MEDIUM');
  });

  test('score 61 → HIGH (just above MEDIUM)', () => {
    expect(getRiskLevel(61)).toBe('HIGH');
  });

  test('score 80 → HIGH (boundary)', () => {
    expect(getRiskLevel(80)).toBe('HIGH');
  });

  test('score 81 → CRITICAL (just above HIGH)', () => {
    expect(getRiskLevel(81)).toBe('CRITICAL');
  });

  test('score 100 → CRITICAL', () => {
    expect(getRiskLevel(100)).toBe('CRITICAL');
  });
});

describe('riskEngine v2.0 — getConfig default parameters', () => {
  test('getConfig returns default weights summing to 1.0', async () => {
    const config = await riskEngine.getConfig();
    const { weights, priorityWeights, thresholds } = config;

    const coreSum = weights.symptom + weights.growth + weights.water + weights.cluster;
    expect(Math.abs(coreSum - 1.0)).toBeLessThan(0.001);

    const prioritySum = priorityWeights.risk + priorityWeights.environmental + priorityWeights.vulnerability;
    expect(Math.abs(prioritySum - 1.0)).toBeLessThan(0.001);

    expect(thresholds.LOW).toBeLessThan(thresholds.MEDIUM);
    expect(thresholds.MEDIUM).toBeLessThan(thresholds.HIGH);
    expect(thresholds.HIGH).toBeLessThanOrEqual(thresholds.CRITICAL);
  });
});
