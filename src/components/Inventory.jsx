import React, { useEffect, useState } from "react";
import axios from "axios";

const Inventory = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // ==========================================
    // RESTOCK STATES
    // ==========================================

    const [restockProduct, setRestockProduct] = useState(null);
    const [restockQuantity, setRestockQuantity] = useState("");
    const [restocking, setRestocking] = useState(false);

    // ==========================================
    // STOCK HISTORY STATES
    // ==========================================

    const [showStockHistory, setShowStockHistory] = useState(false);
    const [stockMovements, setStockMovements] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    // ==========================================
    // STOCK ADJUSTMENT STATES
    // ==========================================

    const [adjustmentProduct, setAdjustmentProduct] = useState(null);
    const [adjustmentQuantity, setAdjustmentQuantity] = useState("");
    const [adjustmentReason, setAdjustmentReason] = useState("");
    const [adjusting, setAdjusting] = useState(false);

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
    // FETCH STOCK HISTORY
    // ==========================================

    const fetchStockHistory = async () => {
        try {
            setHistoryLoading(true);

            const res = await axios.get(
                "https://invoice-backend-78hd.onrender.com/api/stock-movements",
                {
                    headers: {
                        Authorization: `Bearer ${sessionStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            );

            if (res.data.success) {
                setStockMovements(res.data.movements);
            }
        } catch (err) {
            console.log("Stock History Error:", err);

            alert(
                err.response?.data?.message ||
                    "Failed to load stock history."
            );
        } finally {
            setHistoryLoading(false);
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
                    quantity: quantity,
                },
                {
                    headers: {
                        Authorization: `Bearer ${sessionStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            );

            if (res.data.success) {
                alert(
                    `${quantity} stock added to ${restockProduct.product_name}`
                );

                closeRestock();

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

    // ==========================================
    // OPEN STOCK ADJUSTMENT
    // ==========================================

    const openAdjustment = (product) => {
        setAdjustmentProduct(product);
        setAdjustmentQuantity("");
        setAdjustmentReason("");
    };

    // ==========================================
    // CLOSE STOCK ADJUSTMENT
    // ==========================================

    const closeAdjustment = () => {
        setAdjustmentProduct(null);
        setAdjustmentQuantity("");
        setAdjustmentReason("");
    };

    // ==========================================
    // HANDLE STOCK ADJUSTMENT
    // ==========================================

    const handleAdjustment = async () => {
        const quantity = Number(adjustmentQuantity);

        // Quantity must be an integer and cannot be 0
        if (!Number.isInteger(quantity) || quantity === 0) {
            alert(
                "Enter a valid adjustment quantity.\nExample: -5 or +5"
            );
            return;
        }

        // Reason required
        if (!adjustmentReason.trim()) {
            alert("Please enter a reason for the adjustment.");
            return;
        }

        const currentStock = Number(
            adjustmentProduct.stock_quantity ?? 0
        );

        const newStock = currentStock + quantity;

        // Prevent negative stock
        if (newStock < 0) {
            alert(
                `Stock cannot become negative.\n\nCurrent stock: ${currentStock}\nAdjustment: ${quantity}\nNew stock: ${newStock}`
            );
            return;
        }

        try {
            setAdjusting(true);

            const res = await axios.put(
                `https://invoice-backend-78hd.onrender.com/api/products/${adjustmentProduct.id}/adjust-stock`,
                {
                    quantity: quantity,
                    reason: adjustmentReason.trim(),
                },
                {
                    headers: {
                        Authorization: `Bearer ${sessionStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            );

            if (res.data.success) {
                alert(
                    `${adjustmentProduct.product_name} stock adjusted successfully.`
                );

                closeAdjustment();

                fetchProducts();
            }
        } catch (err) {
            console.log(
                "Stock Adjustment Error:",
                err
            );

            alert(
                err.response?.data?.message ||
                    "Failed to adjust stock."
            );
        } finally {
            setAdjusting(false);
        }
    };

    // ==========================================
    // RETURN
    // ==========================================

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6">

            {/* ========================================== */}
            {/* HEADER */}
            {/* ========================================== */}

            <div className="mb-8 flex justify-between items-start">

                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                        Inventory
                    </h1>

                    <p className="text-gray-500 mt-1">
                        Manage your supermarket stock
                    </p>
                </div>

                {/* STOCK HISTORY BUTTON */}

                <button
                    onClick={() => {
                        setShowStockHistory(true);
                        fetchStockHistory();
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
                >
                    📋 Stock History
                </button>

            </div>

            {/* ========================================== */}
            {/* LOADING */}
            {/* ========================================== */}

            {loading ? (

                <div className="text-center py-10 text-gray-500">
                    Loading inventory...
                </div>

            ) : (

                <div className="bg-white rounded-xl shadow-md overflow-hidden">

                    <div className="overflow-x-auto">

                        <table className="w-full border-collapse">

                            {/* TABLE HEADER */}

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

                            {/* TABLE BODY */}

                            <tbody>

                                {products.map(
                                    (product, index) => {

                                        const stock =
                                            Number(
                                                product.stock_quantity ?? 0
                                            );

                                        return (

                                            <tr
                                                key={product.id}
                                                className="hover:bg-gray-50"
                                            >

                                                {/* # */}

                                                <td className="border p-3 text-center">
                                                    {stockMovements.length - index}
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

                                                    <div className="flex justify-center gap-2">

                                                        {/* ADD STOCK */}

                                                        <button
                                                            onClick={() =>
                                                                openRestock(
                                                                    product
                                                                )
                                                            }
                                                            className="px-3 py-1 rounded-full text-sm bg-green-500 text-white hover:bg-green-600"
                                                        >
                                                            ➕ Add Stock
                                                        </button>

                                                        {/* ADJUST STOCK */}

                                                        <button
                                                            onClick={() =>
                                                                openAdjustment(
                                                                    product
                                                                )
                                                            }
                                                            className="px-3 py-1 rounded-full text-sm bg-orange-500 text-white hover:bg-orange-600"
                                                        >
                                                            ⚙️ Adjust
                                                        </button>

                                                    </div>

                                                </td>

                                            </tr>

                                        );
                                    }
                                )}

                            </tbody>

                        </table>

                    </div>

                </div>

            )}

            {/* ================================================= */}
            {/* RESTOCK MODAL */}
            {/* ================================================= */}

            {restockProduct && (

                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">

                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">

                        {/* HEADER */}

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

                        {/* PRODUCT */}

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

                        {/* QUANTITY */}

                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Quantity to Add
                        </label>

                        <input
                            type="number"
                            min="1"
                            step="1"
                            value={restockQuantity}
                            onChange={(e) =>
                                setRestockQuantity(
                                    e.target.value
                                )
                            }
                            placeholder="Enter quantity"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        {/* NEW STOCK PREVIEW */}

                        {Number(restockQuantity) > 0 && (

                            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-center">

                                <p className="text-sm text-gray-500">
                                    New Stock
                                </p>

                                <p className="text-xl font-bold text-green-600">

                                    {Number(
                                        restockProduct.stock_quantity ?? 0
                                    ) +
                                        Number(
                                            restockQuantity
                                        )}

                                </p>

                            </div>

                        )}

                        {/* BUTTONS */}

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

            {/* ================================================= */}
            {/* STOCK ADJUSTMENT MODAL */}
            {/* ================================================= */}

            {adjustmentProduct && (

                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">

                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">

                        {/* HEADER */}

                        <div className="flex justify-between items-center mb-5">

                            <div>
                                <h2 className="text-xl font-bold text-gray-800">
                                    Stock Adjustment
                                </h2>

                                <p className="text-sm text-gray-500">
                                    Correct damaged, lost or extra stock
                                </p>
                            </div>

                            <button
                                onClick={closeAdjustment}
                                className="text-gray-500 hover:text-gray-800 text-2xl"
                            >
                                ×
                            </button>

                        </div>

                        {/* PRODUCT INFO */}

                        <div className="bg-gray-100 rounded-lg p-4 mb-5">

                            <p className="text-sm text-gray-500">
                                Product
                            </p>

                            <p className="font-bold text-lg">
                                {adjustmentProduct.product_name}
                            </p>

                            <p className="text-sm text-gray-500 mt-2">
                                Current Stock
                            </p>

                            <p className="font-bold text-blue-600 text-lg">
                                {Number(
                                    adjustmentProduct.stock_quantity ?? 0
                                )}
                            </p>

                        </div>

                        {/* ADJUSTMENT QUANTITY */}

                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Adjustment Quantity
                        </label>

                        <input
                            type="number"
                            step="1"
                            value={adjustmentQuantity}
                            onChange={(e) =>
                                setAdjustmentQuantity(
                                    e.target.value
                                )
                            }
                            placeholder="Example: -5 or +5"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />

                        <p className="text-xs text-gray-500 mt-2">
                            Use a negative number to remove stock.
                            Use a positive number to add stock.
                        </p>

                        {/* REASON */}

                        <label className="block text-sm font-semibold text-gray-700 mt-5 mb-2">
                            Reason
                        </label>

                        <select
                            value={adjustmentReason}
                            onChange={(e) =>
                                setAdjustmentReason(
                                    e.target.value
                                )
                            }
                            className="w-full border border-gray-300 rounded-lg px-4 py-3"
                        >

                            <option value="">
                                Select reason
                            </option>

                            <option value="Damaged">
                                Damaged
                            </option>

                            <option value="Lost">
                                Lost
                            </option>

                            <option value="Expired">
                                Expired
                            </option>

                            <option value="Stock Count Correction">
                                Stock Count Correction
                            </option>

                            <option value="Extra Stock Found">
                                Extra Stock Found
                            </option>

                            <option value="Other">
                                Other
                            </option>

                        </select>

                        {/* NEW STOCK PREVIEW */}

                        {adjustmentQuantity &&
                            Number(
                                adjustmentQuantity
                            ) !== 0 && (

                                <div
                                    className={`mt-4 rounded-lg p-3 text-center ${
                                        Number(
                                            adjustmentQuantity
                                        ) < 0
                                            ? "bg-red-50 border border-red-200"
                                            : "bg-green-50 border border-green-200"
                                    }`}
                                >

                                    <p className="text-sm text-gray-500">
                                        New Stock
                                    </p>

                                    <p
                                        className={`text-xl font-bold ${
                                            Number(
                                                adjustmentQuantity
                                            ) < 0
                                                ? "text-red-600"
                                                : "text-green-600"
                                        }`}
                                    >
                                        {Number(
                                            adjustmentProduct.stock_quantity ??
                                                0
                                        ) +
                                            Number(
                                                adjustmentQuantity
                                            )}
                                    </p>

                                </div>

                            )}

                        {/* BUTTONS */}

                        <div className="flex gap-3 mt-6">

                            <button
                                onClick={closeAdjustment}
                                disabled={adjusting}
                                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-semibold"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleAdjustment}
                                disabled={
                                    adjusting ||
                                    !adjustmentQuantity ||
                                    Number(
                                        adjustmentQuantity
                                    ) === 0 ||
                                    !adjustmentReason
                                }
                                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold"
                            >
                                {adjusting
                                    ? "Adjusting..."
                                    : "Save Adjustment"}
                            </button>

                        </div>

                    </div>

                </div>

            )}

            {/* ================================================= */}
            {/* STOCK HISTORY MODAL */}
            {/* ================================================= */}

            {showStockHistory && (

                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">

                    <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">

                        {/* HEADER */}

                        <div className="flex justify-between items-center p-5 border-b">

                            <div>
                                <h2 className="text-xl font-bold text-gray-800">
                                    Stock History
                                </h2>

                                <p className="text-sm text-gray-500">
                                    View all stock movements
                                </p>
                            </div>

                            <button
                                onClick={() =>
                                    setShowStockHistory(
                                        false
                                    )
                                }
                                className="text-gray-500 hover:text-gray-800 text-2xl"
                            >
                                ×
                            </button>

                        </div>

                        {/* CONTENT */}

                        <div className="p-5 overflow-auto max-h-[70vh]">

                            {historyLoading ? (

                                <div className="text-center py-10 text-gray-500">
                                    Loading stock history...
                                </div>

                            ) : stockMovements.length ===
                              0 ? (

                                <div className="text-center py-10 text-gray-500">
                                    No stock movements found.
                                </div>

                            ) : (

                                <div className="overflow-x-auto">

                                    <table className="w-full border-collapse">

                                        <thead className="bg-gray-100">

                                            <tr>

                                                <th className="border p-3">
                                                    #
                                                </th>

                                                <th className="border p-3">
                                                    Product
                                                </th>

                                                <th className="border p-3">
                                                    Type
                                                </th>

                                                <th className="border p-3">
                                                    Quantity
                                                </th>

                                                <th className="border p-3">
                                                    Before
                                                </th>

                                                <th className="border p-3">
                                                    After
                                                </th>

                                                <th className="border p-3">
                                                    Reference
                                                </th>

                                                <th className="border p-3">
                                                    Performed By
                                                </th>

                                                <th className="border p-3">
                                                    Date
                                                </th>

                                            </tr>

                                        </thead>

                                        <tbody>

                                            {stockMovements.map(
                                                (
                                                    movement,
                                                    index
                                                ) => (

                                                    <tr
                                                        key={
                                                            movement.id
                                                        }
                                                        className="hover:bg-gray-50"
                                                    >

                                                        <td className="border p-3 text-center">
                                                            {index +
                                                                1}
                                                        </td>

                                                        <td className="border p-3 font-semibold">
                                                            {
                                                                movement.product_name
                                                            }
                                                        </td>

                                                        <td className="border p-3 text-center">

                                                            {movement.movement_type ===
                                                            "STOCK_IN" ? (

                                                                <span className="px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">
                                                                    STOCK IN
                                                                </span>

                                                            ) : movement.movement_type ===
                                                              "STOCK_OUT" ? (

                                                                <span className="px-3 py-1 rounded-full text-sm bg-red-100 text-red-700">
                                                                    STOCK OUT
                                                                </span>

                                                            ) : (

                                                                <span className="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-700">
                                                                    ADJUSTMENT
                                                                </span>

                                                            )}

                                                        </td>

                                                        <td className="border p-3 text-center font-semibold">
                                                            {
                                                                movement.quantity
                                                            }
                                                        </td>

                                                        <td className="border p-3 text-center">
                                                            {
                                                                movement.stock_before
                                                            }
                                                        </td>

                                                        <td className="border p-3 text-center font-semibold">
                                                            {
                                                                movement.stock_after
                                                            }
                                                        </td>

                                                        <td className="border p-3 text-center">
                                                            {
                                                                movement.reference_type ||
                                                                "-"
                                                            }
                                                        </td>

                                                        <td className="border p-3 text-center">
                                                            {
                                                                movement.performed_by ||
                                                                "-"
                                                            }
                                                        </td>

                                                        <td className="border p-3 text-center whitespace-nowrap">
                                                            {new Date(
                                                                movement.created_at
                                                            ).toLocaleString(
                                                                "en-IN"
                                                            )}
                                                        </td>

                                                    </tr>

                                                )
                                            )}

                                        </tbody>

                                    </table>

                                </div>

                            )}

                        </div>

                        {/* FOOTER */}

                        <div className="border-t p-4 flex justify-end">

                            <button
                                onClick={() =>
                                    setShowStockHistory(
                                        false
                                    )
                                }
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-5 py-2 rounded-lg font-semibold"
                            >
                                Close
                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

};

export default Inventory;