/**
 * IWeatherProvider.js
 * -------------------
 * Interface definition for weather data providers.
 * Prototype uses MockWeatherProvider. A real provider (e.g., IMD) can be
 * plugged in behind this interface without changing business logic.
 *
 * PROTOTYPE DISCLAIMER: Weather data in this prototype is mock/simulated.
 */

class IWeatherProvider {
  /**
   * Get environmental observations for a location and time range.
   * @param {{ village, district }} location
   * @param {{ startDate, endDate }} range
   * @returns {Promise<Array>} array of observation objects
   */
  // eslint-disable-next-line no-unused-vars
  async getObservations(location, range) {
    throw new Error('IWeatherProvider.getObservations() must be implemented');
  }

  /**
   * Check if this provider is using mock/simulated data.
   * Must return true for prototype implementations.
   */
  isMock() {
    return true;
  }

  /**
   * Provider display name — shown in UI for transparency.
   */
  providerName() {
    return 'Unknown Provider';
  }
}

module.exports = IWeatherProvider;
