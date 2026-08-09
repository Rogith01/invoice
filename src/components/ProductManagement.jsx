import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Toast from "./Toast";

const ProductManagement = () => {
    const [products, setProducts] = useState([]);
    const [productName, setProductName] = useState("");
    const [price, setPrice] = useState("");
    const [editingId, setEditingId] = useState(null);

    // ===============================
    // Search
    // ===============================
    const [search, setSearch] = useState("");

    // ===============================
    // Delete Confirmation
    // ===============================
    const [deleteConfirm, setDeleteConfirm] = useState({
        show: false,
        id: null,
        productName: "",
    });

    // ===============================
    // Toast State
    // ===============================
    const [toast, setToast] = useState({
        message: "",
        type: "success",
    });

    // ===============================
    // Show Toast
    // ===============================
    const showToast = (message, type = "success") => {
        setToast({
            message,
            type,
        });
    };

    // ===============================
    // Close Toast
    // ===============================
    const closeToast = () => {
        setToast({
            message: "",
            type: "success",
        });
    };

    // ===============================
    // Fetch Products
    // ===============================
const fetchProducts = useCallback(async () => {
    try {
        const res = await axios.get(
            "https://invoice-backend-78hd.onrender.com/api/products"
        );

        if (res.data.success) {
            setProducts(res.data.products);
        } else {
            showToast(
                res.data.message || "Failed to load products.",
                "error"
            );
        }
    } catch (err) {
        console.log(err);

        showToast(
            "Unable to load products. Please try again.",
            "error"
        );
    }
}, []);

    // ===============================
    // Edit Product
    // ===============================
    const editProduct = (product) => {
        setEditingId(product.id);
        setProductName(product.product_name);
        setPrice(product.price);

        showToast(
            `"${product.product_name}" selected for editing.`,
            "info"
        );
    };

    // ===============================
    // Cancel Edit
    // ===============================
    const cancelEdit = () => {
        setEditingId(null);
        setProductName("");
        setPrice("");

        showToast("Edit cancelled.", "info");
    };

    // ===============================
    // Open Delete Confirmation
    // ===============================
    const confirmDeleteProduct = (id, productName) => {
        setDeleteConfirm({
            show: true,
            id,
            productName,
        });
    };

    // ===============================
    // Cancel Delete
    // ===============================
    const cancelDelete = () => {
        setDeleteConfirm({
            show: false,
            id: null,
            productName: "",
        });
    };

    // ===============================
    // Delete Product
    // ===============================
    const deleteProduct = async () => {
        const { id, productName } = deleteConfirm;

        if (!id) return;

        try {
            const res = await axios.delete(
                `https://invoice-backend-78hd.onrender.com/api/products/${id}`
            );

            if (res.data.success) {
                await fetchProducts();

                showToast(
                    `"${productName}" deleted successfully.`,
                    "success"
                );
            } else {
                showToast(
                    res.data.message ||
                        "Failed to delete product.",
                    "error"
                );
            }
        } catch (err) {
            console.log(err);

            showToast(
                "Failed to delete product. Please try again.",
                "error"
            );
        }

        // Close confirmation popup
        setDeleteConfirm({
            show: false,
            id: null,
            productName: "",
        });
    };

    // ===============================
    // Load Products
    // ===============================
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // ===============================
    // Add / Update Product
    // ===============================
    const addProduct = async () => {
        // =============================
        // Validation
        // =============================
        if (!productName.trim() || Number(price) <= 0) {
            showToast(
                "Enter a valid Product Name and Price.",
                "warning"
            );
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
                        price,
                    }
                );

                if (res.data.success) {
                    await fetchProducts();

                    setEditingId(null);
                    setProductName("");
                    setPrice("");

                    showToast(
                        "Product updated successfully!",
                        "success"
                    );
                } else {
                    showToast(
                        res.data.message ||
                            "Failed to update product.",
                        "error"
                    );
                }
            } catch (err) {
                console.log(err);

                showToast(
                    "Failed to update product. Please try again.",
                    "error"
                );
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
                    price,
                }
            );

            if (res.data.success) {
                await fetchProducts();

                setProductName("");
                setPrice("");

                showToast(
                    "Product added successfully!",
                    "success"
                );
            } else {
                showToast(
                    res.data.message ||
                        "Failed to add product.",
                    "error"
                );
            }
        } catch (err) {
            console.log(err);

            showToast(
                "Failed to add product. Please try again.",
                "error"
            );
        }
    };

    // ===============================
    // Filter Products
    // ===============================
    const filteredProducts = products.filter((product) =>
        String(product.product_name || "")
            .toLowerCase()
            .includes(search.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto mt-8 bg-white shadow-lg rounded-xl p-6">

            {/* ===============================
                TOAST
            =============================== */}
            <Toast
                message={toast.message}
                type={toast.type}
                onClose={closeToast}
            />

            {/* ===============================
                DELETE CONFIRMATION MODAL
            =============================== */}
            {deleteConfirm.show && (
                <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">

                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">

                        {/* Icon */}

                        <div className="flex justify-center mb-4">

                            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-red-100">

                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-8 w-8 text-red-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01M10.29 3.86l-7.82 14A2 2 0 004.21 21h15.58a2 2 0 001.74-3.14l-7.82-14a2 2 0 00-3.42 0z"
                                    />
                                </svg>

                            </div>

                        </div>

                        {/* Title */}

                        <h2 className="text-xl font-bold text-gray-800 text-center">

                            Delete Product?

                        </h2>

                        {/* Message */}

                        <p className="text-gray-500 text-center mt-2">

                            Are you sure you want to delete

                            <span className="font-bold text-gray-800">
                                {" "}
                                "{deleteConfirm.productName}"
                            </span>

                            ?

                        </p>

                        <p className="text-sm text-red-500 text-center mt-2">

                            This action cannot be undone.

                        </p>

                        {/* Buttons */}

                        <div className="flex gap-3 mt-6">

                            <button
                                onClick={cancelDelete}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg transition"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={deleteProduct}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg transition"
                            >
                                Delete
                            </button>

                        </div>

                    </div>

                </div>
            )}

            {/* ===============================
                HEADER
            =============================== */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">

                <div>

                    <h1 className="text-3xl font-bold text-gray-800">
                        Product Management
                    </h1>

                    <p className="text-gray-500 mt-1">
                        Manage supermarket products and prices
                    </p>

                </div>

                {/* Product Count */}

                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-semibold">
                    {filteredProducts.length} Products
                </div>

            </div>

            {/* ===============================
                SEARCH
            =============================== */}
            <div className="mb-6">

                <div className="relative w-full md:w-96">

                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                        🔍
                    </span>

                    <input
                        type="text"
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                        className="w-full border border-gray-300 rounded-lg pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                            title="Clear Search"
                        >
                            ×
                        </button>
                    )}

                </div>

            </div>

            {/* ===============================
                ADD / UPDATE PRODUCT FORM
            =============================== */}
            <div className="bg-gray-50 border rounded-xl p-5 mb-8">

                <h2 className="text-lg font-semibold text-gray-700 mb-4">

                    {editingId
                        ? "Edit Product"
                        : "Add New Product"}

                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    <input
                        type="text"
                        placeholder="Product Name"
                        value={productName}
                        onChange={(e) =>
                            setProductName(e.target.value)
                        }
                        className="border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <input
                        type="number"
                        placeholder="Price"
                        min="0.01"
                        step="0.01"
                        value={price}
                        onChange={(e) =>
                            setPrice(e.target.value)
                        }
                        className="border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <div className="flex gap-2">

                        <button
                            onClick={addProduct}
                            className={`flex-1 text-white rounded-lg px-4 py-2.5 font-semibold transition ${
                                editingId
                                    ? "bg-blue-600 hover:bg-blue-700"
                                    : "bg-green-600 hover:bg-green-700"
                            }`}
                        >
                            {editingId
                                ? "Update Product"
                                : "Add Product"}
                        </button>

                        {editingId && (
                            <button
                                onClick={cancelEdit}
                                className="bg-gray-500 hover:bg-gray-600 text-white rounded-lg px-4 py-2.5 font-semibold"
                            >
                                Cancel
                            </button>
                        )}

                    </div>

                </div>

            </div>

            {/* ===============================
                PRODUCT TABLE
            =============================== */}
<div className="overflow-x-auto border border-gray-200 rounded-lg overflow-hidden">

    <table className="w-full border-collapse">

                    <thead className="bg-gray-100">

                        <tr>

                            <th className="border p-3 text-center">
                                Product
                            </th>

                            <th className="border p-3 text-center">
                                Price
                            </th>

                            <th className="border p-3 text-center">
                                Action
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {filteredProducts.length > 0 ? (

                            filteredProducts.map((product) => (

                                <tr
                                    key={product.id}
                                    className="hover:bg-gray-50 transition"
                                >

                                    <td className="border p-3 text-center font-medium">
                                        {product.product_name}
                                    </td>

                                    <td className="border p-3 text-center font-medium">
                                        ₹
                                        {Number(
                                            product.price
                                        ).toFixed(2)}
                                    </td>

                                    <td className="border p-3">

                                        <div className="flex justify-center gap-4">

                                            {/* EDIT */}

                                            <button
                                                onClick={() =>
                                                    editProduct(product)
                                                }
                                                className="text-blue-600 hover:text-blue-800 transition transform hover:scale-110"
                                                title="Edit Product"
                                                aria-label="Edit Product"
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

                                            {/* DELETE */}

                                            <button
                                                onClick={() =>
                                                    confirmDeleteProduct(
                                                        product.id,
                                                        product.product_name
                                                    )
                                                }
                                                className="text-red-600 hover:text-red-800 transition transform hover:scale-110"
                                                title="Delete Product"
                                                aria-label="Delete Product"
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

                            ))

                        ) : (

                            <tr>

                                <td
                                    colSpan="3"
                                    className="border p-8 text-center text-gray-500"
                                >
                                    {search
                                        ? `No products found for "${search}".`
                                        : "No products found."}
                                </td>

                            </tr>

                        )}

                    </tbody>

                </table>

            </div>

        </div>
    );
};

export default ProductManagement;