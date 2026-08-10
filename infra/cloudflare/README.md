# Cloudflare infrastructure (Pulumi)

Pages project + custom **subdomain** hostnames on an existing active zone, plus Web Analytics (RUM) and Observatory scheduled tests. The SPA is built in CI and deployed with `wrangler pages deploy`.

Real zone/hostname values live in gitignored `Pulumi.<stack>.yaml`, local `.env`, or GitHub Actions vars; see [Custom domains](../../docs/custom-domains.md) and [secrets checklist](../../docs/cloudflare-secrets.md).

| Resource | Purpose |
|----------|---------|
| `PagesProject` | Direct-upload Pages project |
| `DnsRecord` / `PagesDomain` | Proxied CNAME + hostname binding per `pagesHostnames` entry |
| `WebAnalyticsSite` | Zone RUM / Web Analytics (`autoInstall`) |
| `ObservatoryScheduledTest` | Synthetic Speed test per Pages hostname |

If Web Analytics or Observatory was enabled in the dashboard first, import before `pulumi up`:

```bash
pulumi import 'cloudflare:index/webAnalyticsSite:WebAnalyticsSite' web-analytics '<account_id>/<site_id>'
pulumi import 'cloudflare:index/observatoryScheduledTest:ObservatoryScheduledTest' observatory-<safe-hostname> '<zone_id>/<url>'
```

## Quick setup

```bash
# Prefer BWS; or cp ../../.env.example ../../.env and edit DOMAIN / PAGES_*
export BWS_ACCESS_TOKEN=... BWS_PROJECT_ID=...
export DOMAIN=example.com PAGES_HOSTNAMES=app.example.com
export PAGES_PROJECT_NAME=my-app PULUMI_STACK=prod
../../bin/setup-cloudflare-hosting.sh
pulumi up
```

Or merge to `main`. `.github/workflows/pulumi-cloudflare.yml` is a thin caller of the edge-dns reusable workflow (preview → **pulumi-prod** → `up`).

## Related

| Path                       | Purpose                                   |
| -------------------------- | ----------------------------------------- |
| `wrangler.toml`            | Pages project name + `app/dist` output    |
| `app/public/_redirects`    | SPA routing                               |
| `.github/workflows/ci.yml` | Build + wrangler deploy                   |
| `bin/setup-cloudflare-hosting.sh` | Thin shim → edge-dns bootstrap     |
