import dns from 'dns/promises';
import { DnsResult } from './types';

export async function resolveHost(host: string): Promise<DnsResult> {
  const result: DnsResult = { A: [], AAAA: [], CNAME: [] };
  try {
    result.A = await dns.resolve4(host);
  } catch (error) {
    result.A = [];
  }

  try {
    result.AAAA = await dns.resolve6(host);
  } catch (error) {
    result.AAAA = [];
  }

  try {
    result.CNAME = await dns.resolveCname(host);
  } catch (error) {
    result.CNAME = [];
  }

  return result;
}
