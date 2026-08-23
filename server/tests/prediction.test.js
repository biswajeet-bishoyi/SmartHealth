const predictionEngine = require('../services/predictionEngine');

describe('predictionEngine — Data Sufficiency & Confidence Logic', () => {
  test('computeConfidence returns high score when abundant data exists', () => {
    const confidence = predictionEngine.computeConfidence(12, 20, 35, 1);
    expect(confidence).toBe(100);
  });

  test('computeConfidence returns lower score when data is sparse', () => {
    const confidence = predictionEngine.computeConfidence(2, 3, 4, 0);
    expect(confidence).toBeLessThan(50);
  });

  test('calculateConfidence returns bounded confidence', () => {
    expect(predictionEngine.calculateConfidence(1)).toBe(40);
    expect(predictionEngine.calculateConfidence(5)).toBe(70);
    expect(predictionEngine.calculateConfidence(12)).toBe(90);
  });

  test('calculateWeeklyTrend returns percentage growth safely', () => {
    expect(predictionEngine.calculateWeeklyTrend({ totalCases: 20 }, { totalCases: 10 })).toBe(100);
    expect(predictionEngine.calculateWeeklyTrend({ totalCases: 5 }, { totalCases: 0 })).toBe(0); // Safe fallback
  });

  test('calculatePrediction returns insufficientData when reportCount < 5', () => {
    const res = predictionEngine.calculatePrediction({ reportCount: 3 });
    expect(res.success).toBe(false);
    expect(res.data.insufficientData).toBe(true);
    expect(res.status).toBe('EXPERIMENTAL');
  });

  test('calculatePrediction calculates score when reportCount >= 5', () => {
    const res = predictionEngine.calculatePrediction({
      reportCount: 8,
      weeklyReports: [{ totalCases: 5 }, { totalCases: 10 }],
      environmentalRisk: 40,
    });
    expect(res.success).toBe(true);
    expect(res.data.prediction).toBeDefined();
    expect(res.status).toBe('EXPERIMENTAL');
  });
});
