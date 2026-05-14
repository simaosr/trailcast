import { DateService } from './DateService';

interface ForecastDay {
    date: string;
    tempMax: number;
    tempMin: number;
    wind: number;
    gust: number;
    rain: number;
    rainMm: number;
}

interface HourlyForecast {
    temp: number;
    condition: string;
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

interface PositionWeatherData {
    temp: number;
    wind: number;
    gust: number;
    rain: number;
    rainProbability: number;
    sun: number;
    elevation: number;
}

export class WeatherService {
    private static BASE_URL = 'https://api.open-meteo.com/v1/forecast';

    static async getDailyForecast(position: WeatherPosition): Promise<{
        daily: ForecastDay[];
        location: string;
    }> {
        const url = `${this.BASE_URL}?latitude=${position.lat}&longitude=${position.lon}&daily=temperature_2m_max,temperature_2m_min,windspeed_10m_max,windgusts_10m_max,precipitation_probability_max,precipitation_sum&timezone=auto`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            const dailyForecast = data.daily.time.map((date: string, index: number) => ({
                date,
                tempMax: Math.round(data.daily.temperature_2m_max[index]),
                tempMin: Math.round(data.daily.temperature_2m_min[index]),
                wind: Math.round(data.daily.windspeed_10m_max[index]),
                gust: Math.round(data.daily.windgusts_10m_max[index]),
                rain: data.daily.precipitation_probability_max[index],
                rainMm: data.daily.precipitation_sum[index]
            }));

            const location = await this.getLocationName(position.lat, position.lon);

            return {
                daily: dailyForecast,
                location
            };
        } catch (error) {
            console.error('Error fetching daily forecast:', error);
            throw error;
        }
    }

    static async getHourlyForecast(position: WeatherPosition): Promise<{
        hourly: HourlyForecast[];
        location: string;
    }> {
        const url = `${this.BASE_URL}?latitude=${position.lat}&longitude=${position.lon}&hourly=temperature_2m,precipitation_probability,weathercode&timezone=auto`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            const currentTime = new Date();
            const nextFiveHours = data.hourly.time
                .map((time: string, index: number) => ({
                    time: new Date(time),
                    temp: Math.round(data.hourly.temperature_2m[index]),
                    rain: data.hourly.precipitation_probability[index],
                    weathercode: data.hourly.weathercode[index]
                }))
                .filter((hour: { time: Date }) => hour.time > currentTime)
                .slice(0, 5)
                .map((hour: { time: Date; temp: number; weathercode: number }) => {
                    const timeFormat = DateService.formatTime(hour.time);
                    return {
                        temp: hour.temp,
                        condition: this.getWeatherCondition(hour.time, hour.weathercode),
                        time: timeFormat.time,
                        period: timeFormat.period
                    };
                });

            const location = await this.getLocationName(position.lat, position.lon);

            return {
                hourly: nextFiveHours,
                location
            };
        } catch (error) {
            console.error('Error fetching hourly forecast:', error);
            throw error;
        }
    }

    static async getForecast(position: WeatherPosition): Promise<{
        daily: ForecastDay[];
        hourly: HourlyForecast[];
        location: string;
    }> {
        const [dailyData, hourlyData] = await Promise.all([
            this.getDailyForecast(position),
            this.getHourlyForecast(position)
        ]);

        return {
            daily: dailyData.daily,
            hourly: hourlyData.hourly,
            location: dailyData.location
        };
    }

    static async getWeatherDataForPosition(position: ExtendedWeatherPosition): Promise<PositionWeatherData> {
        const dateStr = position.time.toISOString().split('T')[0]; // YYYY-MM-DD
        const url = `${this.BASE_URL}?latitude=${position.lat}&longitude=${position.lon}&hourly=temperature_2m,windspeed_10m,windgusts_10m,precipitation,precipitation_probability,uv_index&elevation=${position.elevation || 0}&start_date=${dateStr}&end_date=${dateStr}&timezone=auto`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            // API returns 24 hourly values for the requested day; pick the matching hour
            const hour = position.time.getHours();

            return {
                temp: data.hourly.temperature_2m[hour],
                wind: data.hourly.windspeed_10m[hour],
                gust: data.hourly.windgusts_10m[hour],
                rain: data.hourly.precipitation[hour],
                rainProbability: data.hourly.precipitation_probability[hour],
                sun: data.hourly.uv_index[hour],
                elevation: data.elevation,
            };
        } catch (error) {
            console.error('Weather fetch error:', error);
            return {
                temp: 0,
                wind: 0,
                gust: 0,
                rain: 0,
                rainProbability: 0,
                sun: 0,
                elevation: position.elevation || 0,
            };
        }
    }

    static async getWeatherDataForPositions(positions: ExtendedWeatherPosition[]): Promise<PositionWeatherData[]> {
        const BATCH_SIZE = 5;
        const results: PositionWeatherData[] = [];
        for (let i = 0; i < positions.length; i += BATCH_SIZE) {
            const batch = await Promise.all(
                positions.slice(i, i + BATCH_SIZE).map(pos => this.getWeatherDataForPosition(pos))
            );
            results.push(...batch);
        }
        return results;
    }

    private static getWeatherCondition(time: Date, weathercode: number): string {
        if (DateService.isNightTime(time)) {
            return 'night';
        }
        return weathercode <= 1 ? 'sunny' : 'cloudy';
    }

    static async getBestStartTime(
        position: WeatherPosition,
        hikeDurationHours: number
    ): Promise<{
        bestDay: string;
        bestHour: number;
        dayScores: { date: string; bestHour: number; score: number }[];
    }> {
        const url = `${this.BASE_URL}?latitude=${position.lat}&longitude=${position.lon}`
            + `&hourly=temperature_2m,precipitation_probability,precipitation,windspeed_10m`
            + `&forecast_days=7&timezone=auto`;

        const response = await fetch(url);
        const data = await response.json();

        const times: string[] = data.hourly.time;
        const temps: number[] = data.hourly.temperature_2m;
        const rainProbs: number[] = data.hourly.precipitation_probability;
        const rainMm: number[] = data.hourly.precipitation;
        const winds: number[] = data.hourly.windspeed_10m;

        // Build a map from date string to the index of its midnight hour
        const dayStartIndex = new Map<string, number>();
        times.forEach((t, i) => {
            const date = t.split('T')[0];
            if (!dayStartIndex.has(date)) dayStartIndex.set(date, i);
        });

        const CANDIDATE_HOURS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
        const windowLen = Math.max(1, Math.ceil(hikeDurationHours));

        const dayScores: { date: string; bestHour: number; score: number }[] = [];

        for (const [date, dayIdx] of dayStartIndex) {
            let bestHourScore = -Infinity;
            let bestHour = 7;

            for (const startHour of CANDIDATE_HOURS) {
                const winStart = dayIdx + startHour;
                const winEnd = Math.min(winStart + windowLen - 1, times.length - 1);
                if (winStart >= times.length) continue;

                let sumRainProb = 0, sumRainMm = 0, sumWind = 0, sumTemp = 0;
                const n = winEnd - winStart + 1;
                for (let i = winStart; i <= winEnd; i++) {
                    sumRainProb += rainProbs[i] ?? 0;
                    sumRainMm += rainMm[i] ?? 0;
                    sumWind += winds[i] ?? 0;
                    sumTemp += temps[i] ?? 15;
                }
                const avgRainProb = sumRainProb / n;
                const avgRainMm = sumRainMm / n;
                const avgWind = sumWind / n;
                const avgTemp = sumTemp / n;

                // Combine probability and intensity: heavy likely rain scores much worse than light likely rain
                const rainScore = Math.max(0, 100 - avgRainProb - avgRainMm * 5);
                const windScore = Math.max(0, 100 - avgWind * 2);
                const tempScore = Math.max(0, 100 - Math.abs(avgTemp - 18) * 3);

                const score = rainScore * 0.5 + windScore * 0.3 + tempScore * 0.2;

                if (score > bestHourScore) {
                    bestHourScore = score;
                    bestHour = startHour;
                }
            }

            dayScores.push({ date, bestHour, score: bestHourScore });
        }

        dayScores.sort((a, b) => b.score - a.score);
        const best = dayScores[0];

        return { bestDay: best.date, bestHour: best.bestHour, dayScores };
    }

    static async getLocationName(lat: number, lon: number): Promise<string> {
        try {
            // TODO: Implement reverse geocoding service
            return 'Trail Start, Mountain Range';
        } catch (error) {
            console.error('Error getting location name:', error);
            return 'Unknown Location';
        }
    }
}
