import { Routes, Route } from "react-router-dom";
import { useState } from "react";

import Login from "./components/Login";
import InvoiceForm from "./components/InvoiceForm";
import ProductManagement from "./components/ProductManagement";
import Dashboard from "./components/Dashboard";
import InvoiceHistory from "./components/InvoiceHistory";
import InvoiceDetails from "./components/InvoiceDetails";

function App() {

  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user"))
  );

  // Show login page if not logged in
  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">

      <div className="mx-auto max-w-7xl">

        <Routes>

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          {/* Billing */}
          <Route
            path="/"
            element={<InvoiceForm />}
          />

          {/* Products */}
          <Route
            path="/products"
            element={<ProductManagement />}
          />

          {/* Invoice History */}
          <Route
            path="/invoices"
            element={<InvoiceHistory />}
          />

          {/* Invoice Details */}
          <Route
            path="/invoice/:id"
            element={<InvoiceDetails />}
          />

        </Routes>

      </div>

    </div>
  );
}

export default App;
