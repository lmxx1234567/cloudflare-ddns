# cloudflare-ddns
Cloudflare DDNS for QNAP and Synology NAS. Based on Cloudflare Worker or other Serverless functions.

With this small but nice interface, it is possible to host your own api to use Cloudflare domains for your DynDNS on QNAP or Synology NAS systems<br>
The API responds with JSON and matching status codes for QNAP and Synology systems


------------

Required information:
- Cloudflare Account email
- Cloudflare [Global API Key](https://dash.cloudflare.com/profile/api-tokens "Global API Key") *(not Origin CA Key)* 
- Cloudflare Domain *(like `example.com`)*
- DNS Record *(like `my-ddns.example.com`)*

------------

### DynDNS for QNAP NAS
`Network- and Virtual Switch` -> `DDNS` -> `Add` -> `Select DNS server: Customized`

![QNAP DDNS](https://raw.githubusercontent.com/fbrettnich/cloudflare-dyndns-php/main/.github/images/qnap-ddns.png "QNAP DDNS")

```
https://api.example.com/ddns?email=%USER%&api_key=%PASS%&domain=example.com&record=%HOST%&ip=%IP%&ttl=120
```
------------

### DynDNS for Synology NAS
`System Controls` -> `External Access` -> `Customize`

![Synology DDNS Provider](https://raw.githubusercontent.com/fbrettnich/cloudflare-dyndns-php/main/.github/images/synology-ddns-provider.png "Synology DDNS Provider")

`System Controls` -> `External Access` -> `Add`

![Synology DDNS](https://raw.githubusercontent.com/fbrettnich/cloudflare-dyndns-php/main/.github/images/synology-ddns.png "Synology DDNS")

```
https://api.example.com/ddns?email=__USERNAME__&api_key=__PASSWORD__&domain=example.com&record=__HOSTNAME__&ip=__MYIP__&ttl=120
```
------------

### DynDNS for Linux
cURL Command
```bash
curl 'https://api.example.com/ddns?email=cloudflare@email.com&api_key=XXXX&domain=example.com&record=my-ddns.example.com&ip=1.1.1.1&ttl=120'
```

Cronjob *every 5 minutes*
```bash
*/5 * * * * curl -s 'https://api.example.com/ddns?email=cloudflare@email.com&api_key=XXXX&domain=example.com&record=my-ddns.example.com&ip=1.1.1.1&ttl=120' >/dev/null 2>&1
```

To get your public IP address you can use the following cURL command:
```bash
curl https://ipinfo.io/ip
```
