import { Routes, Route } from "react-router-dom";

import InvoiceForm from "./components/InvoiceForm";
import ProductManagement from "./components/ProductManagement";

function App() {
  return (
    <div className="min-h-screen bg-gray-100">

      <div className="mx-auto max-w-7xl">

        <Routes>

          <Route path="/" element={<InvoiceForm />} />

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
