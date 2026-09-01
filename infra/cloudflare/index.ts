import * as cloudflare from '@pulumi/cloudflare';
import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config();
const accountId = config.require('accountId');
const zoneId = config.require('zoneId');
const pagesProjectName = config.require('pagesProjectName');
/** Zone RUM is shared; only enable when this stack owns the zone's analytics site. */
const enableWebAnalytics = config.getBoolean('enableWebAnalytics') ?? false;

/** Cloudflare documentation / sinkhole address for proxied redirect-only hosts. */
const REDIRECT_SINKHOLE_IPV4 = '192.0.2.1';

/** Subdomain hostnames attached to the Pages project (existing zone assumed). */
function resolvePagesHostnames(): string[] {
  const listed = config.getObject<string[]>('pagesHostnames');
  if (listed && listed.length > 0) return listed;
  throw new Error(
    'Set pagesHostnames to a JSON array of subdomains, e.g. ["steerco.mzworthington.co.uk"]',
  );
}

/** Former hostnames that 301 to the first pagesHostname (path + query preserved). */
function resolveLegacyRedirectHostnames(): string[] {
  return config.getObject<string[]>('legacyRedirectHostnames') ?? [];
}

const pagesHostnames = resolvePagesHostnames();
const legacyRedirectHostnames = resolveLegacyRedirectHostnames();
const canonicalHost = pagesHostnames[0];
if (!canonicalHost) {
  throw new Error('pagesHostnames must include at least one canonical hostname');
}

const pagesProject = new cloudflare.PagesProject('site', {
  accountId,
  name: pagesProjectName,
  productionBranch: 'main',
});

for (const hostname of pagesHostnames) {
  const safe = hostname.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');
  const dns = new cloudflare.DnsRecord(
    `pages-dns-${safe}`,
    {
      zoneId,
      name: hostname,
      type: 'CNAME',
      content: pagesProject.subdomain,
      proxied: true,
      ttl: 1,
      comment: 'Cloudflare Pages',
    },
    { deleteBeforeReplace: true },
  );

  new cloudflare.PagesDomain(
    `pages-domain-${safe}`,
    {
      accountId,
      projectName: pagesProject.name,
      name: hostname,
    },
    { dependsOn: [dns] },
  );

  new cloudflare.ObservatoryScheduledTest(`observatory-${safe}`, {
    zoneId,
    url: hostname,
  });
}

/** Proxied DNS stubs + zone Single Redirect for renamed product hostnames. */
if (legacyRedirectHostnames.length > 0) {
  for (const hostname of legacyRedirectHostnames) {
    const safe = hostname.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '');
    new cloudflare.DnsRecord(
      `legacy-redirect-dns-${safe}`,
      {
        zoneId,
        name: hostname,
        type: 'A',
        content: REDIRECT_SINKHOLE_IPV4,
        proxied: true,
        ttl: 1,
        comment: 'Legacy hostname redirect stub',
      },
      { deleteBeforeReplace: true },
    );
  }

  new cloudflare.Ruleset('legacy-hostname-redirects', {
    zoneId,
    name: `${pagesProjectName}-legacy-hostname-redirects`,
    description: `301 legacy product hostnames to https://${canonicalHost}`,
    kind: 'zone',
    phase: 'http_request_dynamic_redirect',
    rules: legacyRedirectHostnames.map((hostname, index) => ({
      ref: `legacy-host-${index}`,
      description: `Redirect ${hostname} → ${canonicalHost}`,
      expression: `http.host eq "${hostname}"`,
      action: 'redirect' as const,
      enabled: true,
      actionParameters: {
        fromValue: {
          statusCode: 301,
          preserveQueryString: true,
          targetUrl: {
            expression: `concat("https://${canonicalHost}", http.request.uri.path)`,
          },
        },
      },
    })),
  });
}

const zone = cloudflare.getZoneOutput({ zoneId });

/** Zone-owner RUM only. Shared-zone hosts reuse the apex `autoInstall` site. */
const webAnalytics = enableWebAnalytics
  ? new cloudflare.WebAnalyticsSite('web-analytics', {
      accountId,
      zoneTag: zoneId,
      autoInstall: true,
      enabled: true,
    })
  : undefined;

export const pagesProjectNameOut = pagesProject.name;
export const pagesSubdomain = pagesProject.subdomain;
export const pagesHostnamesOut = pagesHostnames;
export const legacyRedirectHostnamesOut = legacyRedirectHostnames;
export const zoneName = zone.name;
/** Present only when `enableWebAnalytics` is true. */
export const webAnalyticsSiteTag = webAnalytics?.siteTag ?? null;
export const webAnalyticsSiteToken = webAnalytics?.siteToken ?? null;
