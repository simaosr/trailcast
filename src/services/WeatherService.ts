import { fetchWeatherApi } from 'openmeteo' 

export default class WeatherService {

    // Fetch weather data for each position
    async fetchWeatherData(positions) {
      const weatherData = []

      // create params dictionary with all positions. Get the timestamp from start time to end time of hike
      const params = {
        latitude: positions.map((position) => position.latitude),
        longitude: positions.map((position) => position.longitude),
        hourly: ['temperature_2m', 'precipitation_sum', 'windspeed_10m'],
        timezone: 'auto',
        start: new Date(positions[0].timestamp).toISOString(),
        end: new Date(positions[positions.length - 1].timestamp).toISOString(),
      }
    
  
      return weatherData
    }

  }
  