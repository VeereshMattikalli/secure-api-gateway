
import { useEffect, useMemo, useState } from "react";

import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const API_BASE_URL = "http://localhost:8000";

function formatNumber(value) {
  return Number(value ?? 0).toLocaleString();
}

function Monitoring() {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [referenceTime, setReferenceTime] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadMonitoringData() {
      try {
        const [statsResponse, logsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/dashboard/stats`, {
            credentials: "include",
          }),
          fetch(`${API_BASE_URL}/dashboard/audit-logs?limit=500`, {
            credentials: "include",
          }),
        ]);

        if (!statsResponse.ok || !logsResponse.ok) {
          throw new Error(
            "Unable to load monitoring data. Please check your dashboard session."
          );
        }

        const statsData = await statsResponse.json();
        const logsData = await logsResponse.json();

        if (cancelled) return;

        setStats(statsData);
        setLogs(Array.isArray(logsData.logs) ? logsData.logs : []);
        setReferenceTime(new Date());
        setError("");
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load monitoring data.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    loadMonitoringData();

    return () => {
      cancelled = true;
    };
  }, [refreshTrigger]);

  function handleRefresh() {
    setRefreshing(true);
    setError("");
    setRefreshTrigger((previous) => previous + 1);
  }

  // Select actual API requests and exclude dashboard requests.
  const apiRequests = useMemo(
    () =>
      logs.filter(
        (record) =>
          record.event_type === "API_REQUEST" &&
          !String(record.endpoint || "").startsWith("/dashboard/")
      ),
    [logs]
  );

  // Build traffic data for the previous 12 hours.
  const monitoringData = useMemo(() => {
    if (!referenceTime) return [];

    const currentHour = new Date(referenceTime);
    currentHour.setMinutes(0, 0, 0);

    const buckets = [];

    for (let i = 11; i >= 0; i--) {
      const hour = new Date(currentHour);
      hour.setHours(hour.getHours() - i);

      buckets.push({
        hour,
        time: hour.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        requests: 0,
      });
    }

    apiRequests.forEach((record) => {
      const timestamp = new Date(record.timestamp);

      if (Number.isNaN(timestamp.getTime())) return;

      const recordHour = new Date(
        timestamp.getFullYear(),
        timestamp.getMonth(),
        timestamp.getDate(),
        timestamp.getHours()
      );

      const matchingBucket = buckets.find(
        (bucket) => bucket.hour.getTime() === recordHour.getTime()
      );

      if (matchingBucket) {
        matchingBucket.requests += 1;
      }
    });

    return buckets.map(({ time, requests }) => ({
      time,
      requests,
    }));
  }, [apiRequests, referenceTime]);

  // Group real API requests by endpoint and HTTP method.
  const endpoints = useMemo(() => {
    const grouped = {};

    apiRequests.forEach((record) => {
      const path = record.endpoint || "Unknown endpoint";
      const method = record.method || "UNKNOWN";
      const key = `${method}:${path}`;

      if (!grouped[key]) {
        grouped[key] = {
          path,
          method,
          requests: 0,
          failures: 0,
        };
      }

      grouped[key].requests += 1;

      if (
        typeof record.status_code === "number" &&
        record.status_code >= 400
      ) {
        grouped[key].failures += 1;
      }
    });

    return Object.values(grouped).sort(
      (a, b) => b.requests - a.requests
    );
  }, [apiRequests]);

  const securityEvents =
    (stats?.security?.authentication_failures ?? 0) +
    (stats?.security?.authorization_denials ?? 0) +
    (stats?.security?.rate_limit_violations ?? 0);

  if (loading) {
    return (
      <div className="page-view">
        <p>Loading API monitoring data...</p>
      </div>
    );
  }

  return (
    <div className="page-view">
      <div className="welcome-row">
        <div>
          <h2>API Monitoring</h2>
          <p>Monitor actual gateway traffic and endpoint activity.</p>
        </div>

        <button
          type="button"
          className="panel-tag"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={14} />
          {refreshing ? "Refreshing..." : "Refresh data"}
        </button>
      </div>

      {error && (
        <div className="panel">
          <p className="error-message">{error}</p>
          <button type="button" onClick={handleRefresh} disabled={refreshing}>
            Try again
          </button>
        </div>
      )}

      {!error && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-top">
                Total API Requests
                <Activity size={20} />
              </div>
              <h2>{formatNumber(stats?.requests?.total)}</h2>
              <span className="trend positive">
                Recorded API requests
              </span>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                Successful Requests
                <CheckCircle2 size={20} />
              </div>
              <h2>{formatNumber(stats?.requests?.successful)}</h2>
              <span className="trend positive">
                HTTP 2xx responses
              </span>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                Failed Requests
                <AlertTriangle size={20} />
              </div>
              <h2>{formatNumber(stats?.requests?.failed)}</h2>
              <span className="trend negative">
                HTTP 4xx and 5xx responses
              </span>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                Security Events
                <Clock size={20} />
              </div>
              <h2>{formatNumber(securityEvents)}</h2>
              <span className="muted">
                Recorded security events
              </span>
            </div>
          </div>

          <div className="panel">
            <div className="panel-heading">
              <div>
                <h3>Request Traffic</h3>
                <p>
                  Actual API requests per hour during the last 12 hours
                </p>
              </div>
              <span className="panel-tag">Live audit data</span>
            </div>

            <div className="chart-container">
              {apiRequests.length === 0 ? (
                <p>No API request records are available yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monitoringData}>
                    <defs>
                      <linearGradient
                        id="monitorGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#3b82f6"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="100%"
                          stopColor="#3b82f6"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#e8edf4"
                    />

                    <XAxis dataKey="time" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />

                    <Area
                      type="monotone"
                      dataKey="requests"
                      name="Requests"
                      stroke="#3b82f6"
                      fill="url(#monitorGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="panel" style={{ marginTop: 20 }}>
            <div className="panel-heading">
              <div>
                <h3>API Endpoints</h3>
                <p>
                  Endpoint activity calculated from recorded API requests
                </p>
              </div>

              <span className="panel-tag">
                {endpoints.length} endpoints
              </span>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ENDPOINT</th>
                    <th>METHOD</th>
                    <th>REQUESTS</th>
                    <th>FAILED</th>
                    <th>STATUS</th>
                  </tr>
                </thead>

                <tbody>
                  {endpoints.length === 0 ? (
                    <tr>
                      <td colSpan="5">
                        No endpoint request records found.
                      </td>
                    </tr>
                  ) : (
                    endpoints.map((endpoint) => (
                      <tr
                        key={`${endpoint.method}:${endpoint.path}`}
                      >
                        <td className="event-name">
                          {endpoint.path}
                        </td>

                        <td>{endpoint.method}</td>
                        <td>{formatNumber(endpoint.requests)}</td>
                        <td>{formatNumber(endpoint.failures)}</td>

                        <td>
                          <span
                            className={`event-status ${
                              endpoint.failures > 0
                                ? "warning"
                                : "success"
                            }`}
                          >
                            {endpoint.failures > 0
                              ? "Errors recorded"
                              : "No errors recorded"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="muted" style={{ marginTop: 16 }}>
            Statistics are calculated from the active audit log.
            Traffic and endpoint breakdowns use the latest 500 audit
            records returned by the backend. Historical rotated logs
            are not included.
          </p>
        </>
      )}
    </div>
  );
}

export default Monitoring;
