/**
 * Vercel Serverless API Route
 * Proxies requests to LTA DataMall Batch API
 */

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const apiKey = process.env.LTA_API_KEY;

    // Debug: Check if API key is set
    if (!apiKey) {
        console.error('LTA_API_KEY environment variable is not set');
        return res.status(500).json({
            error: 'Server configuration error',
            details: 'API key not configured'
        });
    }

    // Use Batch API - returns all data in single request
    const apiUrl = 'https://datamall2.mytransport.sg/ltaodataservice/EVCBatch';

    try {
        console.log('Fetching from:', apiUrl);

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'AccountKey': apiKey,
                'accept': 'application/json'
            }
        });

        console.log('LTA API response status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('LTA API error response:', errorText);
            return res.status(response.status).json({
                error: 'LTA API error',
                status: response.status,
                details: errorText
            });
        }

        const data = await response.json();
        console.log('Data received, records:', data.value?.length || 0);

        return res.status(200).json(data);
    } catch (error) {
        console.error('API proxy error:', error);
        return res.status(500).json({
            error: 'Failed to fetch charging points',
            details: error.message
        });
    }
}
