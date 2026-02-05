# EV Charging Points Singapore

A web application that displays all Electric Vehicle (EV) charging points in Singapore on an interactive Google Map, with real-time availability status and distance-based sorting.

**[Live Demo](https://ev-charging-points-sg.vercel.app)**

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Google Maps](https://img.shields.io/badge/Google%20Maps-4285F4?style=flat&logo=google-maps&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat&logo=vercel&logoColor=white)

## Features

- **Interactive Map**: Google Maps with custom teardrop markers for all EV charging points
- **Real-time Data**: Live data from LTA DataMall Batch API
- **Distance Sorting**: Automatically detects user location and sorts charging points by distance
- **Availability Status**: Color-coded markers:
  - 🟢 Green: Available
  - 🟠 Orange: Partial availability
  - 🔴 Red: Fully occupied
  - ⚫ Gray: Status unknown
- **Search & Filter**: Find by location, postal code, or operator
- **Responsive Design**: Works on desktop and mobile
- **Click Interaction**: Click sidebar items to pan map and show info window

## Tech Stack

- HTML5, CSS3, Vanilla JavaScript
- Google Maps JavaScript API
- LTA DataMall Batch API (EVCBatch)
- Vercel Serverless Functions (API proxy)

## Project Structure

```
ev-charging-points-sg/
├── index.html              # Main HTML structure
├── style.css               # Styling and responsive layout
├── script.js               # Frontend application logic
├── api/
│   └── charging-points.js  # Vercel serverless API proxy
├── scripts/
│   └── generate-config.js  # Build script for API keys
├── config.example.js       # Template for API keys
├── vercel.json             # Vercel deployment config
└── package.json            # Project configuration
```

## Getting Started

### Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/alfredang/ev-charging-points-sg.git
   cd ev-charging-points-sg
   ```

2. Set up API keys:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   python generate-config.py
   ```

3. Start a local server:
   ```bash
   python3 -m http.server 8000
   ```

4. Open http://localhost:8000

### API Keys Required

**Google Maps API Key:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Maps JavaScript API
3. Create an API key with HTTP referrer restrictions

**LTA DataMall API Key:**
1. Register at [LTA DataMall](https://datamall.lta.gov.sg/content/datamall/en.html)
2. Request API access

## Deployment (Vercel)

This app is deployed on Vercel with serverless functions to proxy LTA API requests (avoiding CORS issues).

1. Import repository to [Vercel](https://vercel.com)
2. Add environment variables:
   - `GOOGLE_MAPS_API_KEY`
   - `LTA_API_KEY`
3. Deploy

The serverless function at `/api/charging-points` handles:
- Fetching the S3 download link from LTA Batch API
- Downloading and transforming the charging point data
- Returning normalized data to the frontend

## Distance Calculation

Uses the **Haversine formula** for accurate great-circle distance:

```javascript
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}
```

## License

MIT License

## Acknowledgements

- [LTA DataMall](https://datamall.lta.gov.sg/) for EV charging point data
- [Google Maps Platform](https://developers.google.com/maps) for mapping API
- [Vercel](https://vercel.com) for hosting and serverless functions
