import { calculateJitter, calculatePacketLoss, parseSummary, parseTimes, parseTtl } from '../src/ping';

describe('ping parsing', () => {
  const sampleOutput = `PING google.com (142.250.185.14) 56(84) bytes of data.
64 bytes from lhr25s36-in-f14.1e100.net (142.250.185.14): icmp_seq=1 ttl=118 time=12.3 ms
64 bytes from lhr25s36-in-f14.1e100.net (142.250.185.14): icmp_seq=2 ttl=118 time=14.1 ms
64 bytes from lhr25s36-in-f14.1e100.net (142.250.185.14): icmp_seq=3 ttl=118 time=16.0 ms
64 bytes from lhr25s36-in-f14.1e100.net (142.250.185.14): icmp_seq=4 ttl=118 time=13.7 ms

--- google.com ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3003ms
rtt min/avg/max/mdev = 12.345/14.025/16.012/1.234 ms`;

  it('parses times correctly', () => {
    expect(parseTimes(sampleOutput)).toEqual([12.3, 14.1, 16.0, 13.7]);
  });

  it('parses ttl', () => {
    expect(parseTtl(sampleOutput)).toBe(118);
  });

  it('parses summary stats', () => {
    const summary = parseSummary(sampleOutput);
    expect(summary).toEqual({
      packetsTransmitted: 4,
      packetsReceived: 4,
      min: 12.345,
      avg: 14.025,
      max: 16.012
    });
  });
});

describe('ping calculations', () => {
  it('calculates jitter', () => {
    expect(calculateJitter([10, 20, 30, 50])).toBe(13.33);
  });

  it('calculates packet loss', () => {
    expect(calculatePacketLoss(4, 3)).toBe(25.0);
  });
});
