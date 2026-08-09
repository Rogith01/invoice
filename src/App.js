import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";

import Login from "./components/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import InvoiceForm from "./components/InvoiceForm";
import ProductManagement from "./components/ProductManagement";
import Dashboard from "./components/Dashboard";
import InvoiceHistory from "./components/InvoiceHistory";
import InvoiceDetails from "./components/InvoiceDetails";
import UserManagement from "./components/UserManagement";
import Navbar from "./components/Navbar";
import Inventory from "./components/Inventory";
import Customers from "./components/Customers";

function App() {

  const [user, setUser] = useState(
    JSON.parse(sessionStorage.getItem("user"))
  );

  // Login handler
  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
  };

  // Logout handler
  const handleLogout = () => {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");
    setUser(null);
  };

  // If user is not logged in, show only login routes

if (!user) {
  return (
    <Routes>

      <Route
        path="/login"
        element={<Login onLogin={handleLogin} />}
      />

      <Route
        path="*"
        element={<Navigate to="/login" replace />}
      />

    </Routes>
  );
}

  return (
    <div>

      {/* Navbar */}
      <Navbar onLogout={handleLogout} />

      <Routes>

        {/* ========================= */}
        {/* BILLING */}
        {/* ========================= */}

        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Cashier"]}>
              <InvoiceForm />
            </ProtectedRoute>
          }
        />

        {/* ========================= */}
        {/* DASHBOARD */}
        {/* ========================= */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* ========================= */}
        {/* PRODUCTS */}
        {/* ========================= */}

        <Route
          path="/products"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <ProductManagement />
            </ProtectedRoute>
          }
        />

        {/* ========================= */}
        {/* INVENTORY */}
        {/* ========================= */}

        <Route
          path="/inventory"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <Inventory />
            </ProtectedRoute>
          }
        />

        {/* ========================= */}
        {/* USERS */}
        {/* ========================= */}

        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <UserManagement />
            </ProtectedRoute>
          }
        />

        {/* ========================= */}
        {/* INVOICE HISTORY */}
        {/* ========================= */}

        <Route
          path="/invoices"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Cashier"]}>
              <InvoiceHistory />
            </ProtectedRoute>
          }
        />

        {/* ========================= */}
        {/* INVOICE DETAILS */}
        {/* ========================= */}

        <Route
          path="/invoice/:id"
          element={
            <ProtectedRoute allowedRoles={["Admin", "Cashier"]}>
              <InvoiceDetails />
            </ProtectedRoute>
          }
        />

        {/* Unknown URL → Billing */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
        <Route path="/customers" element={<Customers />} />

      </Routes>

    </div>
  );
}

export default App;