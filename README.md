# EV Charging Points Singapore

A client-side web application that displays all Electric Vehicle (EV) charging points in Singapore on an interactive Google Map, with real-time availability status and distance-based sorting.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Google Maps](https://img.shields.io/badge/Google%20Maps-4285F4?style=flat&logo=google-maps&logoColor=white)

## Features

- **Interactive Map**: Google Maps integration with custom markers for all EV charging points
- **Real-time Data**: Fetches live data from LTA DataMall API
- **Distance Sorting**: Automatically detects user location and sorts charging points by distance
- **Availability Status**: Color-coded markers showing availability:
  - 🟢 Green: All lots available
  - 🟡 Yellow: Partial availability
  - 🔴 Red: Fully occupied
  - ⚫ Gray: Status unknown
- **Search & Filter**: Find charging points by location, postal code, or operator
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- HTML5
- CSS3 (no frameworks)
- Vanilla JavaScript
- Google Maps JavaScript API
- LTA DataMall API

## Project Structure

```
ev-charging-points-sg/
├── index.html      # Main HTML structure
├── style.css       # Styling and responsive layout
├── script.js       # Application logic
└── README.md       # Documentation
```

## Getting Started

### Prerequisites

- A modern web browser
- A local HTTP server (for API requests)

### Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/alfredang/ev-charging-points-sg.git
   cd ev-charging-points-sg
   ```

2. Set up API keys:
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys
   python generate-config.py
   ```

3. Start a local server:
   ```bash
   python3 -m http.server 8000
   ```

4. Open http://localhost:8000 in your browser

5. Allow location access when prompted (optional, for distance sorting)

## API Configuration

### Getting API Keys

**Google Maps API Key:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable the Maps JavaScript API
3. Create credentials (API key)
4. Add the key to `config.js`

**LTA DataMall API Key:**
1. Register at [LTA DataMall](https://datamall.lta.gov.sg/content/datamall/en.html)
2. Request API access
3. Add the key to `config.js`

### Configuration File

Copy `config.example.js` to `config.js` and add your keys:

```javascript
window.CONFIG_KEYS = {
    GOOGLE_MAPS_API_KEY: 'your-google-maps-key',
    LTA_API_KEY: 'your-lta-datamall-key'
};
```

**Note:** `config.js` is gitignored to prevent exposing API keys

## Distance Calculation

The application uses the **Haversine formula** to calculate the great-circle distance between the user's location and each charging point. This formula accounts for the Earth's curvature and provides accurate "as-the-crow-flies" distances.

```javascript
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
}
```

## License

MIT License

## Acknowledgements

- [LTA DataMall](https://datamall.lta.gov.sg/) for providing the EV charging point data
- [Google Maps Platform](https://developers.google.com/maps) for the mapping API
