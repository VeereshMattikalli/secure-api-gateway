
import {
  Gauge,
  ShieldCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Activity,
} from "lucide-react";

const rateLimitData = [
  {
    role: "USER",
    limit: 10,
    description: "Standard client access",
    color: "blue",
  },
  {
    role: "ANALYST",
    limit: 20,
    description: "Analytics-enabled access",
    color: "green",
  },
  {
    role: "ADMIN",
    limit: 30,
    description: "Full administrative access",
    color: "purple",
  },
];

const MAX_LIMIT = Math.max(
  ...rateLimitData.map((item) => item.limit)
);

function RateLimits() {
  return (
    <div className="page-view">
      <div className="welcome-row">
        <div>
          <h2>Rate Limit Management</h2>
          <p>
            Review request quotas and role-based traffic restrictions.
          </p>
        </div>

        <span className="panel-tag">
          Sliding window · 60 seconds
        </span>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-top">
            USER Limit
            <Gauge size={20} />
          </div>
          <h2>10</h2>
          <span className="muted">
            Requests per minute
          </span>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            ANALYST Limit
            <Activity size={20} />
          </div>
          <h2>20</h2>
          <span className="muted">
            Requests per minute
          </span>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            ADMIN Limit
            <ShieldCheck size={20} />
          </div>
          <h2>30</h2>
          <span className="muted">
            Requests per minute
          </span>
        </div>

        <div className="stat-card">
          <div className="stat-top">
            Enforcement
            <Clock size={20} />
          </div>
          <h2>60 sec</h2>
          <span className="trend positive">
            Sliding window
          </span>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>Role-Based Request Quotas</h3>
            <p>
              Maximum requests allowed per client within 60 seconds.
            </p>
          </div>

          <span className="panel-tag">
            Configured policies
          </span>
        </div>

        <div className="rate-limit-list">
          {rateLimitData.map((item) => {
            const percentage = (item.limit / MAX_LIMIT) * 100;

            return (
              <div className="rate-limit-card" key={item.role}>
                <div className="rate-limit-top">
                  <div className={`role-icon ${item.color}`}>
                    <Gauge size={22} />
                  </div>

                  <div className="rate-limit-description">
                    <strong>{item.role}</strong>
                    <span>{item.description}</span>
                  </div>

                  <div className="rate-limit-value">
                    <strong>{item.limit}</strong>
                    <span>requests / minute</span>
                  </div>
                </div>

                <div
                  className="quota-track"
                  role="progressbar"
                  aria-label={`${item.role} configured request quota`}
                  aria-valuenow={item.limit}
                  aria-valuemin={0}
                  aria-valuemax={MAX_LIMIT}
                >
                  <div
                    className={`quota-fill ${item.color}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel rate-info-panel">
        <div className="panel-heading">
          <div>
            <h3>Rate Limiting Behaviour</h3>
            <p>
              How the gateway enforces request limits.
            </p>
          </div>
        </div>

        <div className="rate-info-grid">
          <div className="rate-info-item">
            <CheckCircle2 size={19} />
            <div>
              <strong>Sliding Window</strong>
              <p>
                Tracks request timestamps within a 60-second window.
              </p>
            </div>
          </div>

          <div className="rate-info-item">
            <ShieldCheck size={19} />
            <div>
              <strong>Client-Based Tracking</strong>
              <p>
                Maintains a separate request history for each client ID.
              </p>
            </div>
          </div>

          <div className="rate-info-item">
            <AlertTriangle size={19} />
            <div>
              <strong>HTTP 429 Response</strong>
              <p>
                Rejects requests after the configured quota is exceeded.
              </p>
            </div>
          </div>

          <div className="rate-info-item">
            <Clock size={19} />
            <div>
              <strong>Retry-After Header</strong>
              <p>
                Returns the estimated wait time before another request.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="panel security-note">
        <AlertTriangle size={20} />
        <div>
          <strong>Implementation limitation</strong>
          <p>
            The current rate limiter uses in-memory storage. Request
            counters reset when the gateway restarts and are not shared
            across multiple gateway workers or instances.
          </p>
        </div>
      </div>
    </div>
  );
}

export default RateLimits;
