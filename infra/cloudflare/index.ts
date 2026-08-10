import * as cloudflare from '@pulumi/cloudflare';
import * as pulumi from '@pulumi/pulumi';

const config = new pulumi.Config();
const accountId = config.require('accountId');
const zoneId = config.require('zoneId');
const pagesProjectName = config.require('pagesProjectName');
/** Zone RUM is shared; only enable when this stack owns the zone's analytics site. */
const enableWebAnalytics = config.getBoolean('enableWebAnalytics') ?? false;

/** Subdomain hostnames attached to the Pages project (existing zone assumed). */
function resolvePagesHostnames(): string[] {
  const listed = config.getObject<string[]>('pagesHostnames');
  if (listed && listed.length > 0) return listed;
  throw new Error(
    'Set pagesHostnames to a JSON array of subdomains, e.g. ["steerlens.mzworthington.co.uk"]',
  );
}

const pagesHostnames = resolvePagesHostnames();

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

const zone = cloudflare.getZoneOutput({ zoneId });

/** RUM beacon auto-injected for orange-clouded hosts on this zone (opt-in). */
const webAnalytics = enableWebAnalytics
  ? new cloudflare.WebAnalyticsSite('web-analytics', {
      accountId,
      zoneTag: zoneId,
      autoInstall: true,
    })
  : undefined;

export const pagesProjectNameOut = pagesProject.name;
export const pagesSubdomain = pagesProject.subdomain;
export const pagesHostnamesOut = pagesHostnames;
export const zoneName = zone.name;
/** Present only when `enableWebAnalytics` is true. */
export const webAnalyticsSiteTag = webAnalytics?.siteTag ?? null;
