/**
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

async function getZoneId(domain, headers) {
    const cloudflareZoneApiUrl = `https://api.cloudflare.com/client/v4/zones?name=${domain}`;
    const zoneResponse = await fetch(cloudflareZoneApiUrl, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(5000)
    });
    const zoneData = await zoneResponse.json();
    if (!zoneData.success || zoneData.result.length === 0) {
        throw new Error('Failed to fetch Zone ID for the domain');
    }
    return zoneData.result[0].id;
}

async function getDnsRecordId(cloudflareDnsApiUrl, record, headers) {
    const dnsRecordsResponse = await fetch(`${cloudflareDnsApiUrl}?name=${record}`, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(5000)
    });
    const dnsRecords = await dnsRecordsResponse.json();
    if (!dnsRecords.success) {
        throw new Error('Found DNS records error');
    }
    return dnsRecords.result.length > 0 ? dnsRecords.result[0].id : null;
}

async function createDnsRecord(cloudflareDnsApiUrl, updateDNSRequest, headers) {
    const createResponse = await fetch(cloudflareDnsApiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(updateDNSRequest),
        signal: AbortSignal.timeout(5000)
    });
    const createResult = await createResponse.json();
    if (!createResult.success) {
        throw new Error('Failed to create DNS record');
    }
}

async function updateDnsRecord(cloudflareDnsApiUrl, recordId, updateDNSRequest, headers) {
    const updateResponse = await fetch(`${cloudflareDnsApiUrl}/${recordId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updateDNSRequest),
        signal: AbortSignal.timeout(5000)
    });
    const updateResult = await updateResponse.json();
    if (!updateResult.success) {
        throw new Error('Failed to update DNS record');
    }
}

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const params = url.searchParams;

        // Extract parameters from the request
        const email = params.get('email');
        const apiKey = params.get('api_key');
        let record = params.get('record');
        const ip = params.get('ip');
        const ttl = params.get('ttl') || '1'; // Setting to 1 means 'automatic'.
        const proxied = params.get('proxied') || 'false';

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
                record = recordParts[0];
            } else {
                record = '@';
            }

            const zoneId = await getZoneId(domain, headers);
            const cloudflareDnsApiUrl = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`;
            const recordId = await getDnsRecordId(cloudflareDnsApiUrl, `${record}.${domain}`, headers);

            const updateDNSRequest = {
                type: ip.includes(':') ? 'AAAA' : 'A', // Get DNS type by IP type
                name: `${record}.${domain}`,
                content: ip,
                ttl: parseInt(ttl),
                proxied: proxied === 'true'
            };

            if (recordId) {
                await updateDnsRecord(cloudflareDnsApiUrl, recordId, updateDNSRequest, headers);
            } else {
                await createDnsRecord(cloudflareDnsApiUrl, updateDNSRequest, headers);
            }

            return new Response('DNS record updated successfully', { status: 200 });
        } catch (error) {
            console.error('Error processing request:', error);
            return new Response('Internal Server Error', { status: 500 });
        }
    },
};