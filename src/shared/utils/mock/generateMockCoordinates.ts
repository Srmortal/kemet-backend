// generateMockCoordinates.ts
// Utility to generate random latitude and longitude coordinates within Egypt's bounding box

export function generateMockCoordinates(
  minLat = 22.0,
  maxLat = 31.5,
  minLng = 25.0,
  maxLng = 35.0
): { latitude: number; longitude: number } {
  const latitude = Math.random() * (maxLat - minLat) + minLat;
  const longitude = Math.random() * (maxLng - minLng) + minLng;
  return {
    latitude: Number.parseFloat(latitude.toFixed(6)),
    longitude: Number.parseFloat(longitude.toFixed(6)),
  };
}

// Example usage:
// const coords = generateMockCoordinates();
// console.log(coords);
