import { useState } from "react";
import { ShieldCheck, LockKeyhole, ArrowRight, LoaderCircle } from "lucide-react";

function Login({ onLogin }) {
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!apiKey.trim()) {
      setError("Please enter your administrator API key.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:8000/dashboard/auth/login",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            api_key: apiKey,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Authentication failed."
        );
      }

      setApiKey("");
      onLogin(data.user);
    } catch (err) {
      setError(
        err.message || "Unable to connect to the gateway."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand-icon">
          <ShieldCheck size={32} />
        </div>

        <h1>SecureGate</h1>
        <p className="login-subtitle">
          Secure API Gateway Administration
        </p>

        <div className="login-divider" />

        <div className="login-heading">
          <h2>Administrator Login</h2>
          <p>
            Authenticate using your registered administrator API key.
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <label htmlFor="admin-api-key">
            Administrator API Key
          </label>

          <div className="login-input-wrapper">
            <LockKeyhole size={18} />
            <input
              id="admin-api-key"
              type="password"
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              autoComplete="off"
              required
              disabled={loading}
            />
          </div>

          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <LoaderCircle size={18} className="login-spinner" />
                Authenticating...
              </>
            ) : (
              <>
                Sign in securely
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="login-security-note">
          <LockKeyhole size={15} />
          <span>
            Protected by API key authentication and signed sessions.
          </span>
        </div>

        <footer className="login-footer">
          SecureGate API Gateway · Administrator Access
        </footer>
      </div>
    </div>
  );
}

export default Login;
