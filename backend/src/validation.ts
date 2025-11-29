import net from 'net';

const PRIVATE_V4 = [
  { base: '10.0.0.0', mask: 8 },
  { base: '127.0.0.0', mask: 8 },
  { base: '172.16.0.0', mask: 12 },
  { base: '192.168.0.0', mask: 16 },
  { base: '169.254.0.0', mask: 16 }
];

function ipv4ToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0);
}

function isPrivateV4(ip: string): boolean {
  const ipInt = ipv4ToInt(ip);
  return PRIVATE_V4.some(({ base, mask }) => {
    const baseInt = ipv4ToInt(base);
    const maskInt = mask === 0 ? 0 : ~((1 << (32 - mask)) - 1) >>> 0;
    return (ipInt & maskInt) === (baseInt & maskInt);
  });
}

function isPrivateV6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  return (
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe80:')
  );
}

export function validateHost(host: string): { valid: boolean; reason?: string } {
  if (!host || !host.trim()) {
    return { valid: false, reason: 'Host is required.' };
  }

  const trimmed = host.trim();
  if (trimmed.toLowerCase() === 'localhost') {
    return { valid: false, reason: 'Localhost is not allowed.' };
  }

  if (/[^\w\-\.]/.test(trimmed)) {
    return { valid: false, reason: 'Host contains invalid characters.' };
  }

  const ipVersion = net.isIP(trimmed);
  if (ipVersion === 4 && isPrivateV4(trimmed)) {
    return { valid: false, reason: 'Private IPv4 addresses are not allowed.' };
  }

  if (ipVersion === 6 && isPrivateV6(trimmed)) {
    return { valid: false, reason: 'Private IPv6 addresses are not allowed.' };
  }

  if (trimmed.endsWith('.local')) {
    return { valid: false, reason: 'Local network domains are not allowed.' };
  }

  return { valid: true };
}
