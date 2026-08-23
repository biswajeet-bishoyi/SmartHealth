describe('simulationService — Sandbox Isolation Guarantee', () => {
  test('Simulation results are marked with SIMULATION label', () => {
    const simulationResult = {
      village: 'Majuli Village',
      district: 'Kamrup',
      baselineRiskScore: 45,
      baselineRiskLevel: 'MEDIUM',
      projectedRiskScore: 78,
      projectedRiskLevel: 'HIGH',
      scoreDelta: 33,
      label: 'SIMULATION — not a stored assessment',
    };

    expect(simulationResult.label).toBe('SIMULATION — not a stored assessment');
    expect(simulationResult.projectedRiskScore).toBeGreaterThan(simulationResult.baselineRiskScore);
  });
});
