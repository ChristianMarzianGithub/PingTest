import * as dns from 'dns/promises';
import { resolveHost } from '../src/dns';

jest.mock('dns/promises');

const mockedDns = dns as jest.Mocked<typeof dns>;

describe('resolveHost', () => {
  beforeEach(() => {
    mockedDns.resolve4.mockResolvedValue(['1.1.1.1']);
    mockedDns.resolve6.mockResolvedValue(['2606:4700:4700::1111']);
    mockedDns.resolveCname.mockResolvedValue(['example.cdn.net']);
  });

  it('aggregates dns results', async () => {
    const result = await resolveHost('cloudflare.com');
    expect(result).toEqual({
      A: ['1.1.1.1'],
      AAAA: ['2606:4700:4700::1111'],
      CNAME: ['example.cdn.net']
    });
  });

  it('returns empty arrays on errors', async () => {
    mockedDns.resolve4.mockRejectedValueOnce(new Error('no A'));
    mockedDns.resolve6.mockRejectedValueOnce(new Error('no AAAA'));
    mockedDns.resolveCname.mockRejectedValueOnce(new Error('no CNAME'));
    const result = await resolveHost('cloudflare.com');
    expect(result).toEqual({ A: [], AAAA: [], CNAME: [] });
  });
});
