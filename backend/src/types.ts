export interface PingResult {
  host: string;
  ip: string | null;
  packets_sent: number;
  packets_received: number;
  packet_loss: number;
  min_ms: number | null;
  avg_ms: number | null;
  max_ms: number | null;
  jitter: number | null;
  times: Array<number | null>;
  ttl: number | null;
  dns: DnsResult;
}

export interface DnsResult {
  A: string[];
  AAAA: string[];
  CNAME: string[];
}

export interface ContinuousTimelineEntry {
  sec: number;
  ms: number | null;
  ttl: number | null;
}

export interface ContinuousSummary {
  packet_loss: number;
  min_ms: number | null;
  avg_ms: number | null;
  max_ms: number | null;
  jitter: number | null;
}

export interface ContinuousResult {
  host: string;
  ip: string | null;
  duration: number;
  timeline: ContinuousTimelineEntry[];
  summary: ContinuousSummary;
  dns: DnsResult;
}
