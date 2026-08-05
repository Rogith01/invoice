import React, { useEffect, useState } from "react";
import axios from "axios";

const ProductManagement = () => {

const [products, setProducts] = useState([]);
const [productName, setProductName] = useState("");
const [price, setPrice] = useState("");
const [editingId, setEditingId] = useState(null);

// ===============================
// Fetch Products
// ===============================
const fetchProducts = async () => {

    try {

        const res = await axios.get(
            "https://invoice-backend-78hd.onrender.com/api/products"
        );

        if (res.data.success) {
            setProducts(res.data.products);
        }

    } catch (err) {
        console.log(err);
    }

};
const editProduct = (product) => {

    setEditingId(product.id);

    setProductName(product.product_name);

    setPrice(product.price);

};

// ===============================
// Load Products on Page Load
// ===============================
useEffect(() => {

    fetchProducts();

}, []);

// ===============================
// Add Product
// ===============================
const addProduct = async () => {

    if (!productName.trim() || Number(price) <= 0) {
        alert("Enter a valid Product Name and Price");
        return;
    }

    // =============================
    // UPDATE PRODUCT
    // =============================
    if (editingId) {

        try {

            const res = await axios.put(
                `https://invoice-backend-78hd.onrender.com/api/products/${editingId}`,
                {
                    productName: productName.trim(),
                    price
                }
            );

            if (res.data.success) {

                fetchProducts();

                setEditingId(null);

                setProductName("");

                setPrice("");

            }

        } catch (err) {

            console.log(err);

        }

        return;

    }

    // =============================
    // ADD NEW PRODUCT
    // =============================
    try {

        const res = await axios.post(
            "https://invoice-backend-78hd.onrender.com/api/products",
            {
                productName: productName.trim(),
                price
            }
        );

        if (res.data.success) {

            fetchProducts();

            setProductName("");

            setPrice("");

        }

    } catch (err) {

        console.log(err);

    }

};

    return (

        <div className="max-w-6xl mx-auto mt-8 bg-white shadow-lg rounded-lg p-6">

            <h1 className="text-3xl font-bold text-center mb-8">
                Product Management
            </h1>

            {/* Add Product Form */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

                <input
                    type="text"
                    placeholder="Product Name"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="border rounded px-3 py-2"
                />

                <input
                    type="number"
                    placeholder="Price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="border rounded px-3 py-2"
                />

                <button
                    onClick={addProduct}
                    className="bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2"
                >
                    {editingId ? "Update Product" : "Add Product"}
                </button>

            </div>

            {/* Product Table */}

            <table className="w-full border">

                <thead className="bg-gray-100">

                    <tr>

                      

                        <th className="border p-2">Product</th>

                        <th className="border p-2">Price</th>

                        <th className="border p-2">Action</th>

                    </tr>

                </thead>

                  <tbody>

                    {products.map((product) => (

                    <tr key={product.id}>



                        <td className="border p-2 text-center">
                            {product.product_name}
                        </td>

                        <td className="border p-2 text-center">
                            ₹{Number(product.price).toFixed(2)}
                        </td>

                        <td className="border p-2 text-center">

                         <div className="flex justify-center gap-2">

                        <button
                            onClick={() => editProduct(product)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                        >
                            Edit
                        </button>

                        <button
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                        >
                            Delete
                        </button>

                    </div>

                        </td>

                    </tr>

                    ))}

                    </tbody>

            </table>

        </div>

    );

};

export default ProductManagement;