
import { useEffect, useMemo, useState } from "react";

import {
  Users,
  ShieldCheck,
  User,
  BarChart3,
  Crown,
  CheckCircle2,
  LockKeyhole,
  RefreshCw,
} from "lucide-react";

const API_BASE_URL = "http://localhost:8000";

const roles = [
  {
    name: "USER",
    description: "Standard API client with access to basic resources.",
    icon: User,
    color: "blue",
    permissions: [
      "Basic API access",
      "Products endpoint",
      "Profile endpoint",
    ],
    rateLimit: "10 requests / minute",
  },
  {
    name: "ANALYST",
    description:
      "Analytical client with access to basic and analytics resources.",
    icon: BarChart3,
    color: "green",
    permissions: [
      "Basic API access",
      "Products endpoint",
      "Profile endpoint",
      "Analytics endpoint",
    ],
    rateLimit: "20 requests / minute",
  },
  {
    name: "ADMIN",
    description:
      "Administrator with access to all protected API resources.",
    icon: Crown,
    color: "purple",
    permissions: [
      "Basic API access",
      "Products endpoint",
      "Profile endpoint",
      "Analytics endpoint",
      "Admin endpoint",
    ],
    rateLimit: "30 requests / minute",
  },
];

function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch registered clients from the backend.
  useEffect(() => {
    let cancelled = false;

    async function loadClients() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/dashboard/clients`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(
            "Unable to load clients. Please check your dashboard session."
          );
        }

        const data = await response.json();

        if (cancelled) return;

        setClients(Array.isArray(data.clients) ? data.clients : []);
        setError("");
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Failed to load client records.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    loadClients();

    return () => {
      cancelled = true;
    };
  }, [refreshTrigger]);

  function handleRefresh() {
    setRefreshing(true);
    setError("");
    setRefreshTrigger((previous) => previous + 1);
  }

  const activeClients = useMemo(
    () => clients.filter((client) => client.is_active).length,
    [clients]
  );

  const inactiveClients = clients.length - activeClients;

  const roleCounts = useMemo(
    () =>
      roles.reduce((counts, role) => {
        counts[role.name] = clients.filter(
          (client) => client.role === role.name
        ).length;
        return counts;
      }, {}),
    [clients]
  );

  if (loading) {
    return (
      <div className="page-view">
        <p>Loading registered clients...</p>
      </div>
    );
  }

  return (
    <div className="page-view">
      <div className="welcome-row">
        <div>
          <h2>Clients & Roles</h2>
          <p>
            Understand client access levels and role-based permissions.
          </p>
        </div>

        <button
          type="button"
          className="text-button"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={14} />
          {refreshing ? "Refreshing..." : "Refresh clients"}
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
                Registered Clients
                <Users size={20} />
              </div>

              <h2>{clients.length.toLocaleString()}</h2>

              <span className="trend positive">
                Database client records
              </span>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                Active Clients
                <CheckCircle2 size={20} />
              </div>

              <h2>{activeClients.toLocaleString()}</h2>

              <span className="trend positive">
                Enabled client accounts
              </span>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                Inactive Clients
                <LockKeyhole size={20} />
              </div>

              <h2>{inactiveClients.toLocaleString()}</h2>

              <span className="trend negative">
                Disabled client accounts
              </span>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                Access Roles
                <ShieldCheck size={20} />
              </div>

              <h2>{roles.length}</h2>

              <span className="trend positive">
                USER · ANALYST · ADMIN
              </span>
            </div>
          </div>

          <div className="welcome-row">
            <div>
              <h2>Role Permissions</h2>
              <p>
                Permissions assigned to each client role.
              </p>
            </div>
          </div>

          <div className="role-grid">
            {roles.map((role) => {
              const Icon = role.icon;

              return (
                <div className="panel role-card" key={role.name}>
                  <div className={`role-icon ${role.color}`}>
                    <Icon size={24} />
                  </div>

                  <h3>{role.name}</h3>

                  <p className="role-description">
                    {role.description}
                  </p>

                  <div className="role-divider" />

                  <strong className="role-section-title">
                    PERMISSIONS
                  </strong>

                  <div className="role-permissions">
                    {role.permissions.map((permission) => (
                      <div className="permission-row" key={permission}>
                        <CheckCircle2 size={15} />
                        <span>{permission}</span>
                      </div>
                    ))}
                  </div>

                  <div className="role-limit">
                    <span>Registered clients</span>
                    <strong>
                      {roleCounts[role.name] ?? 0}
                    </strong>
                  </div>

                  <div className="role-limit">
                    <span>Rate limit</span>
                    <strong>{role.rateLimit}</strong>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="panel clients-table-panel">
            <div className="panel-heading">
              <div>
                <h3>Registered Clients</h3>
                <p>
                  Actual client records retrieved from the database.
                </p>
              </div>

              <span className="panel-tag">Live database data</span>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>CLIENT NAME</th>
                    <th>CLIENT ID</th>
                    <th>ROLE</th>
                    <th>STATUS</th>
                    <th>CREATED AT</th>
                  </tr>
                </thead>

                <tbody>
                  {clients.length === 0 ? (
                    <tr>
                      <td colSpan="5">
                        No registered clients found.
                      </td>
                    </tr>
                  ) : (
                    clients.map((client) => (
                      <tr key={client.client_id}>
                        <td className="event-name">
                          {client.name}
                        </td>

                        <td>
                          <code>{client.client_id}</code>
                        </td>

                        <td>
                          <span className="panel-tag">
                            {client.role}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`event-status ${
                              client.is_active ? "success" : "blocked"
                            }`}
                          >
                            {client.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td>
                          {client.created_at
                            ? new Date(client.created_at).toLocaleString()
                            : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel security-note">
            <ShieldCheck size={20} />

            <div>
              <strong>Access control information</strong>

              <p>
                Role permissions correspond to the current
                ROLE_PERMISSIONS configuration in
                app/core/authorization.py. Registered client
                information is retrieved from the backend database.
                API key hashes are not exposed by this endpoint.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Clients;
