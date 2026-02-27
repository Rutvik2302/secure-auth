import API from "../api/axios";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const nav = useNavigate();
  const [data, setData] = useState({
    username: "",
    email: "",
    fullName: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await API.post("/auth/register", data);
      nav("/login");
    } catch (err) {
      setError(err.response?.data?.msg || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const field = (placeholder, key, type = "text") => (
    <input
      type={type}
      required
      className="w-full bg-gray-800 border border-gray-600 text-white placeholder-gray-500 p-3 rounded-lg focus:outline-none focus:border-green-500 transition"
      placeholder={placeholder}
      onChange={(e) => setData({ ...data, [key]: e.target.value })}
    />
  );

  return (
    <div className="flex h-screen justify-center items-center bg-gray-950">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 border border-gray-700/50 p-8 rounded-2xl shadow-2xl w-96 space-y-5"
      >
        <div className="text-center">
          <div className="text-4xl mb-2">✨</div>
          <h2 className="text-2xl font-bold text-white">Create account</h2>
          <p className="text-gray-400 text-sm mt-1">
            Start your secure session
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {field("Username", "username")}
          {field("Email address", "email", "email")}
          {field("Full name", "fullName")}
          {field("Password", "password", "password")}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold p-3 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating account…" : "Create Account"}
        </button>

        <p className="text-sm text-center text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-400 hover:text-blue-300">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
