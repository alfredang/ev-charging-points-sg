/**
 * Vercel Serverless API Route
 * Proxies requests to LTA DataMall API to avoid CORS issues
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

    const skip = req.query.skip || 0;
    const apiUrl = `https://datamall2.mytransport.sg/ltaodataservice/EVChargingPoints?$skip=${skip}`;

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'AccountKey': process.env.LTA_API_KEY,
                'accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`LTA API returned ${response.status}`);
        }

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('API proxy error:', error);
        return res.status(500).json({ error: 'Failed to fetch charging points' });
    }
}
