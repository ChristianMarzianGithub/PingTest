import { useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip
} from 'chart.js';
import { useDarkMode } from './hooks/useDarkMode';
import { useHistory } from './hooks/useHistory';
import { ContinuousResult, PingResult } from './types';
import './index.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

const examples = ['google.com', 'cloudflare.com', 'facebook.com'];

function StatCard({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{value ?? '—'}</p>
    </div>
  );
}

function PingTimes({ times }: { times: Array<number | null> }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
      <p className="mb-2 text-sm font-semibold">Individual Ping Times</p>
      <div className="flex flex-wrap gap-2 text-sm">
        {times.map((t, idx) => (
          <span key={idx} className="rounded bg-gray-100 px-2 py-1 dark:bg-gray-700">
            {t ?? 'timeout'} ms
          </span>
        ))}
      </div>
    </div>
  );
}

function DnsCard({ dns }: { dns: PingResult['dns'] }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
      <p className="mb-2 text-sm font-semibold">DNS Resolution</p>
      <div className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
        <div>A: {dns.A.join(', ') || '—'}</div>
        <div>AAAA: {dns.AAAA.join(', ') || '—'}</div>
        <div>CNAME: {dns.CNAME.join(', ') || '—'}</div>
      </div>
    </div>
  );
}

function ContinuousChart({ timeline }: { timeline: ContinuousResult['timeline'] }) {
  const data = useMemo(
    () => ({
      labels: timeline.map((t) => t.sec),
      datasets: [
        {
          label: 'Latency (ms)',
          data: timeline.map((t) => t.ms ?? null),
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          spanGaps: true
        }
      ]
    }),
    [timeline]
  );

  const options = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true } }
  };

  return (
    <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
      <p className="mb-2 text-sm font-semibold">Continuous Latency</p>
      <Line options={options} data={data} />
    </div>
  );
}

function HistoryList({ history, onSelect }: { history: string[]; onSelect: (host: string) => void }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
      <div className="mb-2 flex items-center justify-between text-sm font-semibold">
        <span>Recent Hosts</span>
        <span className="text-xs text-gray-500">last 10</span>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        {history.map((item) => (
          <button
            key={item}
            className="rounded bg-gray-100 px-2 py-1 text-gray-700 hover:bg-blue-100 dark:bg-gray-700 dark:text-gray-200"
            onClick={() => onSelect(item)}
            type="button"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

function ExampleList({ onSelect }: { onSelect: (host: string) => void }) {
  return (
    <div className="flex gap-2 text-sm">
      {examples.map((ex) => (
        <button
          key={ex}
          className="rounded bg-blue-100 px-2 py-1 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-200"
          onClick={() => onSelect(ex)}
          type="button"
        >
          {ex}
        </button>
      ))}
    </div>
  );
}

function PingForm({
  host,
  onChange,
  onPing,
  onContinuous,
  loading
}: {
  host: string;
  onChange: (value: string) => void;
  onPing: () => void;
  onContinuous: () => void;
  loading: boolean;
}) {
  return (
    <div className="rounded-lg bg-white p-4 shadow dark:bg-gray-800">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ping Test</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Test reachability and latency for any host.</p>
        </div>
      </div>
      <div className="flex flex-col gap-2 md:flex-row">
        <input
          className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          placeholder="Enter hostname or IP"
          value={host}
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="flex gap-2">
          <button
            className="rounded bg-blue-600 px-3 py-2 text-white disabled:opacity-50"
            onClick={onPing}
            disabled={loading}
            type="button"
          >
            Run Ping Test
          </button>
          <button
            className="rounded bg-green-600 px-3 py-2 text-white disabled:opacity-50"
            onClick={onContinuous}
            disabled={loading}
            type="button"
          >
            Start Continuous Ping
          </button>
        </div>
      </div>
      <div className="mt-3 text-sm">
        <p className="text-gray-600 dark:text-gray-300">Examples:</p>
        <ExampleList onSelect={onChange} />
      </div>
    </div>
  );
}

function SummaryCard({ result }: { result: PingResult }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard label="Host" value={result.host} />
      <StatCard label="Resolved IP" value={result.ip} />
      <StatCard label="Packet Loss" value={`${result.packet_loss}%`} />
      <StatCard label="Min / Avg / Max" value={`${result.min_ms ?? '—'} / ${result.avg_ms ?? '—'} / ${result.max_ms ?? '—'} ms`} />
      <StatCard label="Jitter" value={result.jitter !== null ? `${result.jitter} ms` : '—'} />
      <StatCard label="TTL" value={result.ttl} />
    </div>
  );
}

function ContinuousSummary({ result }: { result: ContinuousResult }) {
  const { summary } = result;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard label="Packet Loss" value={`${summary.packet_loss}%`} />
      <StatCard label="Min / Avg / Max" value={`${summary.min_ms ?? '—'} / ${summary.avg_ms ?? '—'} / ${summary.max_ms ?? '—'} ms`} />
      <StatCard label="Jitter" value={summary.jitter !== null ? `${summary.jitter} ms` : '—'} />
    </div>
  );
}

function useContinuousTimer(active: boolean) {
  const [seconds, setSeconds] = useState(0);

  useMemo(() => {
    if (!active) {
      setSeconds(0);
      return undefined;
    }
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);

  return seconds;
}

function App() {
  const [host, setHost] = useState('google.com');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PingResult | null>(null);
  const [continuous, setContinuous] = useState<ContinuousResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [history, pushHistory] = useHistory();
  const [dark, toggleDark] = useDarkMode();
  const elapsed = useContinuousTimer(isRunning);

  const fetchPing = async () => {
    setLoading(true);
    setError(null);
    setContinuous(null);
    try {
      const res = await fetch(`${API_BASE}/ping?host=${encodeURIComponent(host)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Ping failed');
      setResult(data);
      pushHistory(host);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fetchContinuous = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setIsRunning(true);
    try {
      const res = await fetch(`${API_BASE}/ping/continuous?host=${encodeURIComponent(host)}&duration=60`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Continuous ping failed');
      setContinuous(data);
      pushHistory(host);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 text-gray-900 transition dark:bg-gray-900 dark:text-gray-100">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="flex justify-end">
          <button
            className="rounded bg-gray-200 px-3 py-1 text-sm dark:bg-gray-700"
            onClick={toggleDark}
            type="button"
          >
            {dark ? 'Light mode' : 'Dark mode'}
          </button>
        </div>
        <PingForm host={host} onChange={setHost} onPing={fetchPing} onContinuous={fetchContinuous} loading={loading} />
        {error && <div className="rounded bg-red-100 p-3 text-red-700 dark:bg-red-900/40 dark:text-red-200">{error}</div>}

        {result && (
          <div className="space-y-3">
            <SummaryCard result={result} />
            <DnsCard dns={result.dns} />
            <PingTimes times={result.times} />
          </div>
        )}

        {continuous && (
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-white p-4 shadow dark:bg-gray-800">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Continuous test status</p>
                <p className="text-lg font-semibold">{isRunning ? 'Running' : 'Completed'}</p>
              </div>
              <div className="text-sm">
                <span
                  className={`mr-2 inline-flex items-center rounded px-2 py-1 font-semibold ${
                    continuous.summary.packet_loss < 50 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {continuous.summary.packet_loss < 50 ? 'UP' : 'DOWN'}
                </span>
                <span className="text-gray-600 dark:text-gray-300">Elapsed: {elapsed}s</span>
              </div>
            </div>
            <ContinuousChart timeline={continuous.timeline} />
            <ContinuousSummary result={continuous} />
          </div>
        )}

        <HistoryList history={history} onSelect={setHost} />
      </div>
    </div>
  );
}

export default App;
