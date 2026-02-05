/**
 * Vercel Serverless API Route
 * Proxies requests to LTA DataMall Batch API
 */

export default async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
        // Step 1: Get download link from Batch API
        const batchUrl = 'https://datamall2.mytransport.sg/ltaodataservice/EVCBatch';

        const batchResponse = await fetch(batchUrl, {
            headers: {
                'AccountKey': apiKey,
                'accept': 'application/json'
            }
        });

        if (!batchResponse.ok) {
            throw new Error(`Batch API returned ${batchResponse.status}`);
        }

        const batchData = await batchResponse.json();
        const downloadLink = batchData.value?.[0]?.Link;

        if (!downloadLink) {
            throw new Error('No download link in response');
        }

        // Step 2: Download actual data from S3
        const dataResponse = await fetch(downloadLink);

        if (!dataResponse.ok) {
            throw new Error(`S3 download failed: ${dataResponse.status}`);
        }

        const rawData = await dataResponse.json();

        // Step 3: Transform data to expected format
        // The S3 data has evLocationsData array with nested chargingPoints
        const locations = rawData.evLocationsData || [];

        const transformedData = locations.map(loc => {
            // Count available chargers
            let totalLots = 0;
            let availableLots = 0;

            if (loc.chargingPoints) {
                loc.chargingPoints.forEach(cp => {
                    if (cp.plugTypes) {
                        cp.plugTypes.forEach(pt => {
                            if (pt.evIds) {
                                totalLots += pt.evIds.length;
                                pt.evIds.forEach(ev => {
                                    // status "1" means available
                                    if (ev.status === "1") {
                                        availableLots++;
                                    }
                                });
                            }
                        });
                    }
                });
            }

            // Get operator from first charging point
            const operator = loc.chargingPoints?.[0]?.operator || '';
            const chargerType = loc.chargingPoints?.[0]?.plugTypes?.[0]?.plugType || '';

            return {
                AddressInfo: loc.name || loc.address,
                PostalCode: loc.postalCode || '',
                Operator: operator,
                Type: chargerType,
                Latitude: String(loc.latitude),
                Longitude: String(loc.longtitude), // Note: API has typo "longtitude"
                TotalLots: totalLots,
                AvailableLots: availableLots
            };
        });

        return res.status(200).json({
            value: transformedData,
            lastUpdated: rawData.LastUpdatedTime
        });

    } catch (error) {
        console.error('API error:', error.message);
        return res.status(500).json({
            error: 'Failed to fetch charging points',
            details: error.message
        });
    }
}
