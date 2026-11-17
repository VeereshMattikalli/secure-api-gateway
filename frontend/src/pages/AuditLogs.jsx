
import { useEffect, useMemo, useState } from "react";

import {
  Search,
  Filter,
  FileText,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

const API_BASE_URL = "http://localhost:8000";

function getEventStyle(eventType) {
  if (eventType === "AUTH_SUCCESS") {
    return { className: "success", label: "SUCCESS" };
  }

  if (
    eventType === "AUTH_FAILURE" ||
    eventType === "RATE_LIMIT_EXCEEDED" ||
    eventType === "REQUEST_ERROR"
  ) {
    return { className: "blocked", label: "BLOCKED" };
  }

  if (eventType === "AUTHORIZATION_DENIED") {
    return { className: "warning", label: "WARNING" };
  }

  return { className: "success", label: "INFO" };
}

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch actual audit records from the backend.
  useEffect(() => {
    let cancelled = false;

    async function loadAuditLogs() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/dashboard/audit-logs?limit=500`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Unable to load audit logs. Please check your dashboard session."
          );
        }

        const data = await response.json();

        if (cancelled) return;

        setLogs(Array.isArray(data.logs) ? data.logs : []);
        setError("");
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load audit logs.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    loadAuditLogs();

    return () => {
      cancelled = true;
    };
  }, [refreshTrigger]);

  function handleRefresh() {
    setRefreshing(true);
    setError("");
    setRefreshTrigger((previous) => previous + 1);
  }

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const searchable = [
        log.event_type,
        log.description,
        log.client_id,
        log.role,
        log.endpoint,
        log.method,
        log.status_code,
        log.ip_address,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchable.includes(search.toLowerCase());

      const matchesFilter =
        filter === "ALL" ||
        (filter === "SUCCESS" && log.event_type === "AUTH_SUCCESS") ||
        (filter === "AUTH_FAILURE" && log.event_type === "AUTH_FAILURE") ||
        (filter === "SECURITY_DENIAL" &&
          [
            "AUTHORIZATION_DENIED",
            "RATE_LIMIT_EXCEEDED",
          ].includes(log.event_type));

      return matchesSearch && matchesFilter;
    });
  }, [logs, search, filter]);

  const successfulEvents = logs.filter(
    (log) => log.event_type === "AUTH_SUCCESS"
  ).length;

  const blockedEvents = logs.filter((log) =>
    [
      "AUTH_FAILURE",
      "AUTHORIZATION_DENIED",
      "RATE_LIMIT_EXCEEDED",
    ].includes(log.event_type)
  ).length;

  if (loading) {
    return (
      <div className="page-view">
        <p>Loading audit logs...</p>
      </div>
    );
  }

  return (
    <div className="page-view">
      <div className="welcome-row">
        <div>
          <h2>Audit Logs</h2>
          <p>
            Review authentication, authorization, and security events.
          </p>
        </div>

        <button
          type="button"
          className="text-button"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={14} />
          {refreshing ? "Refreshing..." : "Refresh logs"}
        </button>
      </div>

      {error && (
        <div className="panel">
          <p className="error-message">{error}</p>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            Try again
          </button>
        </div>
      )}

      {!error && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-top">
                Total Events
                <FileText size={20} />
              </div>

              <h2>{logs.length.toLocaleString()}</h2>

              <span className="muted">
                Latest recorded audit events
              </span>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                Successful Events
                <CheckCircle2 size={20} />
              </div>

              <h2>{successfulEvents.toLocaleString()}</h2>

              <span className="trend positive">
                Authentication success
              </span>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                Blocked Events
                <XCircle size={20} />
              </div>

              <h2>{blockedEvents.toLocaleString()}</h2>

              <span className="trend negative">
                Security restrictions
              </span>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                Event Monitoring
                <ShieldCheck size={20} />
              </div>

              <h2>Enabled</h2>

              <span className="trend positive">
                Audit logger configured
              </span>
            </div>
          </div>

          <div className="panel audit-page-panel">
            <div className="panel-heading">
              <div>
                <h3>Security Event Records</h3>
                <p>
                  Search and filter recorded gateway events
                </p>
              </div>

              <span className="panel-tag">
                Live audit data
              </span>
            </div>

            <div className="audit-filters">
              <div className="search-box">
                <Search size={16} />

                <input
                  type="text"
                  placeholder="Search events, clients, endpoints..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="filter-control">
                <Filter size={15} />

                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  aria-label="Filter audit events"
                >
                  <option value="ALL">All events</option>
                  <option value="SUCCESS">
                    Successful authentication
                  </option>
                  <option value="AUTH_FAILURE">
                    Authentication failures
                  </option>
                  <option value="SECURITY_DENIAL">
                    Security denials
                  </option>
                </select>
              </div>
            </div>

            <div className="table-wrapper">
              <table className="audit-full-table">
                <thead>
                  <tr>
                    <th>EVENT TYPE</th>
                    <th>CLIENT ID / ROLE</th>
                    <th>ENDPOINT</th>
                    <th>METHOD</th>
                    <th>STATUS</th>
                    <th>IP ADDRESS</th>
                    <th>TIMESTAMP</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLogs.map((log, index) => {
                    const eventStyle = getEventStyle(log.event_type);

                    return (
                      <tr
                        key={`${log.timestamp}-${log.event_type}-${index}`}
                      >
                        <td>
                          <div className="audit-event-cell">
                            <strong>{log.event_type}</strong>
                            <span>
                              {log.description || "No description"}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="audit-client-cell">
                            <strong>{log.role || "Unknown"}</strong>
                            <span>
                              {log.client_id || "Not identified"}
                            </span>
                          </div>
                        </td>

                        <td>
                          <code>{log.endpoint || "—"}</code>
                        </td>

                        <td>{log.method || "—"}</td>

                        <td>
                          <span
                            className={`event-status ${eventStyle.className}`}
                          >
                            {eventStyle.label}
                            {log.status_code != null
                              ? ` · ${log.status_code}`
                              : ""}
                          </span>
                        </td>

                        <td>{log.ip_address || "—"}</td>

                        <td>{log.timestamp || "—"}</td>
                      </tr>
                    );
                  })}

                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan="7" className="empty-state">
                        <AlertTriangle size={20} />
                        <p>No matching audit records found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="audit-table-footer">
              Showing {filteredLogs.length} of {logs.length} loaded records
              (maximum 500)
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AuditLogs;
