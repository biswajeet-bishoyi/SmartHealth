/**
 * mockWeatherProvider.js
 * ----------------------
 * Mock implementation of IWeatherProvider.
 * Returns synthetic rainfall/flood data for demo villages.
 *
 * PROTOTYPE DISCLAIMER: All data from this provider is simulated/fictional.
 * Clearly labeled as isMock: true in all records it generates.
 */

const IWeatherProvider = require('./IWeatherProvider');

// Seeded mock events for demo villages
const MOCK_EVENTS = [
  { village: 'Majuli', district: 'Majuli', observationType: 'RAINFALL',  value: 120, severity: 'HIGH',     isHeavyRainfall: true, isFloodEvent: false, daysAgo: 3 },
  { village: 'Majuli', district: 'Majuli', observationType: 'FLOOD',     value: 1,   severity: 'CRITICAL', isHeavyRainfall: false, isFloodEvent: true,  daysAgo: 2 },
  { village: 'Majuli', district: 'Majuli', observationType: 'CONTAMINATION_RISK', value: 80, severity: 'HIGH', isHeavyRainfall: false, isFloodEvent: false, daysAgo: 1 },
  { village: 'Sivsagar', district: 'Sivsagar', observationType: 'RAINFALL', value: 60, severity: 'MEDIUM', isHeavyRainfall: false, isFloodEvent: false, daysAgo: 5 },
  { village: 'Jorhat',   district: 'Jorhat',   observationType: 'RAINFALL', value: 85, severity: 'HIGH',   isHeavyRainfall: true, isFloodEvent: false, daysAgo: 4 },
  { village: 'Golaghat', district: 'Golaghat', observationType: 'FLOOD',    value: 1,  severity: 'HIGH',   isHeavyRainfall: false, isFloodEvent: true,  daysAgo: 6 },
];

class MockWeatherProvider extends IWeatherProvider {
  isMock()       { return true; }
  providerName() { return 'MockWeatherProvider (prototype — simulated data)'; }

  async getObservations({ village, district }, { startDate, endDate } = {}) {
    return MOCK_EVENTS
      .filter(e => e.village === village || e.district === district)
      .map(e => {
        const observedAt = new Date(Date.now() - e.daysAgo * 24 * 60 * 60 * 1000);
        if (startDate && observedAt < new Date(startDate)) return null;
        if (endDate   && observedAt > new Date(endDate))   return null;
        return {
          village:         e.village,
          district:        e.district,
          observationType: e.observationType,
          value:           e.value,
          severity:        e.severity,
          isHeavyRainfall: e.isHeavyRainfall,
          isFloodEvent:    e.isFloodEvent,
          source:          'MOCK_SEED',
          isMock:          true,
          observedAt,
        };
      })
      .filter(Boolean);
  }
}

module.exports = new MockWeatherProvider();
