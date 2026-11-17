
import {
  ShieldCheck,
  KeyRound,
  Fingerprint,
  Clock,
  LockKeyhole,
  Users,
  Gauge,
  FileText,
  CheckCircle2,
} from "lucide-react";

const securityModules = [
  {
    name: "API Key Authentication",
    description: "Validates client API keys using SHA-256 hashes stored in the database.",
    icon: KeyRound,
    status: "Active",
    detail: "SHA-256 hashing",
  },
  {
    name: "HMAC-SHA256 Verification",
    description: "Verifies request signatures to ensure message authenticity and integrity.",
    icon: Fingerprint,
    status: "Active",
    detail: "HMAC-SHA256",
  },
  {
    name: "Timestamp Validation",
    description: "Rejects requests with timestamps outside the permitted time window.",
    icon: Clock,
    status: "Active",
    detail: "60-second tolerance",
  },
  {
    name: "Replay Attack Protection",
    description: "Uses unique nonces to prevent previously submitted requests from being reused.",
    icon: LockKeyhole,
    status: "Active",
    detail: "Unique nonce validation",
  },
  {
    name: "Role-Based Access Control",
    description: "Controls access to protected endpoints according to client roles.",
    icon: Users,
    status: "Active",
    detail: "USER · ANALYST · ADMIN",
  },
  {
    name: "Rate Limiting",
    description: "Applies role-based request limits using a sliding time window.",
    icon: Gauge,
    status: "Active",
    detail: "60-second window",
  },
  {
    name: "Audit Logging",
    description: "Records authentication, authorization, rate-limit, and API request events.",
    icon: FileText,
    status: "Active",
    detail: "JSON structured logs",
  },
];

function Security() {
  return (
    <div className="page-view">
      <div className="welcome-row">
        <div>
          <h2>Security Center</h2>
          <p>
            Review the security controls implemented in your API Gateway.
          </p>
        </div>

        <span className="protected-badge">PROTECTION ENABLED</span>
      </div>

      <div className="status-banner">
        <div className="status-banner-icon">
          <ShieldCheck size={22} />
        </div>

        <div className="status-message">
          <strong>Gateway security controls configured</strong>
          <span>
            The following modules are implemented in the current application.
          </span>
        </div>

        <span className="online-dot" />
      </div>

      <div className="stats-grid security-stats">
        <div className="stat-card">
          <div className="stat-top">Security Modules</div>
          <h2>{securityModules.length}</h2>
          <span className="trend positive">Implemented modules</span>
        </div>

        <div className="stat-card">
          <div className="stat-top">Authentication</div>
          <h2>Enabled</h2>
          <span className="trend positive">API key verification</span>
        </div>

        <div className="stat-card">
          <div className="stat-top">Request Integrity</div>
          <h2>HMAC</h2>
          <span className="trend positive">Signature verification</span>
        </div>

        <div className="stat-card">
          <div className="stat-top">Access Control</div>
          <h2>RBAC</h2>
          <span className="trend positive">Role-based permissions</span>
        </div>
      </div>

      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>Security Modules</h3>
            <p>Implemented gateway protection mechanisms</p>
          </div>

          <ShieldCheck size={21} className="security-heading-icon" />
        </div>

        <div className="security-module-list">
          {securityModules.map((module) => {
            const Icon = module.icon;

            return (
              <div className="security-module-card" key={module.name}>
                <div className="security-module-icon">
                  <Icon size={22} />
                </div>

                <div className="security-module-content">
                  <h4>{module.name}</h4>
                  <p>{module.description}</p>
                  <span>{module.detail}</span>
                </div>

                <div className="security-module-status">
                  <CheckCircle2 size={16} />
                  Active
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="panel security-note">
        <ShieldCheck size={20} />
        <div>
          <strong>Security implementation note</strong>
          <p>
            The security controls listed above are implemented in the
            API Gateway. Authentication, request signing, authorization,
            rate limiting, and audit logging are enforced by the backend.
            Live request statistics and security events are available
            through the API Monitoring and Audit Logs pages.
          </p>
        </div>
      </div>
    </div>
  );
}
export default Security;
