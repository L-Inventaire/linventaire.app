import config from "config";
import crypto from "crypto";
import dns from "dns/promises";
import { BlockList, isIP } from "net";

export const WEBHOOK_SECRET_PREFIX = "whsec_";

export const generateWebhookSecret = () =>
  WEBHOOK_SECRET_PREFIX + crypto.randomBytes(32).toString("base64url");

/**
 * Signature sent in the X-Linventaire-Signature header: "t={timestamp},v1={hmac}"
 * where hmac = HMAC-SHA256(secret, "{timestamp}.{body}") in hex.
 * Receivers must recompute it and check the timestamp to prevent replays.
 */
export const signWebhookPayload = (
  secret: string,
  body: string,
  timestamp = Math.floor(Date.now() / 1000)
) => {
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");
  return `t=${timestamp},v1=${signature}`;
};

// Webhooks must never be used to reach our own infrastructure (SSRF)
const privateNetworks = new BlockList();
[
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
].forEach(([address, prefix]) =>
  privateNetworks.addSubnet(address as string, prefix as number, "ipv4")
);
[
  ["::", 128],
  ["::1", 128],
  ["64:ff9b::", 96],
  ["100::", 64],
  ["2001:db8::", 32],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
].forEach(([address, prefix]) =>
  privateNetworks.addSubnet(address as string, prefix as number, "ipv6")
);

export const isPrivateAddress = (address: string) => {
  let value = address.replace(/^\[|\]$/g, "").split("%")[0];
  // IPv4-mapped IPv6 addresses ("::ffff:127.0.0.1")
  const mapped = value.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) value = mapped[1];
  const version = isIP(value);
  if (!version) return true;
  if (version === 6 && /^::ffff:/i.test(value)) return true;
  return privateNetworks.check(value, version === 6 ? "ipv6" : "ipv4");
};

const allowPrivateNetworks = () => {
  const value = config.has("webhooks.allow_private_networks")
    ? config.get<string | boolean>("webhooks.allow_private_networks")
    : false;
  return value === true || value === "true";
};

const allowInsecureHttp = () =>
  allowPrivateNetworks() || process.env.NODE_ENV !== "production";

/**
 * Returns an error message if the url can't be used as a webhook, null otherwise.
 * Checked when the webhook is saved and before each delivery (DNS can change).
 */
export const getWebhookUrlError = async (
  value: string,
  resolve: (hostname: string) => Promise<{ address: string }[]> = (hostname) =>
    dns.lookup(hostname, { all: true, verbatim: true })
): Promise<string | null> => {
  let url: URL;
  try {
    url = new URL(value);
  } catch (e) {
    return "Invalid url";
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return "The url must use https";
  }
  if (url.protocol === "http:" && !allowInsecureHttp()) {
    return "The url must use https";
  }
  if (url.username || url.password) {
    return "Credentials are not allowed in the url";
  }
  if (value.length > 2000) return "The url is too long";

  if (allowPrivateNetworks()) return null;

  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return "The url must point to a public address";
  }

  let addresses: string[] = [];
  if (isIP(hostname)) {
    addresses = [hostname];
  } else {
    try {
      addresses = (await resolve(hostname)).map((a) => a.address);
    } catch (e) {
      return `Unable to resolve ${hostname}`;
    }
  }
  if (!addresses.length) return `Unable to resolve ${hostname}`;
  if (addresses.some(isPrivateAddress)) {
    return "The url must point to a public address";
  }
  return null;
};
