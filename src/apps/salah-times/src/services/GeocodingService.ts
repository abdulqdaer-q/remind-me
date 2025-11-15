/**
 * Geocoding service to get city name from coordinates
 */

interface GeocodingResponse {
  address: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    country?: string;
  };
  display_name: string;
}

class GeocodingService {
  private cache: Map<string, string> = new Map();

  /**
   * Get city name from coordinates using OpenStreetMap Nominatim API
   */
  async getCityName(lat: string, lng: string): Promise<string> {
    const cacheKey = `${lat},${lng}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SalahTimesApp/1.0',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: GeocodingResponse = await response.json();
      const cityName = this.extractCityName(data);

      // Cache the result
      this.cache.set(cacheKey, cityName);

      return cityName;
    } catch (error) {
      console.error('Error fetching city name:', error);
      // Return coordinates as fallback
      return `${parseFloat(lat).toFixed(2)}°, ${parseFloat(lng).toFixed(2)}°`;
    }
  }

  /**
   * Extract city name from geocoding response
   */
  private extractCityName(data: GeocodingResponse): string {
    const { address } = data;

    // Try different levels of locality
    return (
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.county ||
      address.state ||
      address.country ||
      'Unknown Location'
    );
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const geocodingService = new GeocodingService();
