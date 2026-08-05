import { Routes, Route } from "react-router-dom";

import InvoiceForm from "./components/InvoiceForm";
import ProductManagement from "./components/ProductManagement";
import Dashboard from "./components/Dashboard";

function App() {
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

        </Routes>

      </div>

    </div>
  );
}

export default App;
