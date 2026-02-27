import API from "../api/axios";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/Authcontext ";

export default function Login() {
  const nav = useNavigate();
  const { setUser } = useAuth();

  const [data, setData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [suspicious, setSuspicious] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const login = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await API.post("/auth/login", data);
      setUser(res.data.user);

      if (res.data.isSuspicious) {
        setSuspicious(true);
      } else {
        nav("/");
      }
    } catch (err) {
      setError(err.response?.data?.msg || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      await API.post("/auth/verify-login");
      nav("/");
    } catch {
      setError("Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  if (suspicious) {
    return (
      <div className="flex h-screen justify-center items-center bg-gray-950">
        <div className="bg-gray-900 border border-yellow-500/40 p-8 rounded-2xl shadow-2xl w-96 space-y-5">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚠️</span>
            <h2 className="text-xl font-bold text-yellow-400">
              Suspicious Login Detected
            </h2>
          </div>
          <p className="text-gray-300 text-sm">
            We detected a login from an{" "}
            <span className="text-yellow-400 font-semibold">
              unusual location or device
            </span>
            . Please confirm this was you to continue.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleVerify}
              disabled={verifying}
              className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold p-2.5 rounded-lg transition disabled:opacity-50"
            >
              {verifying ? "Verifying…" : "Yes, that was me"}
            </button>
            <button
              onClick={() =>
                API.post("/auth/logout").then(() => {
                  setUser(null);
                  setSuspicious(false);
                })
              }
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white p-2.5 rounded-lg transition"
            >
              Not me – Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen justify-center items-center bg-gray-950">
      <form
        onSubmit={login}
        className="bg-gray-900 border border-gray-700/50 p-8 rounded-2xl shadow-2xl w-96 space-y-5"
      >
        <div className="text-center">
          <div className="text-4xl mb-2">🔐</div>
          <h2 className="text-2xl font-bold text-white">Welcome back</h2>
          <p className="text-gray-400 text-sm mt-1">Sign in to your account</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <input
            type="email"
            required
            className="w-full bg-gray-800 border border-gray-600 text-white placeholder-gray-500 p-3 rounded-lg focus:outline-none focus:border-blue-500 transition"
            placeholder="Email address"
            onChange={(e) => setData({ ...data, email: e.target.value })}
          />
          <input
            type="password"
            required
            className="w-full bg-gray-800 border border-gray-600 text-white placeholder-gray-500 p-3 rounded-lg focus:outline-none focus:border-blue-500 transition"
            placeholder="Password"
            onChange={(e) => setData({ ...data, password: e.target.value })}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold p-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>

        <p className="text-sm text-center text-gray-400">
          No account?{" "}
          <Link to="/register" className="text-blue-400 hover:text-blue-300">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
