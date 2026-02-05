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

    // Use Batch API - returns all data in single request
    const apiUrl = 'https://datamall2.mytransport.sg/ltaodataservice/EVCBatch';

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'AccountKey': process.env.LTA_API_KEY,
                'accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('LTA API error:', response.status, errorText);
            throw new Error(`LTA API returned ${response.status}`);
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('API proxy error:', error.message);
        return res.status(500).json({
            error: 'Failed to fetch charging points',
            details: error.message
        });
    }
}
