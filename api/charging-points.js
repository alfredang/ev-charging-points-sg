/**
 * Vercel Serverless API Route
 * Proxies requests to LTA DataMall Batch API
 *
 * The Batch API returns a link to an S3 file containing all data.
 * We fetch that link, then download the actual data.
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

    if (!apiKey) {
        return res.status(500).json({
            error: 'Server configuration error',
            details: 'API key not configured'
        });
    }

    try {
        // Step 1: Get the download link from Batch API
        const batchUrl = 'https://datamall2.mytransport.sg/ltaodataservice/EVCBatch';

        const batchResponse = await fetch(batchUrl, {
            method: 'GET',
            headers: {
                'AccountKey': apiKey,
                'accept': 'application/json'
            }
        });

        if (!batchResponse.ok) {
            throw new Error(`Batch API returned ${batchResponse.status}`);
        }

        const batchData = await batchResponse.json();

        // Extract the S3 download link
        const downloadLink = batchData.value?.[0]?.Link;

        if (!downloadLink) {
            throw new Error('No download link in Batch API response');
        }

        // Step 2: Download the actual data from S3
        const dataResponse = await fetch(downloadLink);

        if (!dataResponse.ok) {
            throw new Error(`Data download failed with ${dataResponse.status}`);
        }

        const chargingPoints = await dataResponse.json();

        // Return in the expected format
        return res.status(200).json({
            value: chargingPoints
        });

    } catch (error) {
        console.error('API error:', error.message);
        return res.status(500).json({
            error: 'Failed to fetch charging points',
            details: error.message
        });
    }
}
