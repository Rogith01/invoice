import React, { useEffect, useState } from "react";
import axios from "axios";

const Inventory = () => {

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Product currently being restocked
    const [restockProduct, setRestockProduct] = useState(null);

    // Quantity to add
    const [restockQuantity, setRestockQuantity] = useState("");

    const [restocking, setRestocking] = useState(false);


    // ==========================================
    // FETCH PRODUCTS
    // ==========================================

    const fetchProducts = async () => {

        try {

            const res = await axios.get(
                "https://invoice-backend-78hd.onrender.com/api/products"
            );

            if (res.data.success) {

                setProducts(res.data.products);

            }

        } catch (err) {

            console.log("Inventory Error:", err);

        } finally {

            setLoading(false);

        }

    };


    // ==========================================
    // LOAD INVENTORY
    // ==========================================

    useEffect(() => {

        fetchProducts();

    }, []);


    // ==========================================
    // OPEN RESTOCK
    // ==========================================

    const openRestock = (product) => {

        setRestockProduct(product);
        setRestockQuantity("");

    };


    // ==========================================
    // CLOSE RESTOCK
    // ==========================================

    const closeRestock = () => {

        setRestockProduct(null);
        setRestockQuantity("");

    };


    // ==========================================
    // ADD STOCK
    // ==========================================

    const handleRestock = async () => {

        const quantity = Number(restockQuantity);

        if (!quantity || quantity <= 0) {

            alert("Please enter a valid quantity.");

            return;

        }


        try {

            setRestocking(true);

            const res = await axios.put(

                `https://invoice-backend-78hd.onrender.com/api/products/${restockProduct.id}/restock`,

                {
                    quantity: quantity
                }

            );


            if (res.data.success) {

                alert(
                    `${quantity} stock added to ${restockProduct.product_name}`
                );

                // Close popup
                closeRestock();

                // Refresh inventory
                fetchProducts();

            }

        } catch (err) {

            console.log("Restock Error:", err);

            alert(
                err.response?.data?.message ||
                "Failed to add stock."
            );

        } finally {

            setRestocking(false);

        }

    };


    return (

        <div className="max-w-7xl mx-auto p-4 md:p-6">

            {/* ============================= */}
            {/* HEADER */}
            {/* ============================= */}

            <div className="mb-8">

                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                    Inventory
                </h1>

                <p className="text-gray-500 mt-1">
                    Manage your supermarket stock
                </p>

            </div>


            {/* ============================= */}
            {/* LOADING */}
            {/* ============================= */}

            {loading ? (

                <div className="text-center py-10 text-gray-500">
                    Loading inventory...
                </div>

            ) : (

                <div className="bg-white rounded-xl shadow-md overflow-hidden">

                    <div className="overflow-x-auto">

                        <table className="w-full border-collapse">

                            {/* ============================= */}
                            {/* TABLE HEADER */}
                            {/* ============================= */}

                            <thead className="bg-gray-100">

                                <tr>

                                    <th className="border p-3 w-16 text-center">
                                        #
                                    </th>

                                    <th className="border p-4 text-center">
                                        Product
                                    </th>

                                    <th className="border p-4 text-center">
                                        Price
                                    </th>

                                    <th className="border p-4 text-center">
                                        Current Stock
                                    </th>

                                    <th className="border p-4 text-center">
                                        Status
                                    </th>

                                    <th className="border p-4 text-center">
                                        Action
                                    </th>

                                </tr>

                            </thead>


                            {/* ============================= */}
                            {/* TABLE BODY */}
                            {/* ============================= */}

                            <tbody>

                                {products.map((product, index) => {

                                    const stock = Number(
                                        product.stock_quantity ?? 0
                                    );


                                    return (

                                        <tr
                                            key={product.id}
                                            className="hover:bg-gray-50"
                                        >

                                            {/* # */}

                                            <td className="border p-3 text-center">
                                                {index + 1}
                                            </td>


                                            {/* PRODUCT */}

                                            <td className="border p-4 font-semibold text-center">
                                                {product.product_name}
                                            </td>


                                            {/* PRICE */}

                                            <td className="border p-4 text-center">

                                                ₹
                                                {Number(
                                                    product.price
                                                ).toFixed(2)}

                                            </td>


                                            {/* CURRENT STOCK */}

                                            <td className="border p-4 font-semibold text-center">

                                                {stock}

                                            </td>


                                            {/* STATUS */}

                                            <td className="border p-4 text-center">

                                                {stock === 0 ? (

                                                    <span className="inline-block px-3 py-1 rounded-full text-sm bg-red-100 text-red-700">
                                                        Out of Stock
                                                    </span>

                                                ) : stock <= 10 ? (

                                                    <span className="inline-block px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-700">
                                                        Low Stock
                                                    </span>

                                                ) : (

                                                    <span className="inline-block px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">
                                                        In Stock
                                                    </span>

                                                )}

                                            </td>


                                            {/* ACTION */}

                                            <td className="border p-4 text-center">

                                                <button
                                                    onClick={() =>
                                                        openRestock(product)
                                                    }
                                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
                                                >
                                                    ➕ Add Stock
                                                </button>

                                            </td>

                                        </tr>

                                    );

                                })}

                            </tbody>

                        </table>

                    </div>

                </div>

            )}


            {/* ========================================== */}
            {/* RESTOCK MODAL */}
            {/* ========================================== */}

            {restockProduct && (

                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">

                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">

                        {/* Header */}

                        <div className="flex justify-between items-center mb-5">

                            <h2 className="text-xl font-bold text-gray-800">
                                Add Stock
                            </h2>

                            <button
                                onClick={closeRestock}
                                className="text-gray-500 hover:text-gray-800 text-2xl"
                            >
                                ×
                            </button>

                        </div>


                        {/* Product */}

                        <div className="bg-gray-100 rounded-lg p-4 mb-5">

                            <p className="text-sm text-gray-500">
                                Product
                            </p>

                            <p className="font-bold text-lg">
                                {restockProduct.product_name}
                            </p>

                            <p className="text-sm text-gray-500 mt-2">
                                Current Stock
                            </p>

                            <p className="font-bold text-blue-600">
                                {Number(
                                    restockProduct.stock_quantity ?? 0
                                )}
                            </p>

                        </div>


                        {/* Quantity */}

                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Quantity to Add
                        </label>

                        <input
                            type="number"
                            min="1"
                            step="1"
                            value={restockQuantity}
                            onChange={(e) =>
                                setRestockQuantity(e.target.value)
                            }
                            placeholder="Enter quantity"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />


                        {/* New Stock Preview */}

                        {Number(restockQuantity) > 0 && (

                            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-center">

                                <p className="text-sm text-gray-500">
                                    New Stock
                                </p>

                                <p className="text-xl font-bold text-green-600">

                                    {Number(
                                        restockProduct.stock_quantity ?? 0
                                    ) + Number(restockQuantity)}

                                </p>

                            </div>

                        )}


                        {/* Buttons */}

                        <div className="flex gap-3 mt-6">

                            <button
                                onClick={closeRestock}
                                disabled={restocking}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold"
                            >
                                Cancel
                            </button>


                            <button
                                onClick={handleRestock}
                                disabled={
                                    restocking ||
                                    !restockQuantity ||
                                    Number(restockQuantity) <= 0
                                }
                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold"
                            >

                                {restocking
                                    ? "Adding..."
                                    : "Add Stock"}

                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

};

export default Inventory;