// Default location constants
export const DEFAULT_LOCATION = {
  latitude: 32.074661,  // Azrieli Mall Tel Aviv latitude
  longitude: 34.791729, // Azrieli Mall Tel Aviv longitude
  address: "Azrieli Mall, Derech Menachem Begin 132, Tel Aviv-Yafo",
};

// Israel boundaries (approximate)
export const ISRAEL_BOUNDS = {
  north: 33.33, // Northern border
  south: 29.49, // Southern border
  west: 34.27,  // Western border (Mediterranean)
  east: 35.90   // Eastern border
};

// Check if coordinates are within Israel
export const isLocationInIsrael = (latitude, longitude) => {
  return latitude >= ISRAEL_BOUNDS.south &&
         latitude <= ISRAEL_BOUNDS.north &&
         longitude >= ISRAEL_BOUNDS.west &&
         longitude <= ISRAEL_BOUNDS.east;
};
