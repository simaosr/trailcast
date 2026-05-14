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
        const url = `${this.BASE_URL}?latitude=${position.lat}&longitude=${position.lon}&hourly=temperature_2m,windspeed_10m,precipitation,precipitation_probability,uv_index&elevation=${position.elevation || 0}&start_date=${dateStr}&end_date=${dateStr}&timezone=auto`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            // API returns 24 hourly values for the requested day; pick the matching hour
            const hour = position.time.getHours();

            return {
                temp: data.hourly.temperature_2m[hour],
                wind: data.hourly.windspeed_10m[hour],
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
                rain: 0,
                rainProbability: 0,
                sun: 0,
                elevation: position.elevation || 0,
            };
        }
    }

    static async getWeatherDataForPositions(positions: ExtendedWeatherPosition[]): Promise<PositionWeatherData[]> {
        return Promise.all(positions.map(pos => this.getWeatherDataForPosition(pos)));
    }

    private static getWeatherCondition(time: Date, weathercode: number): string {
        if (DateService.isNightTime(time)) {
            return 'night';
        }
        return weathercode <= 1 ? 'sunny' : 'cloudy';
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
