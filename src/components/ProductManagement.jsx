import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const ProductManagement = () => {

const [products, setProducts] = useState([]);
const [productName, setProductName] = useState("");
const [price, setPrice] = useState("");
const [editingId, setEditingId] = useState(null);
const navigate = useNavigate();

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
const deleteProduct = async (id, productName) => {

    const confirmDelete = window.confirm(
        `Delete "${productName}" ?`
    );

    if (!confirmDelete) return;

    try {

        const res = await axios.delete(
            `https://invoice-backend-78hd.onrender.com/api/products/${id}`
        );

        if (res.data.success) {

            fetchProducts();

        }

    } catch (err) {

        console.log(err);

    }

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

<div className="flex justify-between items-center mb-8">

    <h1 className="text-3xl font-bold">
        Product Management
    </h1>

    <button
        onClick={() => navigate("/")}
        className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg"
    >
        🧾 Billing
    </button>

</div>

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

<td className="border p-2">

    <div className="flex justify-center gap-3">

        {/* Edit */}

        <button
            onClick={() => editProduct(product)}
            className="text-blue-600 hover:text-blue-800"
            title="Edit Product"
        >

            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L12 15l-4 1 1-4 8.586-8.586z"
                />
            </svg>

        </button>

        {/* Delete */}

        <button
    onClick={() => deleteProduct(product.id, product.product_name)}
    className="text-red-600 hover:text-red-800"
    title="Delete Product"
>

            <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
            </svg>

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