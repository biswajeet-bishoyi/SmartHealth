import northeastLocations from './northeastLocations.json';

export const NORTHEAST_STATES = [
  'Assam',
  'Meghalaya',
  'Manipur',
  'Nagaland',
  'Tripura',
  'Mizoram',
  'Arunachal Pradesh',
  'Sikkim',
];

/**
 * Get sorted list of districts for a given state
 */
export function getDistricts(state) {
  if (!state || !northeastLocations[state]) {
    return [];
  }
  return Object.keys(northeastLocations[state]).sort((a, b) => a.localeCompare(b));
}

/**
 * Get sorted list of villages / sectors for a given state and district
 */
export function getVillages(state, district) {
  if (!state || !district || !northeastLocations[state] || !northeastLocations[state][district]) {
    return [];
  }
  return northeastLocations[state][district];
}

export default northeastLocations;
