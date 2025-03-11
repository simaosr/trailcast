export default class HikeService {
    constructor() {
        this.WALKING_SPEED = 5; // km/h
    }

    // Parse GPX file text into track points
    parseGPX(gpxText) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(gpxText, 'text/xml');
        return Array.from(doc.getElementsByTagName('trkpt')).map(trkpt => ({
            lat: parseFloat(trkpt.getAttribute('lat')),
            lon: parseFloat(trkpt.getAttribute('lon')),
            ele: parseFloat(trkpt.getElementsByTagName('ele')[0]?.textContent)
        }));
    }

    // Calculate positions along the route at regular time intervals
    calculatePositions(points, startTime) {
        const positions = [];
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
            const newLat = points[currentIndex].lat +
                (points[currentIndex + 1].lat - points[currentIndex].lat) * fraction;
            const newLon = points[currentIndex].lon +
                (points[currentIndex + 1].lon - points[currentIndex].lon) * fraction;

            positions.push({
                lat: newLat,
                lon: newLon,
                time: new Date(currentTime),
                elevation: points[currentIndex].ele
            });

            // Update tracking variables
            currentTime.setMinutes(currentTime.getMinutes() + timeIncrement);
            accumulatedDistance = 0;
            currentIndex = Math.max(currentIndex, 0);
        }
        return positions;
    }

    // Fetch weather data for each position
    async fetchWeatherData(positions) {
        const weatherData = [];

        for (const pos of positions) {
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${pos.lat}&longitude=${pos.lon}&hourly=temperature_2m,windspeed_10m,precipitation,shortwave_radiation&elevation=${pos.elevation}&start=${pos.time.toISOString().split('.')[0]}&end=${pos.time.toISOString().split('.')[0]}`;

            try {
                const response = await fetch(url);
                const data = await response.json();
                weatherData.push({
                    temp: data.hourly.temperature_2m[0],
                    wind: data.hourly.windspeed_10m[0],
                    rain: data.hourly.precipitation[0],
                    sun: data.hourly.shortwave_radiation[0],
                    elevation: data.elevation
                });
            } catch (error) {
                console.error('Weather fetch error:', error);
                weatherData.push({
                    temp: 0,
                    wind: 0,
                    rain: 0,
                    sun: 0,
                    elevation: pos.elevation || 0
                });
            }
        }

        return weatherData;
    }

    // Calculate distance between two points using Haversine formula
    haversine(a, b) {
        const R = 6371;
        const dLat = (b.lat - a.lat) * Math.PI / 180;
        const dLon = (b.lon - a.lon) * Math.PI / 180;
        const x = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
    }
}