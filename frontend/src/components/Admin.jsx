import API from "../api/axios";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/Authcontext ";
import { useNavigate } from "react-router-dom";

const timeAgo = (date) => {
  const secs = Math.floor((Date.now() - new Date(date)) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
};

const getBrowser = (ua = "") => {
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Safari")) return "Safari";
  return "Browser";
};

export default function Admin() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState("sessions");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [sRes, uRes] = await Promise.all([
        API.get("/admin/sessions"),
        API.get("/admin/users"),
      ]);
      setSessions(sRes.data);
      setUsers(uRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const forceLogout = async (userId, email) => {
    if (!confirm(`Force logout all sessions for ${email}?`)) return;
    await API.delete(`/admin/logout/${userId}`);
    fetchAll();
  };

  const toggleSuspicious = async (sessionId) => {
    await API.patch(`/admin/sessions/${sessionId}/suspicious`);
    fetchAll();
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filteredSessions = sessions.filter(
    (s) =>
      s.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.ipAddress?.includes(search) ||
      s.country?.toLowerCase().includes(search.toLowerCase()),
  );

  const suspiciousCount = sessions.filter((s) => s.isSuspicious).length;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 h-full w-64 bg-gray-900 border-r border-gray-700/50 flex flex-col p-5 z-10">
        <div className="mb-8">
          <div className="text-2xl font-bold text-white">👑 Admin Panel</div>
          <p className="text-gray-400 text-xs mt-1">Session Intelligence</p>
        </div>

        <div className="space-y-1 flex-1">
          <TabBtn
            icon="🖥️"
            label="All Sessions"
            active={tab === "sessions"}
            onClick={() => setTab("sessions")}
          />
          <TabBtn
            icon="👥"
            label="Users"
            active={tab === "users"}
            onClick={() => setTab("users")}
          />
          <button
            onClick={() => nav("/")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition text-sm"
          >
            <span>⬅️</span> My Sessions
          </button>
        </div>

        <div className="border-t border-gray-700/50 pt-4 px-2">
          <p className="text-white font-medium text-sm">{user?.username}</p>
          <span className="inline-block mt-1 text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full">
            Admin
          </span>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-64 p-8">
        <div className="max-w-6xl">
          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            <StatCard
              icon="🖥️"
              label="Total Sessions"
              value={sessions.length}
              color="blue"
            />
            <StatCard
              icon="👥"
              label="Total Users"
              value={users.length}
              color="green"
            />
            <StatCard
              icon="⚠️"
              label="Suspicious"
              value={suspiciousCount}
              color="yellow"
            />
            <StatCard
              icon="🔴"
              label="Flagged Users"
              value={
                new Set(
                  sessions
                    .filter((s) => s.isSuspicious)
                    .map((s) => s.user?._id),
                ).size
              }
              color="red"
            />
          </div>

          {tab === "sessions" && (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Active Sessions</h2>
                <input
                  className="bg-gray-800 border border-gray-600 text-white placeholder-gray-500 px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-purple-500 w-64"
                  placeholder="Search by email, IP, country…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-gray-800/50 rounded-xl p-4 animate-pulse h-20"
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSessions.map((s) => (
                    <div
                      key={s._id}
                      className={`bg-gray-900 rounded-xl p-4 border flex items-center justify-between ${
                        s.isSuspicious
                          ? "border-yellow-500/40 bg-yellow-500/5"
                          : "border-gray-700/50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-xl">
                          {s.isSuspicious ? "⚠️" : "🖥️"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-white text-sm">
                              {s.user?.email || "Unknown"}
                            </p>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full border ${
                                s.user?.role === "admin"
                                  ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                                  : "bg-gray-700/50 text-gray-400 border-gray-600/30"
                              }`}
                            >
                              {s.user?.role || "user"}
                            </span>
                            {s.isSuspicious && (
                              <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full">
                                Suspicious
                              </span>
                            )}
                          </div>
                          <p className="text-gray-400 text-xs mt-0.5">
                            {getBrowser(s.userAgent)} · {s.ipAddress} ·{" "}
                            {s.country || "Unknown"} · Last active{" "}
                            {timeAgo(s.lastUsedAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleSuspicious(s._id)}
                          className="text-xs px-3 py-1.5 rounded-lg border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 transition"
                        >
                          {s.isSuspicious ? "Clear Flag" : "Flag"}
                        </button>
                        <button
                          onClick={() =>
                            forceLogout(s.user?._id, s.user?.email)
                          }
                          className="text-xs px-3 py-1.5 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 transition"
                        >
                          Force Logout
                        </button>
                      </div>
                    </div>
                  ))}

                  {filteredSessions.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-3xl mb-2">🔍</p>
                      <p>No sessions match your search</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {tab === "users" && (
            <>
              <h2 className="text-2xl font-bold mb-6">All Users</h2>
              <div className="space-y-3">
                {users.map((u) => {
                  const userSessions = sessions.filter(
                    (s) => s.user?._id === u._id,
                  );
                  const hasSuspicious = userSessions.some(
                    (s) => s.isSuspicious,
                  );

                  return (
                    <div
                      key={u._id}
                      className={`bg-gray-900 rounded-xl p-4 border flex items-center justify-between ${
                        hasSuspicious
                          ? "border-yellow-500/40"
                          : "border-gray-700/50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                          {u.username?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-white text-sm">
                              {u.fullName}
                            </p>
                            <span className="text-gray-500 text-xs">
                              @{u.username}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full border ${
                                u.role === "admin"
                                  ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                                  : "bg-gray-700/50 text-gray-400 border-gray-600/30"
                              }`}
                            >
                              {u.role}
                            </span>
                          </div>
                          <p className="text-gray-400 text-xs mt-0.5">
                            {u.email} · {userSessions.length} active session
                            {userSessions.length !== 1 ? "s" : ""}
                            {hasSuspicious && " · ⚠️ suspicious activity"}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => forceLogout(u._id, u.email)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-red-600/20 border border-red-500/30 text-red-400 hover:bg-red-600/30 transition"
                        disabled={userSessions.length === 0}
                      >
                        Force Logout
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

const StatCard = ({ icon, label, value, color }) => {
  const colors = {
    blue: "from-blue-500/10 to-blue-600/5 border-blue-500/20 text-blue-400",
    green:
      "from-green-500/10 to-green-600/5 border-green-500/20 text-green-400",
    yellow:
      "from-yellow-500/10 to-yellow-600/5 border-yellow-500/20 text-yellow-400",
    red: "from-red-500/10 to-red-600/5 border-red-500/20 text-red-400",
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-4`}>
      <p className="text-2xl mb-1">{icon}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{label}</p>
    </div>
  );
};

const TabBtn = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
      active
        ? "bg-purple-600/20 text-purple-400 border border-purple-500/20"
        : "text-gray-400 hover:text-white hover:bg-gray-800"
    }`}
  >
    <span>{icon}</span> {label}
  </button>
);
