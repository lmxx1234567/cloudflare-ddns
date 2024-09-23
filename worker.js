/**
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const params = url.searchParams;

        // Extract parameters from the request
        const email = params.get('email');
        const apiKey = params.get('api_key');
        const record = params.get('record');
        const ip = params.get('ip');
        const ttl = params.get('ttl') || '120';

        // Validate input
        if (!email || !apiKey || !record || !ip) {
            return new Response('Missing required parameters', { status: 400 });
        }

        // Common headers for Cloudflare API requests
        const headers = {
            'X-Auth-Email': email,
            'X-Auth-Key': apiKey,
            'Content-Type': 'application/json'
        };

        try {
            // Get the domain from the record
            let domain = record;
            const recordParts = record.split('.');
            if (recordParts.length < 2) {
                return new Response('Invalid record format', { status: 400 });
            }
            // If the record is exactly 2 parts, it's a root domain
            if (recordParts.length > 2) {
                domain = recordParts.slice(1).join('.');
            }
            // Cloudflare API endpoint for zones
            const cloudflareZoneApiUrl = `https://api.cloudflare.com/client/v4/zones?name=${domain}`;

            // Fetch the zone information to get the ZONE_ID
            const zoneResponse = await fetch(cloudflareZoneApiUrl, {
                method: 'GET',
                headers,
                signal: AbortSignal.timeout(5000)
            });

            const zoneData = await zoneResponse.json();
            if (!zoneData.success || zoneData.result.length === 0) {
                return new Response('Failed to fetch Zone ID for the domain', { status: 404 });
            }

            const zoneId = zoneData.result[0].id;

            // Cloudflare API endpoint for DNS records
            const cloudflareDnsApiUrl = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`;

            // Fetch the list of DNS records to find the one to update
            const dnsRecordsResponse = await fetch(`${cloudflareDnsApiUrl}?name=${record}.${domain}`, {
                method: 'GET',
                headers,
                signal: AbortSignal.timeout(5000)
            });

            const dnsRecords = await dnsRecordsResponse.json();
            if (!dnsRecords.success) {
                return new Response('Found DNS records error', { status: 500 });
            }

            if (dnsRecords.result.length === 0) {
                // No DNS record found, create a new one
                const createResponse = await fetch(cloudflareDnsApiUrl, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({
                        type: 'A',
                        name: `${record}.${domain}`,
                        content: ip,
                        ttl: parseInt(ttl),
                        proxied: false
                    }),
                    signal: AbortSignal.timeout(5000)
                });

                const createResult = await createResponse.json();
                if (!createResult.success) {
                    return new Response('Failed to create DNS record', { status: 500 });
                }
            } else {
                const recordId = dnsRecords.result[0].id;

                // Update the DNS record with the new IP
                const updateResponse = await fetch(`${cloudflareDnsApiUrl}/${recordId}`, {
                    method: 'PUT',
                    headers,
                    body: JSON.stringify({
                        type: 'A',
                        name: `${record}.${domain}`,
                        content: ip,
                        ttl: parseInt(ttl),
                        proxied: false
                    }),
                    signal: AbortSignal.timeout(5000)
                });

                const updateResult = await updateResponse.json();
                if (!updateResult.success) {
                    return new Response('Failed to update DNS record', { status: 500 });
                }
            }

            return new Response('DNS record updated successfully', { status: 200 });
        } catch (error) {
            console.error('Error processing request:', error);
            return new Response('Internal Server Error', { status: 500 });
        }
    },
};
