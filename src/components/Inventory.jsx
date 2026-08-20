import React, {
    useEffect,
    useState,
    useCallback,
    useRef,
} from "react";

import axios from "axios";
import Toast from "./Toast";


const API_URL =
    "https://invoice-backend-78hd.onrender.com";


const Inventory = () => {

    // ==========================================
    // PRODUCTS
    // ==========================================

    const [products, setProducts] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [searchTerm, setSearchTerm] =
        useState("");


    // ==========================================
    // TOAST
    // ==========================================

    const [toast, setToast] =
        useState({
            message: "",
            type: "success",
        });


    // ==========================================
    // TOAST SOUND
    // ==========================================

    const successSoundRef =
        useRef(null);

    const errorSoundRef =
        useRef(null);


    useEffect(() => {

        successSoundRef.current =
            new Audio("/success-tone.mp3");

        successSoundRef.current.volume =
            1.0;


        errorSoundRef.current =
            new Audio("/error-tone.mp3");

        errorSoundRef.current.volume =
            1.0;


        return () => {

            if (successSoundRef.current) {

                successSoundRef.current.pause();

                successSoundRef.current =
                    null;

            }


            if (errorSoundRef.current) {

                errorSoundRef.current.pause();

                errorSoundRef.current =
                    null;

            }

        };

    }, []);


    // ==========================================
    // SHOW TOAST
    // ==========================================

    const showToast =
        useCallback(
            (
                message,
                type = "success"
            ) => {

                if (
                    type === "success"
                ) {

                    if (
                        successSoundRef.current
                    ) {

                        successSoundRef.current.currentTime =
                            0;

                        successSoundRef.current
                            .play()
                            .catch((error) => {

                                console.log(
                                    "Success sound could not play:",
                                    error
                                );

                            });

                    }

                }

                else if (
                    type === "error" ||
                    type === "warning"
                ) {

                    if (
                        errorSoundRef.current
                    ) {

                        errorSoundRef.current.currentTime =
                            0;

                        errorSoundRef.current
                            .play()
                            .catch((error) => {

                                console.log(
                                    "Error sound could not play:",
                                    error
                                );

                            });

                    }

                }


                setToast({
                    message,
                    type,
                });

            },
            []
        );


    // ==========================================
    // CLOSE TOAST
    // ==========================================

    const closeToast =
        useCallback(() => {

            setToast({
                message: "",
                type: "success",
            });

        }, []);


    // ==========================================
    // RESTOCK STATES
    // ==========================================

    const [restockProduct, setRestockProduct] =
        useState(null);

    const [restockQuantity, setRestockQuantity] =
        useState("");

    const [restocking, setRestocking] =
        useState(false);


    // ==========================================
    // STOCK HISTORY
    // ==========================================

    const [showStockHistory, setShowStockHistory] =
        useState(false);

    const [stockMovements, setStockMovements] =
        useState([]);

    const [historyLoading, setHistoryLoading] =
        useState(false);


    // ==========================================
    // STOCK ADJUSTMENT
    // ==========================================

    const [adjustmentProduct, setAdjustmentProduct] =
        useState(null);

    const [adjustmentQuantity, setAdjustmentQuantity] =
        useState("");

    const [adjustmentReason, setAdjustmentReason] =
        useState("");

    const [adjusting, setAdjusting] =
        useState(false);


    // ==========================================
    // STOCK STATUS MODAL
    // ==========================================

    const [stockStatusModal, setStockStatusModal] =
        useState(null);


    // ==========================================
    // FETCH PRODUCTS
    // ==========================================

    const fetchProducts =
        useCallback(
            async () => {

                try {

                    const res =
                        await axios.get(
                            `${API_URL}/api/products`
                        );


                    if (
                        res.data.success
                    ) {

                        setProducts(
                            res.data.products
                        );

                    }

                }

                catch (err) {

                    console.log(
                        "Inventory Error:",
                        err
                    );


                    showToast(
                        err.response?.data?.message ||
                            "Failed to load inventory.",
                        "error"
                    );

                }

                finally {

                    setLoading(false);

                }

            },
            [showToast]
        );


    // ==========================================
    // FETCH STOCK HISTORY
    // ==========================================

    const fetchStockHistory =
        async () => {

            try {

                setHistoryLoading(true);


                const res =
                    await axios.get(
                        `${API_URL}/api/stock-movements`,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${sessionStorage.getItem(
                                        "token"
                                    )}`,
                            },
                        }
                    );


                if (
                    res.data.success
                ) {

                    setStockMovements(
                        res.data.movements
                    );

                }

            }

            catch (err) {

                console.log(
                    "Stock History Error:",
                    err
                );


                showToast(
                    err.response?.data?.message ||
                        "Failed to load stock history.",
                    "error"
                );

            }

            finally {

                setHistoryLoading(false);

            }

        };


    // ==========================================
    // LOAD INVENTORY
    // ==========================================

    useEffect(() => {

        fetchProducts();

    }, [fetchProducts]);


    // ==========================================
    // STOCK SUMMARY
    // ==========================================

    const totalProducts =
        products.length;


    const lowStockProducts =
        products.filter(
            (product) => {

                const stock =
                    Number(
                        product.stock_quantity ?? 0
                    );


                return (
                    stock > 0 &&
                    stock <= 10
                );

            }
        );


    const outOfStockProducts =
        products.filter(
            (product) => {

                const stock =
                    Number(
                        product.stock_quantity ?? 0
                    );


                return stock === 0;

            }
        );


    // ==========================================
    // OPEN STOCK STATUS
    // ==========================================

    const openStockStatus =
        (type) => {

            setStockStatusModal(
                type
            );

        };


    // ==========================================
    // CLOSE STOCK STATUS
    // ==========================================

    const closeStockStatus =
        () => {

            setStockStatusModal(
                null
            );

        };


    // ==========================================
    // OPEN RESTOCK
    // ==========================================

    const openRestock =
        (product) => {

            setRestockProduct(
                product
            );

            setRestockQuantity(
                ""
            );

        };


    // ==========================================
    // CLOSE RESTOCK
    // ==========================================

    const closeRestock =
        () => {

            setRestockProduct(
                null
            );

            setRestockQuantity(
                ""
            );

        };


    // ==========================================
    // HANDLE RESTOCK
    // ==========================================

    const handleRestock =
        async () => {

            const quantity =
                Number(
                    restockQuantity
                );


            if (
                !Number.isInteger(
                    quantity
                ) ||
                quantity <= 0
            ) {

                showToast(
                    "Please enter a valid positive quantity.",
                    "warning"
                );

                return;

            }


            if (
                !restockProduct
            ) {

                showToast(
                    "Please select a product.",
                    "warning"
                );

                return;

            }


            try {

                setRestocking(
                    true
                );


                const res =
                    await axios.put(
                        `${API_URL}/api/products/${restockProduct.id}/restock`,
                        {
                            quantity:
                                quantity,
                        },
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${sessionStorage.getItem(
                                        "token"
                                    )}`,
                            },
                        }
                    );


                if (
                    res.data.success
                ) {

                    const productName =
                        restockProduct.product_name;


                    closeRestock();


                    await fetchProducts();


                    showToast(
                        `${quantity} stock added to ${productName}`,
                        "success"
                    );

                }

                else {

                    showToast(
                        res.data.message ||
                            "Failed to add stock.",
                        "error"
                    );

                }

            }

            catch (err) {

                console.log(
                    "Restock Error:",
                    err
                );


                showToast(
                    err.response?.data?.message ||
                        "Failed to add stock.",
                    "error"
                );

            }

            finally {

                setRestocking(
                    false
                );

            }

        };


    // ==========================================
    // OPEN ADJUSTMENT
    // ==========================================

    const openAdjustment =
        (product) => {

            setAdjustmentProduct(
                product
            );

            setAdjustmentQuantity(
                ""
            );

            setAdjustmentReason(
                ""
            );

        };


    // ==========================================
    // CLOSE ADJUSTMENT
    // ==========================================

    const closeAdjustment =
        () => {

            setAdjustmentProduct(
                null
            );

            setAdjustmentQuantity(
                ""
            );

            setAdjustmentReason(
                ""
            );

        };


    // ==========================================
    // HANDLE ADJUSTMENT
    // ==========================================

    const handleAdjustment =
        async () => {

            const quantity =
                Number(
                    adjustmentQuantity
                );


            if (
                !Number.isInteger(
                    quantity
                ) ||
                quantity === 0
            ) {

                showToast(
                    "Enter a valid adjustment quantity. Example: -5 or +5",
                    "warning"
                );

                return;

            }


            if (
                !adjustmentReason.trim()
            ) {

                showToast(
                    "Please select a reason for the adjustment.",
                    "warning"
                );

                return;

            }


            const currentStock =
                Number(
                    adjustmentProduct?.stock_quantity ??
                        0
                );


            const newStock =
                currentStock +
                quantity;


            if (
                newStock < 0
            ) {

                showToast(
                    `Stock cannot become negative. Current stock: ${currentStock}`,
                    "error"
                );

                return;

            }


            try {

                setAdjusting(
                    true
                );


                const res =
                    await axios.put(
                        `${API_URL}/api/products/${adjustmentProduct.id}/adjust-stock`,
                        {
                            quantity:
                                quantity,

                            reason:
                                adjustmentReason.trim(),
                        },
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${sessionStorage.getItem(
                                        "token"
                                    )}`,
                            },
                        }
                    );


                if (
                    res.data.success
                ) {

                    const productName =
                        adjustmentProduct.product_name;


                    closeAdjustment();


                    await fetchProducts();


                    showToast(
                        `${productName} stock adjusted successfully.`,
                        "success"
                    );

                }

                else {

                    showToast(
                        res.data.message ||
                            "Failed to adjust stock.",
                        "error"
                    );

                }

            }

            catch (err) {

                console.log(
                    "Stock Adjustment Error:",
                    err
                );


                showToast(
                    err.response?.data?.message ||
                        "Failed to adjust stock.",
                    "error"
                );

            }

            finally {

                setAdjusting(
                    false
                );

            }

        };


    // ==========================================
    // STATUS PRODUCTS
    // ==========================================

    const getStatusProducts =
        () => {

            if (
                stockStatusModal === "low"
            ) {

                return lowStockProducts;

            }


            if (
                stockStatusModal === "out"
            ) {

                return outOfStockProducts;

            }


            return [];

        };


    const statusProducts =
        getStatusProducts();


    // ==========================================
    // FILTER PRODUCTS
    // ==========================================

    const filteredProducts =
        products.filter(
            (product) =>
                String(
                    product.product_name ||
                        ""
                )
                    .toLowerCase()
                    .includes(
                        searchTerm.toLowerCase()
                    )
        );


    // ==========================================
    // RETURN
    // ==========================================

    return (

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">


            {/* ==========================================
                TOAST
            ========================================== */}

            <Toast
                message={toast.message}
                type={toast.type}
                onClose={closeToast}
            />


            {/* ==========================================
                PAGE HEADER
            ========================================== */}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

                <div>

                    <div className="flex items-center gap-3">

                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shadow-sm">

                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-5 h-5 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >

                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M20 7l-8-4-8 4m16 0v10l-8 4-8-4V7m16 0l-8 4m0 0v10"
                                />

                            </svg>

                        </div>


                        <div>

                            <h1 className="text-2xl font-bold text-slate-800">

                                Inventory

                            </h1>


                            <p className="text-sm text-slate-500 mt-0.5">

                                Manage supermarket stock and inventory

                            </p>

                        </div>

                    </div>

                </div>


                {/* STOCK MOVEMENT */}

                <button
                    type="button"
                    onClick={() => {

                        setShowStockHistory(
                            true
                        );

                        fetchStockHistory();

                    }}
                    className="inline-flex items-center justify-center gap-2 h-10 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-semibold transition shadow-sm"
                >

                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >

                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a3 3 0 016 0M9 5h6"
                        />

                    </svg>

                    Stock Movement

                </button>

            </div>


            {/* ==========================================
                MAIN CARD
            ========================================== */}

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">


                {/* ==========================================
                    SEARCH / SUMMARY HEADER
                ========================================== */}

                <div className="px-5 sm:px-6 py-5 border-b border-slate-200">

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                        <div>

                            <h2 className="text-base font-semibold text-slate-800">

                                Inventory Overview

                            </h2>

                            <p className="text-xs text-slate-500 mt-1">

                                Monitor stock levels and manage inventory

                            </p>

                        </div>


                        <div className="relative w-full lg:w-80">

                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >

                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z"
                                />

                            </svg>


                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchTerm}
                                onChange={(e) =>
                                    setSearchTerm(
                                        e.target.value
                                    )
                                }
                                className="w-full h-10 pl-9 pr-9 border border-slate-300 rounded-lg bg-slate-50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition"
                            />


                            {searchTerm && (

                                <button
                                    type="button"
                                    onClick={() =>
                                        setSearchTerm(
                                            ""
                                        )
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-lg transition"
                                    title="Clear Search"
                                >

                                    ×

                                </button>

                            )}

                        </div>

                    </div>

                </div>


                {/* ==========================================
                    SUMMARY CARDS
                ========================================== */}

                {!loading && (

                    <div className="p-5 sm:p-6 bg-slate-50/70 border-b border-slate-200">

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">


                            {/* TOTAL */}

                            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">

                                <div className="flex items-center justify-between">

                                    <div>

                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">

                                            Total Products

                                        </p>


                                        <p className="text-2xl font-bold text-slate-800 mt-1">

                                            {totalProducts}

                                        </p>


                                        <p className="text-xs text-slate-400 mt-1">

                                            Products in inventory

                                        </p>

                                    </div>


                                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">

                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="w-5 h-5 text-slate-500"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >

                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M20 7l-8-4-8 4m16 0v10l-8 4-8-4V7m16 0l-8 4m0 0L4 7"
                                            />

                                        </svg>

                                    </div>

                                </div>

                            </div>


                            {/* LOW STOCK */}

                            <button
                                type="button"
                                onClick={() =>
                                    openStockStatus(
                                        "low"
                                    )
                                }
                                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-left hover:bg-amber-50/50 hover:border-amber-200 transition"
                            >

                                <div className="flex items-center justify-between">

                                    <div>

                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">

                                            Low Stock

                                        </p>


                                        <p className="text-2xl font-bold text-amber-600 mt-1">

                                            {
                                                lowStockProducts.length
                                            }

                                        </p>


                                        <p className="text-xs text-slate-400 mt-1">

                                            Click to view products

                                        </p>

                                    </div>


                                    <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">

                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="w-5 h-5 text-amber-600"
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

                            </button>


                            {/* OUT OF STOCK */}

                            <button
                                type="button"
                                onClick={() =>
                                    openStockStatus(
                                        "out"
                                    )
                                }
                                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-left hover:bg-red-50/50 hover:border-red-200 transition"
                            >

                                <div className="flex items-center justify-between">

                                    <div>

                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">

                                            Out of Stock

                                        </p>


                                        <p className="text-2xl font-bold text-red-600 mt-1">

                                            {
                                                outOfStockProducts.length
                                            }

                                        </p>


                                        <p className="text-xs text-slate-400 mt-1">

                                            Click to view products

                                        </p>

                                    </div>


                                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">

                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="w-5 h-5 text-red-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >

                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 9v4m0 4h.01M10.29 3.86l-7.82 14A2 2 0 004.21 21h15.58a2 2 0 001.74-3.14l-7.82-14a2 2 0 00-3.42 0z"
                                            />

                                        </svg>

                                    </div>

                                </div>

                            </button>

                        </div>

                    </div>

                )}


                {/* ==========================================
                    INVENTORY TABLE
                ========================================== */}

                {loading ? (

                    <div className="px-5 py-14 text-center">

                        <div className="flex flex-col items-center">

                            <div className="w-10 h-10 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin mb-4"></div>

                            <p className="text-sm font-semibold text-slate-600">

                                Loading inventory...

                            </p>

                            <p className="text-xs text-slate-400 mt-1">

                                Please wait while inventory is loaded.

                            </p>

                        </div>

                    </div>

                ) : (

                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[900px]">

                            <thead>

                                <tr className="bg-slate-50 border-b border-slate-200">

                                    <th className="px-4 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500 w-16">

                                        #

                                    </th>


                                    <th className="px-5 py-3.5 text-left text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                        Product

                                    </th>


                                    <th className="px-5 py-3.5 text-left text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                        Price

                                    </th>


                                    <th className="px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                        Current Stock

                                    </th>


                                    <th className="px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                        Status

                                    </th>


                                    <th className="px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                        Action

                                    </th>

                                </tr>

                            </thead>


                            <tbody className="divide-y divide-slate-100">

                                {filteredProducts.length > 0 ? (

                                    filteredProducts.map(
                                        (
                                            product,
                                            index
                                        ) => {

                                            const stock =
                                                Number(
                                                    product.stock_quantity ??
                                                        0
                                                );


                                            return (

                                                <tr
                                                    key={
                                                        product.id
                                                    }
                                                    className="hover:bg-slate-50/80 transition"
                                                >


                                                    {/* NUMBER */}

                                                    <td className="px-4 py-4 text-center">

                                                        <span className="text-xs font-medium text-slate-400">

                                                            {index +
                                                                1}

                                                        </span>

                                                    </td>


                                                    {/* PRODUCT */}

                                                    <td className="px-5 py-4">

                                                        <div className="flex items-center gap-3">

                                                            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">

                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    className="w-4 h-4 text-slate-500"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                >

                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={2}
                                                                        d="M20 7l-8-4-8 4m16 0v10l-8 4-8-4V7m16 0l-8 4m0 0L4 7"
                                                                    />

                                                                </svg>

                                                            </div>


                                                            <span className="text-sm font-semibold text-slate-800">

                                                                {
                                                                    product.product_name
                                                                }

                                                            </span>

                                                        </div>

                                                    </td>


                                                    {/* PRICE */}

                                                    <td className="px-5 py-4">

                                                        <span className="text-sm font-semibold text-slate-800">

                                                            ₹
                                                            {Number(
                                                                product.price
                                                            ).toFixed(
                                                                2
                                                            )}

                                                        </span>

                                                    </td>


                                                    {/* STOCK */}

                                                    <td className="px-5 py-4 text-center">

                                                        <span
                                                            className={`text-sm font-bold ${
                                                                stock ===
                                                                0
                                                                    ? "text-red-600"
                                                                    : stock <=
                                                                      10
                                                                    ? "text-amber-600"
                                                                    : "text-slate-800"
                                                            }`}
                                                        >

                                                            {
                                                                stock
                                                            }

                                                        </span>

                                                    </td>


                                                    {/* STATUS */}

                                                    <td className="px-5 py-4 text-center">

                                                        {stock ===
                                                        0 ? (

                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 border border-red-100 text-red-700 text-xs font-semibold">

                                                                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>

                                                                Out of Stock

                                                            </span>

                                                        ) : stock <=
                                                          10 ? (

                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-100 text-amber-700 text-xs font-semibold">

                                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>

                                                                Low Stock

                                                            </span>

                                                        ) : (

                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold">

                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>

                                                                In Stock

                                                            </span>

                                                        )}

                                                    </td>


                                                    {/* ACTION */}

                                                    <td className="px-5 py-4">

                                                        <div className="flex justify-center items-center gap-2">

                                                            {/* ADD STOCK */}

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openRestock(
                                                                        product
                                                                    )
                                                                }
                                                                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition shadow-sm"
                                                                title="Add Stock"
                                                            >

                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    className="w-3.5 h-3.5"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                >

                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={2}
                                                                        d="M12 5v14m-7-7h14"
                                                                    />

                                                                </svg>

                                                                Add Stock

                                                            </button>


                                                            {/* ADJUST */}

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    openAdjustment(
                                                                        product
                                                                    )
                                                                }
                                                                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
                                                                title="Adjust Stock"
                                                            >

                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    className="w-3.5 h-3.5"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    stroke="currentColor"
                                                                >

                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={2}
                                                                        d="M10.5 6h9m-9 6h9m-9 6h9M4.5 6h.01M4.5 12h.01M4.5 18h.01"
                                                                    />

                                                                </svg>

                                                                Adjust

                                                            </button>

                                                        </div>

                                                    </td>

                                                </tr>

                                            );

                                        }
                                    )

                                ) : (

                                    <tr>

                                        <td
                                            colSpan="6"
                                            className="px-5 py-14 text-center"
                                        >

                                            <div className="flex flex-col items-center">

                                                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">

                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="w-6 h-6 text-slate-400"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >

                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M20 7l-8-4-8 4m16 0v10l-8 4-8-4V7m16 0l-8 4m0 0L4 7"
                                                        />

                                                    </svg>

                                                </div>


                                                <p className="text-sm font-semibold text-slate-600">

                                                    {searchTerm
                                                        ? `No products found for "${searchTerm}".`
                                                        : "No products found."}

                                                </p>


                                                <p className="text-xs text-slate-400 mt-1">

                                                    {searchTerm
                                                        ? "Try a different search term."
                                                        : "Add products from Product Management."}

                                                </p>

                                            </div>

                                        </td>

                                    </tr>

                                )}

                            </tbody>

                        </table>

                    </div>

                )}


                {/* ==========================================
                    TABLE FOOTER
                ========================================== */}

                {!loading &&
                    filteredProducts.length >
                        0 && (

                        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">

                            <p className="text-xs text-slate-500">

                                Showing

                                <span className="font-semibold text-slate-700">

                                    {" "}
                                    {
                                        filteredProducts.length
                                    }

                                </span>

                                {" "}product
                                {filteredProducts.length !==
                                1
                                    ? "s"
                                    : ""}

                            </p>


                            {searchTerm && (

                                <button
                                    type="button"
                                    onClick={() =>
                                        setSearchTerm(
                                            ""
                                        )
                                    }
                                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
                                >

                                    Clear search

                                </button>

                            )}

                        </div>

                    )}

            </div>


            {/* =================================================
                LOW / OUT OF STOCK MODAL
            ================================================= */}

            {stockStatusModal && (

                <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">

                    <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden">


                        {/* HEADER */}

                        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">

                            <div>

                                <h2 className="text-lg font-bold text-slate-800">

                                    {stockStatusModal ===
                                    "low"
                                        ? "Low Stock Products"
                                        : "Out of Stock Products"}

                                </h2>


                                <p className="text-xs text-slate-500 mt-1">

                                    {stockStatusModal ===
                                    "low"
                                        ? `${lowStockProducts.length} product(s) need restocking`
                                        : `${outOfStockProducts.length} product(s) are out of stock`}

                                </p>

                            </div>


                            <button
                                type="button"
                                onClick={
                                    closeStockStatus
                                }
                                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 text-xl transition"
                                title="Close"
                            >

                                ×

                            </button>

                        </div>


                        {/* BODY */}

                        <div className="p-5 overflow-y-auto max-h-[65vh]">

                            {statusProducts.length ===
                            0 ? (

                                <div className="py-10 text-center">

                                    <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-50 flex items-center justify-center mb-3">

                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="w-6 h-6 text-emerald-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >

                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M5 13l4 4L19 7"
                                            />

                                        </svg>

                                    </div>


                                    <p className="text-sm font-semibold text-slate-600">

                                        {stockStatusModal ===
                                        "low"
                                            ? "No low stock products."
                                            : "No out of stock products."}

                                    </p>

                                </div>

                            ) : (

                                <div className="overflow-x-auto">

                                    <table className="w-full min-w-[650px]">

                                        <thead>

                                            <tr className="bg-slate-50 border-b border-slate-200">

                                                <th className="px-4 py-3 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                                    #

                                                </th>


                                                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                                    Product

                                                </th>


                                                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                                    Price

                                                </th>


                                                <th className="px-4 py-3 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                                    Stock

                                                </th>


                                                <th className="px-4 py-3 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                                    Action

                                                </th>

                                            </tr>

                                        </thead>


                                        <tbody className="divide-y divide-slate-100">

                                            {statusProducts.map(
                                                (
                                                    product,
                                                    index
                                                ) => {

                                                    const stock =
                                                        Number(
                                                            product.stock_quantity ??
                                                                0
                                                        );


                                                    return (

                                                        <tr
                                                            key={
                                                                product.id
                                                            }
                                                            className="hover:bg-slate-50/80 transition"
                                                        >

                                                            <td className="px-4 py-3 text-center text-xs text-slate-400">

                                                                {
                                                                    index +
                                                                    1
                                                                }

                                                            </td>


                                                            <td className="px-4 py-3">

                                                                <div className="flex items-center gap-2.5">

                                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">

                                                                        <svg
                                                                            xmlns="http://www.w3.org/2000/svg"
                                                                            className="w-4 h-4 text-slate-500"
                                                                            fill="none"
                                                                            viewBox="0 0 24 24"
                                                                            stroke="currentColor"
                                                                        >

                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                strokeWidth={2}
                                                                                d="M20 7l-8-4-8 4m16 0v10l-8 4-8-4V7m16 0l-8 4m0 0L4 7"
                                                                            />

                                                                        </svg>

                                                                    </div>


                                                                    <span className="text-sm font-semibold text-slate-800">

                                                                        {
                                                                            product.product_name
                                                                        }

                                                                    </span>

                                                                </div>

                                                            </td>


                                                            <td className="px-4 py-3 text-sm font-semibold text-slate-800">

                                                                ₹
                                                                {Number(
                                                                    product.price
                                                                ).toFixed(
                                                                    2
                                                                )}

                                                            </td>


                                                            <td className="px-4 py-3 text-center">

                                                                <span
                                                                    className={
                                                                        stock ===
                                                                        0
                                                                            ? "text-sm font-bold text-red-600"
                                                                            : "text-sm font-bold text-amber-600"
                                                                    }
                                                                >

                                                                    {
                                                                        stock
                                                                    }

                                                                </span>

                                                            </td>


                                                            <td className="px-4 py-3 text-center">

                                                                <button
                                                                    type="button"
                                                                    onClick={() => {

                                                                        closeStockStatus();

                                                                        openRestock(
                                                                            product
                                                                        );

                                                                    }}
                                                                    className="inline-flex items-center gap-1.5 h-9 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition shadow-sm"
                                                                >

                                                                    <svg
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        className="w-3.5 h-3.5"
                                                                        fill="none"
                                                                        viewBox="0 0 24 24"
                                                                        stroke="currentColor"
                                                                    >

                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={2}
                                                                            d="M12 5v14m-7-7h14"
                                                                        />

                                                                    </svg>

                                                                    Add Stock

                                                                </button>

                                                            </td>

                                                        </tr>

                                                    );

                                                }
                                            )}

                                        </tbody>

                                    </table>

                                </div>

                            )}

                        </div>


                        {/* FOOTER */}

                        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">

                            <button
                                type="button"
                                onClick={
                                    closeStockStatus
                                }
                                className="h-10 px-4 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold transition"
                            >

                                Close

                            </button>

                        </div>

                    </div>

                </div>

            )}


            {/* =================================================
                RESTOCK MODAL
            ================================================= */}

            {restockProduct && (

                <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">

                    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">


                        {/* HEADER */}

                        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">

                            <div>

                                <h2 className="text-lg font-bold text-slate-800">

                                    Add Stock

                                </h2>


                                <p className="text-xs text-slate-500 mt-0.5">

                                    Add inventory for the selected product

                                </p>

                            </div>


                            <button
                                type="button"
                                onClick={
                                    closeRestock
                                }
                                disabled={
                                    restocking
                                }
                                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 text-xl transition disabled:opacity-50"
                            >

                                ×

                            </button>

                        </div>


                        {/* BODY */}

                        <div className="p-5">

                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5">

                                <div className="flex items-start justify-between gap-4">

                                    <div>

                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">

                                            Product

                                        </p>


                                        <p className="text-base font-bold text-slate-800 mt-1">

                                            {
                                                restockProduct.product_name
                                            }

                                        </p>

                                    </div>


                                    <div className="text-right">

                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">

                                            Current Stock

                                        </p>


                                        <p className="text-lg font-bold text-slate-800 mt-1">

                                            {Number(
                                                restockProduct.stock_quantity ??
                                                    0
                                            )}

                                        </p>

                                    </div>

                                </div>

                            </div>


                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">

                                Quantity to Add

                            </label>


                            <input
                                type="number"
                                min="1"
                                step="1"
                                value={
                                    restockQuantity
                                }
                                onChange={(e) =>
                                    setRestockQuantity(
                                        e.target.value
                                    )
                                }
                                placeholder="Enter quantity"
                                disabled={
                                    restocking
                                }
                                className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition disabled:bg-slate-50"
                            />


                            {Number(
                                restockQuantity
                            ) > 0 && (

                                <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-lg p-3">

                                    <div className="flex items-center justify-between">

                                        <p className="text-xs font-semibold text-slate-500">

                                            New Stock

                                        </p>


                                        <p className="text-lg font-bold text-emerald-600">

                                            {Number(
                                                restockProduct.stock_quantity ??
                                                    0
                                            ) +
                                                Number(
                                                    restockQuantity
                                                )}

                                        </p>

                                    </div>

                                </div>

                            )}


                            <div className="flex gap-2 mt-6">

                                <button
                                    type="button"
                                    onClick={
                                        closeRestock
                                    }
                                    disabled={
                                        restocking
                                    }
                                    className="flex-1 h-10 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                                >

                                    Cancel

                                </button>


                                <button
                                    type="button"
                                    onClick={
                                        handleRestock
                                    }
                                    disabled={
                                        restocking ||
                                        !restockQuantity ||
                                        Number(
                                            restockQuantity
                                        ) <= 0
                                    }
                                    className="flex-1 h-10 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white rounded-lg text-sm font-semibold transition shadow-sm"
                                >

                                    {restocking
                                        ? "Adding..."
                                        : "Add Stock"}

                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            )}


            {/* =================================================
                STOCK ADJUSTMENT MODAL
            ================================================= */}

            {adjustmentProduct && (

                <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">

                    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">


                        {/* HEADER */}

                        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">

                            <div>

                                <h2 className="text-lg font-bold text-slate-800">

                                    Stock Adjustment

                                </h2>


                                <p className="text-xs text-slate-500 mt-0.5">

                                    Correct damaged, lost or extra stock

                                </p>

                            </div>


                            <button
                                type="button"
                                onClick={
                                    closeAdjustment
                                }
                                disabled={
                                    adjusting
                                }
                                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 text-xl transition disabled:opacity-50"
                            >

                                ×

                            </button>

                        </div>


                        {/* BODY */}

                        <div className="p-5">

                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5">

                                <div className="flex items-start justify-between gap-4">

                                    <div>

                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">

                                            Product

                                        </p>


                                        <p className="text-base font-bold text-slate-800 mt-1">

                                            {
                                                adjustmentProduct.product_name
                                            }

                                        </p>

                                    </div>


                                    <div className="text-right">

                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">

                                            Current Stock

                                        </p>


                                        <p className="text-lg font-bold text-slate-800 mt-1">

                                            {Number(
                                                adjustmentProduct.stock_quantity ??
                                                    0
                                            )}

                                        </p>

                                    </div>

                                </div>

                            </div>


                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">

                                Adjustment Quantity

                            </label>


                            <input
                                type="number"
                                step="1"
                                value={
                                    adjustmentQuantity
                                }
                                onChange={(e) =>
                                    setAdjustmentQuantity(
                                        e.target.value
                                    )
                                }
                                placeholder="Example: -5 or +5"
                                disabled={
                                    adjusting
                                }
                                className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition disabled:bg-slate-50"
                            />


                            <p className="text-xs text-slate-400 mt-2">

                                Use a negative number to remove stock. Use a positive number to add stock.

                            </p>


                            <label className="block text-xs font-semibold text-slate-600 mt-5 mb-1.5">

                                Reason

                            </label>


                            <select
                                value={
                                    adjustmentReason
                                }
                                onChange={(e) =>
                                    setAdjustmentReason(
                                        e.target.value
                                    )
                                }
                                disabled={
                                    adjusting
                                }
                                className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white text-sm text-slate-800 focus:outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition disabled:bg-slate-50"
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


                            {adjustmentQuantity &&
                                Number(
                                    adjustmentQuantity
                                ) !== 0 && (

                                    <div
                                        className={`mt-4 rounded-lg p-3 border ${
                                            Number(
                                                adjustmentQuantity
                                            ) < 0
                                                ? "bg-red-50 border-red-100"
                                                : "bg-emerald-50 border-emerald-100"
                                        }`}
                                    >

                                        <div className="flex items-center justify-between">

                                            <p className="text-xs font-semibold text-slate-500">

                                                New Stock

                                            </p>


                                            <p
                                                className={`text-lg font-bold ${
                                                    Number(
                                                        adjustmentQuantity
                                                    ) < 0
                                                        ? "text-red-600"
                                                        : "text-emerald-600"
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

                                    </div>

                                )}


                            <div className="flex gap-2 mt-6">

                                <button
                                    type="button"
                                    onClick={
                                        closeAdjustment
                                    }
                                    disabled={
                                        adjusting
                                    }
                                    className="flex-1 h-10 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                                >

                                    Cancel

                                </button>


                                <button
                                    type="button"
                                    onClick={
                                        handleAdjustment
                                    }
                                    disabled={
                                        adjusting ||
                                        !adjustmentQuantity ||
                                        Number(
                                            adjustmentQuantity
                                        ) === 0 ||
                                        !adjustmentReason
                                    }
                                    className="flex-1 h-10 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white rounded-lg text-sm font-semibold transition shadow-sm"
                                >

                                    {adjusting
                                        ? "Adjusting..."
                                        : "Save Adjustment"}

                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            )}


            {/* =================================================
                STOCK HISTORY MODAL
            ================================================= */}

            {showStockHistory && (

                <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">

                    <div className="w-full max-w-6xl bg-white rounded-2xl shadow-2xl overflow-hidden">


                        {/* HEADER */}

                        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">

                            <div className="flex items-center gap-3">

                                <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center">

                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-5 h-5 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >

                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a3 3 0 016 0M9 5h6"
                                        />

                                    </svg>

                                </div>


                                <div>

                                    <h2 className="text-sm font-bold text-slate-800">

                                        Stock History

                                    </h2>


                                    <p className="text-xs text-slate-500 mt-0.5">

                                        View all stock movements

                                    </p>

                                </div>

                            </div>


                            <button
                                type="button"
                                onClick={() =>
                                    setShowStockHistory(
                                        false
                                    )
                                }
                                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 text-xl transition"
                                title="Close"
                            >

                                ×

                            </button>

                        </div>


                        {/* BODY */}

                        <div className="p-5 overflow-auto max-h-[70vh]">

                            {historyLoading ? (

                                <div className="py-14 text-center">

                                    <div className="w-10 h-10 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-4"></div>

                                    <p className="text-sm font-semibold text-slate-600">

                                        Loading stock history...

                                    </p>

                                </div>

                            ) : stockMovements.length ===
                              0 ? (

                                <div className="py-14 text-center">

                                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">

                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="w-6 h-6 text-slate-400"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >

                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 002-2h-2M9 5a3 3 0 016 0M9 5h6"
                                            />

                                        </svg>

                                    </div>


                                    <p className="text-sm font-semibold text-slate-600">

                                        No stock movements found.

                                    </p>


                                    <p className="text-xs text-slate-400 mt-1">

                                        Stock activity will appear here.

                                    </p>

                                </div>

                            ) : (

                                <div className="overflow-x-auto">

                                    <table className="w-full min-w-[1050px]">

                                        <thead>

                                            <tr className="bg-slate-50 border-b border-slate-200">

                                                <th className="px-4 py-3 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                                    #

                                                </th>


                                                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                                    Product

                                                </th>


                                                <th className="px-4 py-3 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                                    Type

                                                </th>


                                                <th className="px-4 py-3 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                                    Quantity

                                                </th>


                                                <th className="px-4 py-3 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                                    Before

                                                </th>


                                                <th className="px-4 py-3 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                                    After

                                                </th>


                                                <th className="px-4 py-3 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                                    Reference

                                                </th>


                                                <th className="px-4 py-3 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                                    Performed By

                                                </th>


                                                <th className="px-4 py-3 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                                    Date

                                                </th>

                                            </tr>

                                        </thead>


                                        <tbody className="divide-y divide-slate-100">

                                            {stockMovements.map(
                                                (
                                                    movement,
                                                    index
                                                ) => (

                                                    <tr
                                                        key={
                                                            movement.id
                                                        }
                                                        className="hover:bg-slate-50/80 transition"
                                                    >

                                                        <td className="px-4 py-3 text-center text-xs text-slate-400">

                                                            {
                                                                index +
                                                                1
                                                            }

                                                        </td>


                                                        <td className="px-4 py-3">

                                                            <span className="text-sm font-semibold text-slate-800">

                                                                {
                                                                    movement.product_name
                                                                }

                                                            </span>

                                                        </td>


                                                        <td className="px-4 py-3 text-center">

                                                            {movement.movement_type ===
                                                            "STOCK_IN" ? (

                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold">

                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>

                                                                    STOCK IN

                                                                </span>

                                                            ) : movement.movement_type ===
                                                              "STOCK_OUT" ? (

                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 border border-red-100 text-red-700 text-xs font-semibold">

                                                                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>

                                                                    STOCK OUT

                                                                </span>

                                                            ) : (

                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-100 text-amber-700 text-xs font-semibold">

                                                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>

                                                                    ADJUSTMENT

                                                                </span>

                                                            )}

                                                        </td>


                                                        <td className="px-4 py-3 text-center">

                                                            <span className="text-sm font-semibold text-slate-800">

                                                                {
                                                                    movement.quantity
                                                                }

                                                            </span>

                                                        </td>


                                                        <td className="px-4 py-3 text-center text-sm text-slate-600">

                                                            {
                                                                movement.stock_before
                                                            }

                                                        </td>


                                                        <td className="px-4 py-3 text-center">

                                                            <span className="text-sm font-semibold text-slate-800">

                                                                {
                                                                    movement.stock_after
                                                                }

                                                            </span>

                                                        </td>


                                                        <td className="px-4 py-3 text-center text-xs text-slate-500">

                                                            {
                                                                movement.reference_type ||
                                                                "-"
                                                            }

                                                        </td>


                                                        <td className="px-4 py-3 text-center text-sm text-slate-600">

                                                            {
                                                                movement.performed_by ||
                                                                "-"
                                                            }

                                                        </td>


                                                        <td className="px-4 py-3 text-center whitespace-nowrap text-xs text-slate-500">

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

                        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">

                            <p className="text-xs text-slate-500">

                                Showing

                                <span className="font-semibold text-slate-700">

                                    {" "}
                                    {
                                        stockMovements.length
                                    }

                                </span>

                                {" "}movement
                                {stockMovements.length !==
                                1
                                    ? "s"
                                    : ""}

                            </p>


                            <button
                                type="button"
                                onClick={() =>
                                    setShowStockHistory(
                                        false
                                    )
                                }
                                className="h-10 px-4 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold transition"
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