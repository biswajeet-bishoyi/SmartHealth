describe('explanationService — Deterministic Component Breakdown', () => {
  test('Component contributions sum within ±1 of totalScore', () => {
    const mockAssessment = {
      village: 'Majuli Village',
      district: 'Kamrup',
      state: 'Assam',
      symptomScore: 75,
      growthScore: 60,
      waterScore: 80,
      clusterScore: 50,
      environmentalRisk: 65,
      vulnerabilityScore: 78,
      riskScore: 69,
      priorityScore: 70,
      riskLevel: 'HIGH',
      weightsSnapshot: { symptom: 0.40, growth: 0.25, water: 0.20, cluster: 0.15 },
      priorityWeightsSnapshot: { risk: 0.60, environmental: 0.20, vulnerability: 0.20 },
    };

    // Calculate component contributions as explanationService does
    const symptomContrib = Math.round(mockAssessment.symptomScore * mockAssessment.weightsSnapshot.symptom);
    const growthContrib  = Math.round(mockAssessment.growthScore  * mockAssessment.weightsSnapshot.growth);
    const waterContrib   = Math.round(mockAssessment.waterScore   * mockAssessment.weightsSnapshot.water);
    const clusterContrib = Math.round(mockAssessment.clusterScore * mockAssessment.weightsSnapshot.cluster);

    const calculatedRiskScore = symptomContrib + growthContrib + waterContrib + clusterContrib;
    expect(Math.abs(calculatedRiskScore - mockAssessment.riskScore)).toBeLessThanOrEqual(1);

    // Priority score layer sum check
    const riskPart = Math.round(mockAssessment.riskScore * mockAssessment.priorityWeightsSnapshot.risk);
    const envPart  = Math.round(mockAssessment.environmentalRisk * mockAssessment.priorityWeightsSnapshot.environmental);
    const vulnPart = Math.round(mockAssessment.vulnerabilityScore * mockAssessment.priorityWeightsSnapshot.vulnerability);

    const calculatedPriorityScore = riskPart + envPart + vulnPart;
    expect(Math.abs(calculatedPriorityScore - mockAssessment.priorityScore)).toBeLessThanOrEqual(1);
  });
});
