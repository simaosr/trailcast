interface TrackPoint {
  lat: number;
  lon: number;
  ele?: number;
}

export interface Position extends TrackPoint {
  time: Date;
  elevation?: number;
  /** Distance from the start of the hike, in km */
  distance: number;
}

interface ParsedGPX {
  trackPoints: TrackPoint[];
  name: string;
}

const POSITION_INTERVAL_MIN = 15;
const MAX_STORED_POINTS = 2000;

export default class HikeService {
  // Parse GPX file text into track points. Throws a descriptive error on bad input.
  parseGPX(gpxText: string): ParsedGPX {
    const parser = new DOMParser();
    const doc = parser.parseFromString(gpxText, 'text/xml');

    if (doc.getElementsByTagName('parsererror').length > 0) {
      throw new Error('This file is not valid GPX/XML.');
    }

    // Prefer track points, fall back to route points
    let pointNodes = Array.from(doc.getElementsByTagName('trkpt'));
    if (pointNodes.length === 0) {
      pointNodes = Array.from(doc.getElementsByTagName('rtept'));
    }

    const trackPoints = pointNodes
      .map((pt) => ({
        lat: parseFloat(pt.getAttribute('lat') || ''),
        lon: parseFloat(pt.getAttribute('lon') || ''),
        ele: parseFloat(pt.getElementsByTagName('ele')[0]?.textContent || '') || undefined,
      }))
      .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lon));

    if (trackPoints.length < 2) {
      throw new Error('No track found in this GPX file (need at least 2 points).');
    }

    const name =
      doc.getElementsByTagName('name')[0]?.textContent?.trim() || '';

    return { trackPoints, name };
  }

  // Reduce point count for storage/rendering while keeping the shape of the track
  downsample(points: TrackPoint[], maxPoints = MAX_STORED_POINTS): TrackPoint[] {
    if (points.length <= maxPoints) return points;
    const step = (points.length - 1) / (maxPoints - 1);
    const result: TrackPoint[] = [];
    for (let i = 0; i < maxPoints; i++) {
      result.push(points[Math.round(i * step)]);
    }
    return result;
  }

  // Calculate positions along the route at regular time intervals,
  // always including the start and the finish.
  calculatePositions(points: TrackPoint[], startTime: Date, speedKmh = 5): Position[] {
    if (points.length < 2) return [];

    // Cumulative distance along the track (km)
    const cumDist: number[] = [0];
    for (let i = 1; i < points.length; i++) {
      cumDist.push(cumDist[i - 1] + this.haversine(points[i - 1], points[i]));
    }
    const totalDist = cumDist[cumDist.length - 1];
    if (totalDist <= 0) return [];

    const stepKm = (speedKmh * POSITION_INTERVAL_MIN) / 60;
    const positions: Position[] = [];
    let segIdx = 0;

    for (let d = 0; d < totalDist; d += stepKm) {
      while (segIdx < points.length - 2 && cumDist[segIdx + 1] < d) segIdx++;
      positions.push(this.interpolate(points, cumDist, segIdx, d, startTime, speedKmh));
    }

    // Finish point with its actual arrival time
    positions.push(this.interpolate(points, cumDist, points.length - 2, totalDist, startTime, speedKmh));

    return positions;
  }

  private interpolate(
    points: TrackPoint[],
    cumDist: number[],
    segIdx: number,
    distance: number,
    startTime: Date,
    speedKmh: number
  ): Position {
    const a = points[segIdx];
    const b = points[segIdx + 1];
    const segLen = cumDist[segIdx + 1] - cumDist[segIdx];
    const f = segLen > 0 ? Math.min(Math.max((distance - cumDist[segIdx]) / segLen, 0), 1) : 0;

    const eleA = a.ele ?? b.ele;
    const eleB = b.ele ?? a.ele;
    const ele = eleA !== undefined && eleB !== undefined ? eleA + (eleB - eleA) * f : undefined;

    return {
      lat: a.lat + (b.lat - a.lat) * f,
      lon: a.lon + (b.lon - a.lon) * f,
      ele,
      elevation: ele,
      time: new Date(startTime.getTime() + (distance / speedKmh) * 3_600_000),
      distance: Math.round(distance * 100) / 100,
    };
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
    elevationGain: number;
    elevationLoss: number;
    distance: number;
    maxElevation: number | null;
    minElevation: number | null;
  } {
    const stats = {
      elevationGain: 0,
      elevationLoss: 0,
      distance: 0,
      maxElevation: null as number | null,
      minElevation: null as number | null,
    };

    for (let i = 0; i < trackPoints.length - 1; i++) {
      const a = trackPoints[i];
      const b = trackPoints[i + 1];
      if (a.ele !== undefined && b.ele !== undefined) {
        const diff = b.ele - a.ele;
        if (diff > 0) stats.elevationGain += diff;
        else stats.elevationLoss += diff;
      }
      stats.distance += this.haversine(a, b);
    }

    for (const p of trackPoints) {
      if (p.ele === undefined) continue;
      stats.maxElevation = stats.maxElevation === null ? p.ele : Math.max(stats.maxElevation, p.ele);
      stats.minElevation = stats.minElevation === null ? p.ele : Math.min(stats.minElevation, p.ele);
    }

    return stats;
  }

  /**
   * Estimated hike duration in hours, accounting for climbs
   * (Naismith's rule: +1h per 600m of ascent).
   */
  estimateDuration(distanceKm: number, elevationGainM: number, speedKmh = 5): number {
    return distanceKm / speedKmh + elevationGainM / 600;
  }
}
