import API from "../api/axios";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/Authcontext ";
import { useNavigate } from "react-router-dom";

const DeviceIcon = ({ ua = "" }) => {
  if (/mobile|android|iphone/i.test(ua)) return <span title="Mobile">📱</span>;
  if (/tablet|ipad/i.test(ua)) return <span title="Tablet">📟</span>;
  return <span title="Desktop">💻</span>;
};

const getBrowser = (ua = "") => {
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  return "Unknown Browser";
};

const timeAgo = (date) => {
  const secs = Math.floor((Date.now() - new Date(date)) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
};

export default function Sessions() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const getSessions = async () => {
    try {
      const res = await API.get("/sessions");
      setSessions(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const logoutDevice = async (id) => {
    await API.delete(`/sessions/${id}`);
    getSessions();
  };

  const logoutAll = async () => {
    await API.delete("/sessions/all");
    await logout();
    nav("/login");
  };

  useEffect(() => {
    getSessions();
  }, []);

  const suspicious = sessions.filter((s) => s.isSuspicious);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-700/50 flex flex-col p-5 z-10">
        <div className="mb-8">
          <div className="text-2xl font-bold text-white">🛡️ SecureAuth</div>
          <p className="text-gray-400 text-xs mt-1">Session Manager</p>
        </div>

        <div className="space-y-1 flex-1">
          <NavItem icon="🖥️" label="My Sessions" active />
          {user?.role === "admin" && (
            <button
              onClick={() => nav("/admin")}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition text-sm"
            >
              <span>👑</span> Admin Panel
            </button>
          )}
        </div>

        <div className="border-t border-gray-700/50 pt-4 space-y-3">
          <div className="px-2">
            <p className="text-white font-medium text-sm">{user?.username}</p>
            <p className="text-gray-400 text-xs">{user?.email}</p>
            {user?.role === "admin" && (
              <span className="inline-block mt-1 text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full">
                Admin
              </span>
            )}
          </div>
          <button
            onClick={logoutAll}
            className="w-full bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400 text-sm p-2.5 rounded-lg transition"
          >
            🚪 Logout All Devices
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-64 p-8">
        <div className="max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Active Sessions</h1>
            <p className="text-gray-400 mt-1">
              {sessions.length} active session{sessions.length !== 1 ? "s" : ""}
              {suspicious.length > 0 && (
                <span className="ml-2 text-yellow-400">
                  · {suspicious.length} suspicious
                </span>
              )}
            </p>
          </div>

          {/* Suspicious Warning Banner */}
          {suspicious.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-yellow-400 font-semibold">
                  Suspicious Activity Detected
                </p>
                <p className="text-yellow-200/70 text-sm mt-0.5">
                  {suspicious.length} session
                  {suspicious.length > 1 ? "s were" : " was"} flagged as
                  suspicious. If you don't recognize these devices, log them out
                  immediately.
                </p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-gray-800/50 rounded-xl p-5 animate-pulse h-36"
                />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <p className="text-4xl mb-3">🔒</p>
              <p>No active sessions found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sessions.map((s) => (
                <div
                  key={s._id}
                  className={`bg-gray-900 rounded-xl p-5 border transition ${
                    s.isSuspicious
                      ? "border-yellow-500/40 bg-yellow-500/5"
                      : "border-gray-700/50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">
                        <DeviceIcon ua={s.userAgent} />
                      </span>
                      <div>
                        <p className="font-semibold text-white text-sm">
                          {getBrowser(s.userAgent)}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {s.deviceName !== "Unknown"
                            ? s.deviceName
                            : "Unknown Device"}
                        </p>
                      </div>
                    </div>
                    {s.isSuspicious && (
                      <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full">
                        ⚠ Suspicious
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-gray-400 mb-4">
                    <p>
                      🌐 {s.ipAddress} · {s.country || "Unknown"}
                    </p>
                    <p>🕐 Last used {timeAgo(s.lastUsedAt)}</p>
                    <p>
                      📅 Created {new Date(s.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <button
                    onClick={() => logoutDevice(s._id)}
                    className="w-full bg-gray-800 hover:bg-red-600/20 hover:border-red-500/30 border border-gray-600/50 text-gray-300 hover:text-red-400 text-xs p-2 rounded-lg transition"
                  >
                    Logout this device
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const NavItem = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
      active
        ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
        : "text-gray-400 hover:text-white hover:bg-gray-800"
    }`}
  >
    <span>{icon}</span> {label}
  </button>
);
