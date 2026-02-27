import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "../context/Authcontext ";
import ProtectedRoute from "./routes/protectedRoutes";
import AdminRoute from "./routes/adminRoutes";
import Login from "./components/Login";
import Register from "./components/Register";
import Sessions from "./components/Sessions";
import Admin from "./components/Admin";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected – any logged-in user */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Sessions />} />
          </Route>

          {/* Protected – admin only */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<Admin />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
