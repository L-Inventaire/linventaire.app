import { BlockList, isIP } from "net";
import NodeCache from "node-cache";
import platform from "../../../platform";
import {
  BadRequestError,
  Context,
  createContext,
  ForbiddenError,
} from "../../../types";
import Clients, { ClientsDefinition, Security } from "../entities/clients";

export const IP_NOT_ALLOWED = "IP_NOT_ALLOWED";

// Remove IPv4-mapped IPv6 prefix and zone ids so "::ffff:1.2.3.4" matches "1.2.3.4"
export const normalizeIp = (ip?: string | null) => {
  let value = (ip || "").trim().split("%")[0];
  if (/^::ffff:\d+\.\d+\.\d+\.\d+$/i.test(value)) {
    value = value.replace(/^::ffff:/i, "");
  }
  return value;
};

// Accepts "1.2.3.4", "1.2.3.0/24", "2001:db8::1" or "2001:db8::/32"
// Returns the normalized entry or null if invalid
export const parseIpEntry = (entry: string): string | null => {
  const [rawAddress, rawPrefix, ...rest] = (entry || "").trim().split("/");
  if (rest.length) return null;
  const address = normalizeIp(rawAddress);
  const version = isIP(address);
  if (!version) return null;
  if (rawPrefix === undefined) return address;
  if (!/^\d{1,3}$/.test(rawPrefix)) return null;
  const prefix = parseInt(rawPrefix);
  if (prefix > (version === 4 ? 32 : 128)) return null;
  return `${address}/${prefix}`;
};

export const sanitizeSecurity = (
  security?: Partial<Security> | null
): Security => {
  const allowed = security?.ip_restriction?.allowed_ips || [];
  const invalid = allowed.filter((entry) => !parseIpEntry(entry));
  if (invalid.length) {
    throw BadRequestError(`Invalid IP addresses: ${invalid.join(", ")}`);
  }
  return {
    ip_restriction: {
      enabled: !!security?.ip_restriction?.enabled,
      allowed_ips: Array.from(new Set(allowed.map(parseIpEntry))),
    },
  };
};

export const isIpAllowed = (ip: string | undefined, allowedIps: string[]) => {
  const address = normalizeIp(ip);
  const version = isIP(address);
  if (!version) return false;

  const list = new BlockList();
  for (const entry of allowedIps) {
    const parsed = parseIpEntry(entry);
    if (!parsed) continue;
    const [value, prefix] = parsed.split("/");
    const type = isIP(value) === 6 ? "ipv6" : "ipv4";
    if (prefix === undefined) list.addAddress(value, type);
    else list.addSubnet(value, parseInt(prefix), type);
  }
  return list.check(address, version === 6 ? "ipv6" : "ipv4");
};

const cache = new NodeCache({ stdTTL: 60 });

export const invalidateClientSecurityCache = (clientId: string) => {
  cache.del(clientId);
};

const getClientSecurity = async (clientId: string): Promise<Security> => {
  let security = cache.get<Security>(clientId);
  if (!security) {
    const db = await platform.Db.getService();
    const client = await db.selectOne<Clients>(
      createContext(),
      ClientsDefinition.name,
      { id: clientId },
      {}
    );
    security = client?.security || ({} as Security);
    cache.set(clientId, security);
  }
  return security;
};

// Owners (CLIENT_MANAGE) are never restricted so they can't lock themselves out
export const checkIpAccessOrThrow = async (
  ctx: Context,
  clientId: string,
  userRoles: string[]
) => {
  if (ctx.role === "SYSTEM") return;
  if (userRoles.includes("CLIENT_MANAGE")) return;

  const restriction = (await getClientSecurity(clientId))?.ip_restriction;
  if (!restriction?.enabled) return;

  if (!isIpAllowed(ctx.ip, restriction.allowed_ips || [])) {
    throw {
      ...ForbiddenError(
        `${IP_NOT_ALLOWED}: access from ${
          normalizeIp(ctx.ip) || "unknown IP"
        } is not allowed for this company`
      ),
      code: IP_NOT_ALLOWED,
    };
  }
};
