import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../context/Authcontext ";

const AdminRoute = () => {
  const { user } = useAuth();

  if (user === undefined) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Checking permissions…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;

  return <Outlet />; 
};

export default AdminRoute;
