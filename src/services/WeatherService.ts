import { DateService } from './DateService';

interface ForecastDay {
    date: string;
    tempMax: number;
    tempMin: number;
    wind: number;
    gust: number;
    rain: number;
    rainMm: number;
    weathercode: number;
    sunrise: string;
    sunset: string;
}

interface HourlyForecast {
    temp: number;
    condition: string;
    icon: string;
    time: string;
    period: string;
}

interface WeatherPosition {
    lat: number;
    lon: number;
    timestamp?: string;
}

interface ExtendedWeatherPosition {
    lat: number;
    lon: number;
    elevation?: number;
    time: Date;
}

export interface PositionWeatherData {
    temp: number;
    feelsLike: number;
    wind: number;
    gust: number;
    rain: number;
    rainProbability: number;
    sun: number;
    weathercode: number;
    elevation: number;
}

interface WeatherCodeInfo {
    label: string;
    icon: string;
    nightIcon?: string;
}

const WEATHER_CODES: Record<number, WeatherCodeInfo> = {
    0: { label: 'Clear sky', icon: '☀️', nightIcon: '🌙' },
    1: { label: 'Mainly clear', icon: '🌤️', nightIcon: '🌙' },
    2: { label: 'Partly cloudy', icon: '⛅', nightIcon: '☁️' },
    3: { label: 'Overcast', icon: '☁️' },
    45: { label: 'Fog', icon: '🌫️' },
    48: { label: 'Depositing rime fog', icon: '🌫️' },
    51: { label: 'Light drizzle', icon: '🌦️' },
    53: { label: 'Drizzle', icon: '🌦️' },
    55: { label: 'Dense drizzle', icon: '🌧️' },
    56: { label: 'Freezing drizzle', icon: '🌧️' },
    57: { label: 'Freezing drizzle', icon: '🌧️' },
    61: { label: 'Light rain', icon: '🌦️' },
    63: { label: 'Rain', icon: '🌧️' },
    65: { label: 'Heavy rain', icon: '🌧️' },
    66: { label: 'Freezing rain', icon: '🌧️' },
    67: { label: 'Freezing rain', icon: '🌧️' },
    71: { label: 'Light snow', icon: '🌨️' },
    73: { label: 'Snow', icon: '🌨️' },
    75: { label: 'Heavy snow', icon: '❄️' },
    77: { label: 'Snow grains', icon: '❄️' },
    80: { label: 'Light showers', icon: '🌦️' },
    81: { label: 'Showers', icon: '🌧️' },
    82: { label: 'Violent showers', icon: '⛈️' },
    85: { label: 'Snow showers', icon: '🌨️' },
    86: { label: 'Heavy snow showers', icon: '🌨️' },
    95: { label: 'Thunderstorm', icon: '⛈️' },
    96: { label: 'Thunderstorm with hail', icon: '⛈️' },
    99: { label: 'Thunderstorm with hail', icon: '⛈️' },
};

const REQUEST_TIMEOUT_MS = 12000;
// Open-Meteo accepts many coordinates per request, but keep URLs a sane length
const BATCH_SIZE = 50;

export class WeatherService {
    private static BASE_URL = 'https://api.open-meteo.com/v1/forecast';

    static describeWeatherCode(code: number, isNight = false): WeatherCodeInfo {
        const info = WEATHER_CODES[code] ?? { label: 'Unknown', icon: '☁️' };
        if (isNight && info.nightIcon) {
            return { ...info, icon: info.nightIcon };
        }
        return info;
    }

    private static async fetchJson(url: string): Promise<any> {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        try {
            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) {
                throw new Error(`Weather service returned ${response.status}`);
            }
            const data = await response.json();
            if (data?.error) {
                throw new Error(data.reason || 'Weather service error');
            }
            return data;
        } catch (error: any) {
            if (error?.name === 'AbortError') {
                throw new Error('Weather request timed out. Check your connection and try again.');
            }
            throw error;
        } finally {
            clearTimeout(timer);
        }
    }

    static async getDailyForecast(position: WeatherPosition): Promise<{
        daily: ForecastDay[];
        location: string;
    }> {
        const url = `${this.BASE_URL}?latitude=${position.lat}&longitude=${position.lon}` +
            `&daily=temperature_2m_max,temperature_2m_min,windspeed_10m_max,windgusts_10m_max,` +
            `precipitation_probability_max,precipitation_sum,weathercode,sunrise,sunset&timezone=auto`;

        const data = await this.fetchJson(url);

        const dailyForecast = data.daily.time.map((date: string, index: number) => ({
            date,
            tempMax: Math.round(data.daily.temperature_2m_max[index]),
            tempMin: Math.round(data.daily.temperature_2m_min[index]),
            wind: Math.round(data.daily.windspeed_10m_max[index]),
            gust: Math.round(data.daily.windgusts_10m_max[index]),
            rain: data.daily.precipitation_probability_max[index] ?? 0,
            rainMm: data.daily.precipitation_sum[index] ?? 0,
            weathercode: data.daily.weathercode[index] ?? 3,
            sunrise: data.daily.sunrise[index],
            sunset: data.daily.sunset[index],
        }));

        const location = await this.getLocationName(position.lat, position.lon);

        return { daily: dailyForecast, location };
    }

    static async getHourlyForecast(position: WeatherPosition): Promise<{
        hourly: HourlyForecast[];
    }> {
        const url = `${this.BASE_URL}?latitude=${position.lat}&longitude=${position.lon}` +
            `&hourly=temperature_2m,precipitation_probability,weathercode&forecast_days=2&timezone=auto`;

        const data = await this.fetchJson(url);

        const currentTime = new Date();
        const nextFiveHours = data.hourly.time
            .map((time: string, index: number) => ({
                time: new Date(time),
                temp: Math.round(data.hourly.temperature_2m[index]),
                rain: data.hourly.precipitation_probability[index],
                weathercode: data.hourly.weathercode[index],
            }))
            .filter((hour: { time: Date }) => hour.time > currentTime)
            .slice(0, 5)
            .map((hour: { time: Date; temp: number; weathercode: number }) => {
                const timeFormat = DateService.formatTime(hour.time);
                const info = this.describeWeatherCode(hour.weathercode, DateService.isNightTime(hour.time));
                return {
                    temp: hour.temp,
                    condition: info.label,
                    icon: info.icon,
                    time: timeFormat.time,
                    period: timeFormat.period,
                };
            });

        return { hourly: nextFiveHours };
    }

    static async getForecast(position: WeatherPosition): Promise<{
        daily: ForecastDay[];
        hourly: HourlyForecast[];
        location: string;
    }> {
        const [dailyData, hourlyData] = await Promise.all([
            this.getDailyForecast(position),
            this.getHourlyForecast(position),
        ]);

        return {
            daily: dailyData.daily,
            hourly: hourlyData.hourly,
            location: dailyData.location,
        };
    }

    /**
     * Fetch weather for all positions along a trail in batched requests
     * (one request per BATCH_SIZE positions instead of one per position).
     * Values are linearly interpolated between the two surrounding hours.
     */
    static async getWeatherDataForPositions(positions: ExtendedWeatherPosition[]): Promise<PositionWeatherData[]> {
        if (!positions.length) return [];

        // The whole hike window in UTC, so date math is unambiguous
        const times = positions.map((p) => p.time.getTime());
        const startDate = this.utcDateString(new Date(Math.min(...times)));
        const endDate = this.utcDateString(new Date(Math.max(...times)));

        const batches: ExtendedWeatherPosition[][] = [];
        for (let i = 0; i < positions.length; i += BATCH_SIZE) {
            batches.push(positions.slice(i, i + BATCH_SIZE));
        }

        const results = await Promise.all(
            batches.map((batch) => this.fetchBatch(batch, startDate, endDate))
        );
        return results.flat();
    }

    private static async fetchBatch(
        batch: ExtendedWeatherPosition[],
        startDate: string,
        endDate: string
    ): Promise<PositionWeatherData[]> {
        const lats = batch.map((p) => p.lat.toFixed(4)).join(',');
        const lons = batch.map((p) => p.lon.toFixed(4)).join(',');

        const url = `${this.BASE_URL}?latitude=${lats}&longitude=${lons}` +
            `&hourly=temperature_2m,apparent_temperature,windspeed_10m,windgusts_10m,` +
            `precipitation,precipitation_probability,uv_index,weathercode` +
            `&start_date=${startDate}&end_date=${endDate}&timezone=UTC`;

        const data = await this.fetchJson(url);
        // Open-Meteo returns an object for a single location, an array for several
        const perLocation = Array.isArray(data) ? data : [data];

        return batch.map((position, i) => {
            const loc = perLocation[i] ?? perLocation[0];
            const hourly = loc.hourly;
            const firstHour = new Date(hourly.time[0] + 'Z').getTime();
            const exact = (position.time.getTime() - firstHour) / 3_600_000;
            const idx = Math.min(Math.max(Math.floor(exact), 0), hourly.time.length - 1);
            const frac = Math.min(Math.max(exact - idx, 0), 1);

            const lerp = (arr: number[]) => {
                const a = arr[idx] ?? 0;
                const b = arr[Math.min(idx + 1, arr.length - 1)] ?? a;
                return a + (b - a) * frac;
            };

            return {
                temp: lerp(hourly.temperature_2m),
                feelsLike: lerp(hourly.apparent_temperature),
                wind: lerp(hourly.windspeed_10m),
                gust: lerp(hourly.windgusts_10m),
                rain: lerp(hourly.precipitation),
                rainProbability: lerp(hourly.precipitation_probability),
                sun: lerp(hourly.uv_index),
                weathercode: hourly.weathercode[Math.round(exact)] ?? hourly.weathercode[idx] ?? 3,
                elevation: position.elevation ?? loc.elevation ?? 0,
            };
        });
    }

    private static utcDateString(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    static async getLocationName(lat: number, lon: number): Promise<string> {
        try {
            // Free client-side reverse geocoding, no API key required
            const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
            const data = await this.fetchJson(url);
            const parts = [data.locality || data.city, data.principalSubdivision, data.countryName]
                .filter((p) => p && String(p).trim().length > 0);
            return parts.length ? parts.slice(0, 2).join(', ') : 'Unknown location';
        } catch (error) {
            console.error('Error getting location name:', error);
            return `${lat.toFixed(3)}, ${lon.toFixed(3)}`;
        }
    }
}
