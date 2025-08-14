interface TrackPoint {
  lat: number;
  lon: number;
  ele?: number;
}

interface Position extends TrackPoint {
  time: Date;
  elevation?: number;
}

interface HikeStats {
  maxTemp: number;
  minTemp: number;
  totalTime: number;
  denivele: number;
  accumulatedRain: number;
  maxWind: number;
}

interface HikeData {
  // Original GPX track points
  trackPoints: TrackPoint[];
  // Calculated positions for weather data (optional)
  positions?: Position[];
  // Weather data (optional)
  weather?: {
    temp: number;
    wind: number;
    rain: number;
    elevation: number;
  }[];
}

export default class HikeService {
  private readonly WALKING_SPEED = 5; // km/h

  // Parse GPX file text into track points
  parseGPX(gpxText: string): TrackPoint[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(gpxText, 'text/xml');
    return Array.from(doc.getElementsByTagName('trkpt')).map((trkpt) => ({
      lat: parseFloat(trkpt.getAttribute('lat') || '0'),
      lon: parseFloat(trkpt.getAttribute('lon') || '0'),
      ele: parseFloat(trkpt.getElementsByTagName('ele')[0]?.textContent || '0'),
    }));
  }

  // Calculate positions along the route at regular time intervals
  calculatePositions(points: TrackPoint[], startTime: Date): Position[] {
    const positions: Position[] = [];
    let currentTime = new Date(startTime);
    let accumulatedDistance = 0;
    let currentIndex = 0;

    while (currentIndex < points.length - 1) {
      const timeIncrement = 15; // minutes
      const distanceIncrement = (this.WALKING_SPEED * timeIncrement) / 60; // km

      // Find segment where hiker would be after this time increment
      while (currentIndex < points.length - 1) {
        const segmentDistance = this.haversine(points[currentIndex], points[currentIndex + 1]);
        if (accumulatedDistance + segmentDistance >= distanceIncrement) break;
        accumulatedDistance += segmentDistance;
        currentIndex++;
      }

      if (currentIndex >= points.length - 1) break; // End of track

      // Calculate interpolation factor
      const remaining = distanceIncrement - accumulatedDistance;
      const segmentDistance = this.haversine(points[currentIndex], points[currentIndex + 1]);
      const fraction = remaining / segmentDistance;

      // Interpolate position
      const newLat =
        points[currentIndex].lat +
        (points[currentIndex + 1].lat - points[currentIndex].lat) * fraction;
      const newLon =
        points[currentIndex].lon +
        (points[currentIndex + 1].lon - points[currentIndex].lon) * fraction;

      positions.push({
        lat: newLat,
        lon: newLon,
        time: new Date(currentTime),
        elevation: points[currentIndex].ele,
      });

      // Update tracking variables
      currentTime.setMinutes(currentTime.getMinutes() + timeIncrement);
      accumulatedDistance = 0;
      currentIndex = Math.max(currentIndex, 0);
    }
    return positions;
  }

  // Fetch weather data for each position using WeatherService
  async fetchWeatherData(positions: Position[]) {
    const { WeatherService } = await import('./WeatherService');
    return WeatherService.getWeatherDataForPositions(positions);
  }

  // Calculate distance between two points using Haversine formula
  private haversine(a: TrackPoint, b: TrackPoint): number {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLon = ((b.lon - a.lon) * Math.PI) / 180;
    const x =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((a.lat * Math.PI) / 180) *
        Math.cos((b.lat * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }

  // Calculate basic stats that don't require time or weather data
  calculateBasicStats(trackPoints: TrackPoint[]): { 
    denivele: number;
    distance: number;
  } {
    const stats = {
      denivele: 0,
      distance: 0
    };

    // Calculate elevation gain and distance
    for (let i = 0; i < trackPoints.length - 1; i++) {
      const a = trackPoints[i];
      const b = trackPoints[i + 1];
      stats.denivele += (b.ele || 0) - (a.ele || 0);
      stats.distance += this.haversine(a, b);
    }

    return stats;
  }

  // Calculate full stats including weather data (call this when weather data is available)
  async calculateFullStats(hikeData: HikeData): Promise<HikeStats> {
    const weatherData = hikeData.weather;
    const stats: HikeStats = {
      maxTemp: -Infinity,
      minTemp: Infinity,
      totalTime: 0,
      denivele: 0,
      accumulatedRain: 0,
      maxWind: 0,
    };

    // Get basic stats first
    const basicStats = this.calculateBasicStats(hikeData.trackPoints);
    stats.denivele = basicStats.denivele;

    // calculate metrics from weather data if available
    if (weatherData) {
      for (const weather of weatherData) {
        stats.accumulatedRain += weather.rain;
        stats.maxWind = Math.max(stats.maxWind, weather.wind);
        stats.maxTemp = Math.max(stats.maxTemp, weather.temp);
        stats.minTemp = Math.min(stats.minTemp, weather.temp);
      }
    }

    return stats;
  }
}
