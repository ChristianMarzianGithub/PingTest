import { exec } from 'child_process';
import util from 'util';
import net from 'net';
import { ContinuousResult, ContinuousTimelineEntry, PingResult } from './types';
import { resolveHost } from './dns';

const execPromise = util.promisify(exec);

export function parseTimes(output: string): Array<number | null> {
  const times: Array<number | null> = [];
  const timeRegex = /time=([0-9.]+) ms/;
  output.split('\n').forEach((line) => {
    const match = line.match(timeRegex);
    if (match) {
      times.push(parseFloat(match[1]));
    }
  });
  return times;
}

export function parseTtl(output: string): number | null {
  const ttlRegex = /ttl=([0-9]+)/i;
  const match = output.match(ttlRegex);
  return match ? parseInt(match[1], 10) : null;
}

export function parseSummary(output: string): { packetsTransmitted: number; packetsReceived: number; min?: number; avg?: number; max?: number } {
  const packetsRegex = /(\d+) packets transmitted, (\d+) received/;
  const statsRegex = /min\/avg\/max\/(?:mdev|stddev) = ([0-9.]+)\/([0-9.]+)\/([0-9.]+)/;

  const packetsMatch = output.match(packetsRegex);
  const statsMatch = output.match(statsRegex);

  return {
    packetsTransmitted: packetsMatch ? parseInt(packetsMatch[1], 10) : 0,
    packetsReceived: packetsMatch ? parseInt(packetsMatch[2], 10) : 0,
    min: statsMatch ? parseFloat(statsMatch[1]) : undefined,
    avg: statsMatch ? parseFloat(statsMatch[2]) : undefined,
    max: statsMatch ? parseFloat(statsMatch[3]) : undefined
  };
}

export function calculateJitter(times: number[]): number | null {
  if (times.length < 2) return null;
  let totalDiff = 0;
  for (let i = 1; i < times.length; i += 1) {
    totalDiff += Math.abs(times[i] - times[i - 1]);
  }
  return parseFloat((totalDiff / (times.length - 1)).toFixed(2));
}

export function calculatePacketLoss(sent: number, received: number): number {
  if (sent === 0) return 100;
  return parseFloat((((sent - received) / sent) * 100).toFixed(1));
}

async function resolveIp(host: string, dnsRecords: Awaited<ReturnType<typeof resolveHost>>): Promise<string | null> {
  if (dnsRecords.A.length > 0) return dnsRecords.A[0];
  if (dnsRecords.AAAA.length > 0) return dnsRecords.AAAA[0];
  const ipVersion = net.isIP(host);
  if (ipVersion !== 0) return host;
  return null;
}

export async function runSinglePing(host: string): Promise<PingResult> {
  const dnsRecords = await resolveHost(host);
  const command = `ping -c 4 -W 1 ${host}`;
  const { stdout } = await execPromise(command, { timeout: 8000 });
  const times = parseTimes(stdout);
  const { packetsTransmitted, packetsReceived, min, avg, max } = parseSummary(stdout);

  const packetLoss = calculatePacketLoss(packetsTransmitted, packetsReceived);
  const jitter = times.length ? calculateJitter(times.filter((t): t is number => t !== null)) : null;
  const ip = await resolveIp(host, dnsRecords);

  return {
    host,
    ip,
    packets_sent: packetsTransmitted,
    packets_received: packetsReceived,
    packet_loss: packetLoss,
    min_ms: min ?? null,
    avg_ms: avg ?? null,
    max_ms: max ?? null,
    jitter,
    times,
    ttl: parseTtl(stdout),
    dns: dnsRecords
  };
}

export async function runContinuousPing(host: string, duration: number): Promise<ContinuousResult> {
  const cappedDuration = Math.min(Math.max(duration, 1), 60);
  const dnsRecords = await resolveHost(host);
  const ip = await resolveIp(host, dnsRecords);
  const timeline: ContinuousTimelineEntry[] = [];

  for (let sec = 1; sec <= cappedDuration; sec += 1) {
    try {
      const { stdout } = await execPromise(`ping -c 1 -W 1 ${host}`, { timeout: 1500 });
      const times = parseTimes(stdout);
      timeline.push({ sec, ms: times[0] ?? null, ttl: parseTtl(stdout) });
    } catch (error) {
      timeline.push({ sec, ms: null, ttl: null });
    }
  }

  const successfulTimes = timeline.map((t) => t.ms).filter((v): v is number => v !== null);
  const packetsSent = cappedDuration;
  const packetsReceived = successfulTimes.length;
  const packetLoss = calculatePacketLoss(packetsSent, packetsReceived);

  const min = successfulTimes.length ? Math.min(...successfulTimes) : null;
  const max = successfulTimes.length ? Math.max(...successfulTimes) : null;
  const avg = successfulTimes.length ? parseFloat((successfulTimes.reduce((a, b) => a + b, 0) / successfulTimes.length).toFixed(2)) : null;
  const jitter = calculateJitter(successfulTimes);

  return {
    host,
    ip,
    duration: cappedDuration,
    timeline,
    summary: {
      packet_loss: packetLoss,
      min_ms: min,
      avg_ms: avg,
      max_ms: max,
      jitter
    },
    dns: dnsRecords
  };
}
