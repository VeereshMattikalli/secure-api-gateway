
import { useState, useEffect } from "react";
import Login from "./Login";

import Monitoring from "./pages/Monitoring";
import Security from "./pages/Security";
import AuditLogs from "./pages/AuditLogs";
import Clients from "./pages/Clients";
import RateLimits from "./pages/RateLimits";

import {
  LayoutDashboard,
  Activity,
  ShieldCheck,
  FileText,
  Users,
  Gauge,
  Settings,
  Search,
  Bell,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Menu,
  LockKeyhole,
  Server,
  Clock3,
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import "./App.css";

const API_BASE_URL = "http://localhost:8000";

// Preview chart data. These will be replaced with
// backend-derived chart data in a later step.
const trafficData = [
  { time: "09:00", requests: 120 },
  { time: "10:00", requests: 180 },
  { time: "11:00", requests: 150 },
  { time: "12:00", requests: 240 },
  { time: "13:00", requests: 200 },
  { time: "14:00", requests: 310 },
  { time: "15:00", requests: 270 },
  { time: "16:00", requests: 380 },
  { time: "17:00", requests: 330 },
];

const responseData = [
  { name: "Successful", value: 1190, color: "#16a34a" },
  { name: "Client errors", value: 45, color: "#f59e0b" },
  { name: "Server errors", value: 15, color: "#ef4444" },
];

const navigation = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "API Monitoring", icon: Activity },
  { name: "Security", icon: ShieldCheck },
  { name: "Audit Logs", icon: FileText },
  { name: "Clients & Roles", icon: Users },
  { name: "Rate Limits", icon: Gauge },
];

function formatNumber(value) {
  return typeof value === "number"
    ? value.toLocaleString()
    : "—";
}

function getAuditStatus(eventType) {
  if (
    eventType === "AUTH_FAILURE" ||
    eventType === "RATE_LIMIT_EXCEEDED"
  ) {
    return {
      label: "BLOCKED",
      className: "blocked",
    };
  }

  if (eventType === "AUTHORIZATION_DENIED") {
    return {
      label: "WARNING",
      className: "warning",
    };
  }

  if (eventType === "AUTH_SUCCESS") {
    return {
      label: "SUCCESS",
      className: "success",
    };
  }

  return {
    label: "INFO",
    className: "success",
  };
}

function StatCard({
  title,
  value,
  change,
  positive,
  icon: Icon,
  color,
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{title}</span>

        <div className={`stat-icon ${color}`}>
          <Icon size={20} />
        </div>
      </div>

      <h2>{value}</h2>

      <div className="stat-bottom">
        <span className={positive ? "trend positive" : "trend negative"}>
          {positive ? (
            <ArrowUpRight size={15} />
          ) : (
            <ArrowDownRight size={15} />
          )}
          {change}
        </span>

        <span className="muted">Current recorded data</span>
      </div>
    </div>
  );
}

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Administrator authentication
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Live dashboard data
  const [stats, setStats] = useState(null);
  const [recentAuditLogs, setRecentAuditLogs] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState("");

  // --------------------------------------------------
  // Verify existing administrator session
  // --------------------------------------------------

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/dashboard/auth/me`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (!response.ok) {
          if (isMounted) {
            setUser(null);
          }
          return;
        }

        const data = await response.json();

        if (isMounted) {
          setUser(data);
        }
      } catch (error) {
        console.error("Session verification failed:", error);

        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setCheckingSession(false);
        }
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, []);

  // --------------------------------------------------
  // Fetch live dashboard statistics and audit logs
  // --------------------------------------------------

  useEffect(() => {
    if (!user) {
      return;
    }

    let isMounted = true;

    const fetchDashboardData = async () => {
      setDashboardLoading(true);
      setDashboardError("");

      try {
        const [statsResponse, logsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/dashboard/stats`, {
            method: "GET",
            credentials: "include",
          }),

          fetch(`${API_BASE_URL}/dashboard/audit-logs?limit=5`, {
            method: "GET",
            credentials: "include",
          }),
        ]);

        if (!statsResponse.ok || !logsResponse.ok) {
          throw new Error(
            "Unable to retrieve dashboard data. Please check your administrator session."
          );
        }

        const statsData = await statsResponse.json();
        const logsData = await logsResponse.json();

        if (isMounted) {
          setStats(statsData);
          setRecentAuditLogs(
            Array.isArray(logsData.logs) ? logsData.logs : []
          );
        }
      } catch (error) {
        console.error("Dashboard data loading failed:", error);

        if (isMounted) {
          setDashboardError(error.message);
        }
      } finally {
        if (isMounted) {
          setDashboardLoading(false);
        }
      }
    };

    fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // --------------------------------------------------
  // Handle successful administrator login
  // --------------------------------------------------

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
  };

  // --------------------------------------------------
  // Handle administrator logout
  // --------------------------------------------------

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE_URL}/dashboard/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      setUser(null);
      setStats(null);
      setRecentAuditLogs([]);
      setActivePage("Dashboard");
    }
  };

  // --------------------------------------------------
  // Session loading screen
  // --------------------------------------------------

  if (checkingSession) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-brand-icon">
            <ShieldCheck size={40} />
          </div>

          <h2>SecureGate</h2>

          <p>Verifying administrator session...</p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // Login screen
  // --------------------------------------------------

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // --------------------------------------------------
  // Dashboard data and search
  // --------------------------------------------------

  const filteredLogs = recentAuditLogs.filter((log) =>
    [
      log.event_type,
      log.description,
      log.role,
      log.endpoint,
      log.status_code,
    ]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const userInitials = (user.name || "Admin")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const securityEventCount =
    (stats?.security?.authentication_failures ?? 0) +
    (stats?.security?.authorization_denials ?? 0) +
    (stats?.security?.rate_limit_violations ?? 0);

  // --------------------------------------------------
  // Main authenticated dashboard
  // --------------------------------------------------

  return (
    <div className="app-shell">

      {/* SIDEBAR */}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>

        <div className="brand">
          <div className="brand-icon">
            <ShieldCheck size={24} />
          </div>

          <div>
            <h2>SecureGate</h2>
            <span>API Gateway</span>
          </div>
        </div>

        <div className="nav-label">OVERVIEW</div>

        <nav className="navigation">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={`nav-item ${
                  activePage === item.name ? "active" : ""
                }`}
                onClick={() => {
                  setActivePage(item.name);
                  setSidebarOpen(false);
                }}
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">

          <div className="system-card">
            <div className="system-heading">
              <span className="online-dot" />
              Gateway Status
            </div>

            <strong>Gateway service</strong>
            <span>Backend and gateway configured</span>
          </div>

          <button className="nav-item" type="button">
            <Settings size={19} />
            <span>Settings</span>
          </button>

          {/* Administrator profile and logout */}

          <button
            className="profile"
            onClick={handleLogout}
            title="Click to sign out"
            type="button"
          >
            <div className="avatar">{userInitials}</div>

            <div className="profile-info">
              <strong>{user.name}</strong>
              <span>{user.role}</span>
            </div>

            <ChevronDown size={17} />
          </button>

        </div>
      </aside>

      {/* MAIN CONTENT */}

      <main className="main-content">

        {/* TOPBAR */}

        <header className="topbar">

          <div className="topbar-left">

            <button
              className="mobile-menu"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle navigation"
            >
              <Menu size={22} />
            </button>

            <div>
              <div className="breadcrumb">
                Workspace / {activePage}
              </div>

              <h1>{activePage}</h1>
            </div>

          </div>

          <div className="topbar-actions">

            <div className="environment">
              <span className="online-dot" />
              Development
            </div>

            <button
              className="icon-button"
              aria-label="Notifications"
              type="button"
            >
              <Bell size={19} />
              <span className="notification-dot" />
            </button>

            <div className="top-avatar">
              {userInitials}
            </div>

          </div>
        </header>

        {/* PAGE CONTENT */}

        <div className="page-content">

          {activePage === "Dashboard" ? (

            <>

              {/* WELCOME SECTION */}

              <div className="welcome-row">
                <div>
                  <h2>Gateway Overview</h2>

                  <p>
                    Monitor API traffic, security, and gateway performance.
                  </p>
                </div>

                <div className="date-label">
                  <Clock3 size={16} />
                  Live dashboard data
                </div>
              </div>

              {/* LOADING AND ERROR STATES */}

              {dashboardLoading && (
                <p className="muted">
                  Loading live dashboard data...
                </p>
              )}

              {dashboardError && (
                <div className="panel security-note">
                  <AlertTriangle size={20} />

                  <div>
                    <strong>Dashboard data unavailable</strong>
                    <p>{dashboardError}</p>
                  </div>
                </div>
              )}

              {/* SECURITY STATUS */}

              <div className="status-banner">

                <div className="status-banner-icon">
                  <ShieldCheck size={21} />
                </div>

                <div className="status-message">
                  <strong>Your API Gateway is protected</strong>

                  <span>
                    Authentication, HMAC verification, RBAC, and rate
                    limiting are enabled.
                  </span>
                </div>

                <span className="protected-badge">
                  PROTECTED
                </span>

              </div>

              {/* LIVE STATISTICS */}

              <section className="stats-grid">

                <StatCard
                  title="Total Requests"
                  value={
                    dashboardLoading
                      ? "Loading..."
                      : formatNumber(stats?.requests?.total)
                  }
                  change="Recorded API requests"
                  positive
                  icon={Activity}
                  color="blue"
                />

                <StatCard
                  title="Successful Requests"
                  value={
                    dashboardLoading
                      ? "Loading..."
                      : formatNumber(stats?.requests?.successful)
                  }
                  change="HTTP 2xx responses"
                  positive
                  icon={CheckCircle2}
                  color="green"
                />

                <StatCard
                  title="Failed Requests"
                  value={
                    dashboardLoading
                      ? "Loading..."
                      : formatNumber(stats?.requests?.failed)
                  }
                  change="HTTP 4xx and 5xx responses"
                  positive={false}
                  icon={XCircle}
                  color="red"
                />

                <StatCard
                  title="Security Events"
                  value={
                    dashboardLoading
                      ? "Loading..."
                      : formatNumber(stats ? securityEventCount : null)
                  }
                  change="Recorded security events"
                  positive={false}
                  icon={AlertTriangle}
                  color="orange"
                />

              </section>

              {/* CHARTS - PREVIEW DATA */}

              <section className="charts-grid">

                <div className="panel traffic-panel">

                  <div className="panel-heading">
                    <div>
                      <h3>API Traffic</h3>
                      <p>Illustrative request volume</p>
                    </div>

                    <span className="panel-tag">Preview</span>
                  </div>

                  <div className="chart-container">

                    <ResponsiveContainer width="100%" height="100%">

                      <AreaChart data={trafficData}>

                        <defs>
                          <linearGradient
                            id="trafficGradient"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="#3b82f6"
                              stopOpacity={0.28}
                            />

                            <stop
                              offset="100%"
                              stopColor="#3b82f6"
                              stopOpacity={0.01}
                            />
                          </linearGradient>
                        </defs>

                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#e8edf4"
                        />

                        <XAxis
                          dataKey="time"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#94a3b8", fontSize: 12 }}
                        />

                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: "#94a3b8", fontSize: 12 }}
                        />

                        <Tooltip />

                        <Area
                          type="monotone"
                          dataKey="requests"
                          stroke="#3b82f6"
                          strokeWidth={2.5}
                          fill="url(#trafficGradient)"
                        />

                      </AreaChart>

                    </ResponsiveContainer>

                  </div>
                </div>

                <div className="panel response-panel">

                  <div className="panel-heading">
                    <div>
                      <h3>Response Distribution</h3>
                      <p>Illustrative HTTP response breakdown</p>
                    </div>

                    <span className="panel-tag">Preview</span>
                  </div>

                  <div className="donut-container">

                    <ResponsiveContainer width="100%" height="100%">

                      <PieChart>

                        <Pie
                          data={responseData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={65}
                          outerRadius={88}
                          paddingAngle={4}
                          stroke="none"
                        >
                          {responseData.map((entry) => (
                            <Cell
                              key={entry.name}
                              fill={entry.color}
                            />
                          ))}
                        </Pie>

                        <Tooltip />

                      </PieChart>

                    </ResponsiveContainer>

                    <div className="donut-center">
                      <strong>Preview</strong>
                      <span>Sample data</span>
                    </div>

                  </div>

                  <div className="legend">

                    {responseData.map((item) => (
                      <div className="legend-item" key={item.name}>

                        <span
                          className="legend-dot"
                          style={{ background: item.color }}
                        />

                        <span>{item.name}</span>

                        <strong>
                          {item.value.toLocaleString()}
                        </strong>

                      </div>
                    ))}

                  </div>

                </div>

              </section>

              {/* AUDIT EVENTS AND SECURITY MODULES */}

              <section className="bottom-grid">

                <div className="panel audit-panel">

                  <div className="panel-heading">
                    <div>
                      <h3>Recent Audit Events</h3>
                      <p>Latest recorded gateway activities</p>
                    </div>

                    <button
                      className="text-button"
                      onClick={() => setActivePage("Audit Logs")}
                      type="button"
                    >
                      View all
                    </button>
                  </div>

                  <div className="table-toolbar">

                    <div className="search-box">
                      <Search size={16} />

                      <input
                        type="text"
                        placeholder="Search audit events..."
                        value={search}
                        onChange={(event) =>
                          setSearch(event.target.value)
                        }
                      />
                    </div>

                  </div>

                  <div className="table-wrapper">

                    <table>

                      <thead>
                        <tr>
                          <th>EVENT</th>
                          <th>CLIENT ROLE</th>
                          <th>ENDPOINT</th>
                          <th>STATUS</th>
                          <th>TIME</th>
                        </tr>
                      </thead>

                      <tbody>

                        {filteredLogs.map((log, index) => {
                          const eventStatus = getAuditStatus(
                            log.event_type
                          );

                          return (
                            <tr key={`${log.timestamp}-${index}`}>

                              <td className="event-name">
                                {log.event_type?.replaceAll("_", " ")}
                              </td>

                              <td>{log.role || "Unknown"}</td>

                              <td>
                                <code>{log.endpoint || "—"}</code>
                              </td>

                              <td>
                                <span
                                  className={`event-status ${eventStatus.className}`}
                                >
                                  {eventStatus.label}
                                </span>
                              </td>

                              <td className="muted">
                                {log.timestamp
                                  ? new Date(
                                      log.timestamp
                                    ).toLocaleString()
                                  : "—"}
                              </td>

                            </tr>
                          );
                        })}

                        {!dashboardLoading &&
                          filteredLogs.length === 0 && (
                            <tr>
                              <td colSpan="5" className="empty-state">
                                No matching audit events found.
                              </td>
                            </tr>
                          )}

                      </tbody>

                    </table>

                  </div>

                </div>

                {/* SECURITY MODULES */}

                <div className="panel security-panel">

                  <div className="panel-heading">
                    <div>
                      <h3>Security Modules</h3>
                      <p>Gateway protection mechanisms</p>
                    </div>

                    <LockKeyhole
                      size={19}
                      className="security-heading-icon"
                    />
                  </div>

                  {[
                    ["API Key Authentication", "Active"],
                    ["HMAC Verification", "Active"],
                    ["Replay Protection", "Active"],
                    ["Role-Based Access", "Active"],
                    ["Rate Limiting", "Active"],
                    ["Audit Logging", "Active"],
                  ].map(([name, status]) => (

                    <div className="module-row" key={name}>

                      <div className="module-check">
                        <CheckCircle2 size={17} />
                      </div>

                      <span>{name}</span>

                      <strong>{status}</strong>

                    </div>

                  ))}

                  <div className="backend-info">

                    <Server size={17} />

                    <div>
                      <strong>Gateway service</strong>
                      <span>localhost:8000</span>
                    </div>

                    <span className="online-dot" />

                  </div>

                </div>

              </section>

              <footer className="footer">
                <span>SecureGate API Gateway Dashboard</span>
                <span>Live statistics · Preview charts</span>
              </footer>

            </>

          ) : activePage === "API Monitoring" ? (

            <Monitoring />

          ) : activePage === "Security" ? (

            <Security />

          ) : activePage === "Audit Logs" ? (

            <AuditLogs />

          ) : activePage === "Clients & Roles" ? (

            <Clients />

          ) : activePage === "Rate Limits" ? (

            <RateLimits />

          ) : null}

        </div>

      </main>

    </div>
  );
}

export default App;
