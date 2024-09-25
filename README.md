# cloudflare-ddns
Cloudflare DDNS for QNAP and Synology NAS. Based on Cloudflare Worker or other Serverless functions.

With this small but nice interface, it is possible to host your own api to use Cloudflare domains for your DynDNS on QNAP or Synology NAS systems

The API responds with JSON and matching status codes for QNAP and Synology systems


------------

Required information:
- Cloudflare Account email
- Cloudflare [Global API Key](https://dash.cloudflare.com/profile/api-tokens "Global API Key") *(not Origin CA Key)* 
- Cloudflare Domain *(like `example.com`)*
- DNS Record *(like `my-ddns.example.com`)*

------------
## Cloudflare Worker
### Setup
1. Go to [Cloudflare Workers](https://workers.cloudflare.com/) and create a new Worker
2. Copy the content of `worker.js` into the editor
3. Click `Save and Deploy`
## Usage
### DynDNS for QNAP NAS
`Network- and Virtual Switch` -> `DDNS` -> `Add` -> `Select DNS server: Customized`

![QNAP DDNS](https://raw.githubusercontent.com/lmxx1234567/cloudflare-ddns/main/images/qnap-ddns.png "QNAP DDNS")

- Username: Your Cloudflare Account email
- Password: Your Cloudflare Global API Key
- Hostname: Your DNS Record *(like `my-ddns.example.com`)*
- URL: Tell your QNAP how to assemble the URL *(see below)*

```
https://your.cloudflare.worker.host/route/to/worker?email=%USER%&api_key=%PASS%&record=%HOST%&ip=%IP%&ttl=120
```
if you use cloudfare worker default host. the route is `\`
------------

### DynDNS for Synology NAS
`System Controls` -> `External Access` -> `Customize`

![Synology DDNS Provider](https://raw.githubusercontent.com/fbrettnich/cloudflare-dyndns-php/main/.github/images/synology-ddns-provider.png "Synology DDNS Provider")

`System Controls` -> `External Access` -> `Add`

![Synology DDNS](https://raw.githubusercontent.com/fbrettnich/cloudflare-dyndns-php/main/.github/images/synology-ddns.png "Synology DDNS")

```
https://your.cloudflare.worker.host/route/to/worker?email=__USERNAME__&api_key=__PASSWORD__&record=__HOSTNAME__&ip=__MYIP__&ttl=120
```
------------

### DynDNS for Linux
cURL Command
```bash
curl 'https://your.cloudflare.worker.host/route/to/worker?email=cloudflare@email.com&api_key=XXXX&record=my-ddns.example.com&ip=$(curl -s https://ipinfo.io/ip)&ttl=120'
```

Cronjob *every 5 minutes*
```bash
*/5 * * * * curl 'https://your.cloudflare.worker.host/route/to/worker?email=cloudflare@email.com&api_key=XXXX&record=my-ddns.example.com&ip=$(curl -s https://ipinfo.io/ip)&ttl=120' >/dev/null 2>&1
```

To get your public IP address you can use the following cURL command:
```bash
curl https://ipinfo.io/ip
```
## TODO
- [x] Add support for custom DNS settings like `proxied` or `auto_ttl`
- [ ] Add support for automatic SSL certificate renewal

## License
[MIT](LICENSE)

## Credits
This project is based on [fbrettnich/cloudflare-dyndns-php](https://github.com/fbrettnich/cloudflare-dyndns-php)