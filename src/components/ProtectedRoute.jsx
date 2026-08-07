import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const user = JSON.parse(sessionStorage.getItem("user"));

  // Not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but role not allowed
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;