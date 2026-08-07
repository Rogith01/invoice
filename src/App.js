import { Routes, Route } from "react-router-dom";
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

function App() {

  const [user, setUser] = useState(
    JSON.parse(sessionStorage.getItem("user"))
  );

  // Show login page if not logged in
  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (


  <div className="min-h-screen bg-gray-100">

    <Navbar />

  <div className="mx-auto max-w-7xl pt-6 px-4">

      <Routes>

          {/* Billing - Admin + Cashier */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Cashier"]}>
                <InvoiceForm />
              </ProtectedRoute>
            }
          />

          {/* Dashboard - Admin Only */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Products - Admin Only */}
          <Route
            path="/products"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <ProductManagement />
              </ProtectedRoute>
            }
          />

          {/* User Management - Admin Only */}
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <UserManagement />
              </ProtectedRoute>
            }
          />

          {/* Invoice History - Admin + Cashier */}
          <Route
            path="/invoices"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Cashier"]}>
                <InvoiceHistory />
              </ProtectedRoute>
            }
          />

          {/* Invoice Details - Admin + Cashier */}
          <Route
            path="/invoice/:id"
            element={
              <ProtectedRoute allowedRoles={["Admin", "Cashier"]}>
                <InvoiceDetails />
              </ProtectedRoute>
            }
          />
          <Route path="/inventory" element={<Inventory />} />

        </Routes>

      </div>

    </div>
  );
}

export default App;
