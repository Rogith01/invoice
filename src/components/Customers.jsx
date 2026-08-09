import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Toast from "./Toast";

const Customers = () => {

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    // ==========================================
    // TOAST STATE
    // ==========================================

    const [toast, setToast] = useState({
        show: false,
        message: "",
        type: "error",
    });

    const showToast = (message, type = "error") => {
        setToast({
            show: true,
            message,
            type,
        });
    };

    // ==========================================
    // SEARCH STATE
    // ==========================================

    const [searchTerm, setSearchTerm] = useState("");

    // ==========================================
    // PURCHASE HISTORY STATES
    // ==========================================

    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [purchaseHistory, setPurchaseHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    // ==========================================
    // FETCH CUSTOMERS
    // ==========================================

const fetchCustomers = useCallback(async () => {
    try {
        setLoading(true);

        const res = await axios.get(
            "https://invoice-backend-78hd.onrender.com/api/customers",
            {
                headers: {
                    Authorization: `Bearer ${sessionStorage.getItem("token")}`,
                },
            }
        );

        if (res.data.success) {
            setCustomers(res.data.customers);
        }
    } catch (err) {
        console.error("Customers Error:", err);

        showToast(
            err.response?.data?.message ||
                "Failed to load customers.",
            "error"
        );
    } finally {
        setLoading(false);
    }
}, []);

    // ==========================================
    // FETCH CUSTOMER PURCHASE HISTORY
    // ==========================================

    const fetchPurchaseHistory = async (customer) => {

        try {

            setHistoryLoading(true);

            // Show modal immediately
            setSelectedCustomer(customer);
            setPurchaseHistory([]);
            setShowHistory(true);

            const res = await axios.get(
                `https://invoice-backend-78hd.onrender.com/api/customers/${customer.id}/purchases`,
                {
                    headers: {
                        Authorization: `Bearer ${sessionStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            );

            if (res.data.success) {

                setSelectedCustomer(
                    res.data.customer
                );

                setPurchaseHistory(
                    res.data.purchases
                );

            }

        } catch (err) {

            console.error(
                "Purchase History Error:",
                err
            );

            showToast(
                err.response?.data?.message ||
                "Failed to load purchase history.",
                "error"
            );

            setShowHistory(false);

        } finally {

            setHistoryLoading(false);

        }

    };

    // ==========================================
    // CLOSE PURCHASE HISTORY
    // ==========================================

    const closeHistory = () => {

        setShowHistory(false);
        setSelectedCustomer(null);
        setPurchaseHistory([]);

    };

    // ==========================================
    // LOAD CUSTOMERS
    // ==========================================

    useEffect(() => {

        fetchCustomers();

    }, [fetchCustomers]);

    // ==========================================
    // FILTER CUSTOMERS
    // ==========================================

    const filteredCustomers = customers.filter(
        (customer) => {

            const name =
                customer.customer_name
                    ?.toLowerCase() || "";

            const phone =
                customer.phone_number
                    ?.toString() || "";

            const search =
                searchTerm
                    .toLowerCase()
                    .trim();

            return (
                name.includes(search) ||
                phone.includes(search)
            );

        }
    );

    // ==========================================
    // RETURN
    // ==========================================

    return (

        <div className="max-w-7xl mx-auto p-4 md:p-6">

            {/* ========================================== */}
            {/* TOAST */}
            {/* ========================================== */}

            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() =>
                        setToast({
                            ...toast,
                            show: false,
                        })
                    }
                />
            )}

            {/* ========================================== */}
            {/* HEADER */}
            {/* ========================================== */}

            <div className="mb-8">

                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                    Customer Management
                </h1>

                <p className="text-gray-500 mt-1">
                    Manage customers and their purchase history
                </p>

            </div>


            {/* ========================================== */}
            {/* SEARCH */}
            {/* ========================================== */}

            <div className="mb-6">

                <div className="relative max-w-md">

                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                        🔍
                    </span>

                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) =>
                            setSearchTerm(
                                e.target.value
                            )
                        }
                        placeholder="Search customer or phone number..."
                        className="w-full border border-gray-300 rounded-lg pl-10 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {/* CLEAR SEARCH */}

                    {searchTerm && (

                        <button
                            onClick={() =>
                                setSearchTerm("")
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-lg"
                        >
                            ×
                        </button>

                    )}

                </div>

            </div>


            {/* ========================================== */}
            {/* LOADING */}
            {/* ========================================== */}

            {loading ? (

                <div className="text-center py-10 text-gray-500">
                    Loading customers...
                </div>

            ) : (

                <div className="bg-white rounded-xl shadow-md overflow-hidden">

                    <div className="overflow-x-auto">

                        <table className="w-full border-collapse">

                            {/* TABLE HEADER */}

                            <thead className="bg-gray-100">

                                <tr>

                                    <th className="border p-3">
                                        #
                                    </th>

                                    <th className="border p-3">
                                        Customer
                                    </th>

                                    <th className="border p-3">
                                        Phone
                                    </th>

                                    <th className="border p-3">
                                        Loyalty Points
                                    </th>

                                    <th className="border p-3">
                                        Orders
                                    </th>

                                    <th className="border p-3">
                                        Total Spent
                                    </th>

                                    <th className="border p-3">
                                        Last Purchase
                                    </th>

                                    <th className="border p-3">
                                        Action
                                    </th>

                                </tr>

                            </thead>


                            {/* TABLE BODY */}

                            <tbody>

                                {filteredCustomers.length > 0 ? (

                                    filteredCustomers.map(
                                        (customer, index) => (

                                            <tr
                                                key={customer.id}
                                                className="hover:bg-gray-50"
                                            >

                                                {/* NUMBER */}

                                                <td className="border p-3 text-center">
                                                    {index + 1}
                                                </td>


                                                {/* CUSTOMER */}

                                                <td className="border p-3 font-semibold">
                                                    {
                                                        customer.customer_name
                                                    }
                                                </td>


                                                {/* PHONE */}

                                                <td className="border p-3 text-center">
                                                    {
                                                        customer.phone_number
                                                    }
                                                </td>


                                                {/* LOYALTY */}

                                                <td className="border p-3 text-center">
                                                    ⭐{" "}
                                                    {
                                                        customer.loyalty_points
                                                    }
                                                </td>


                                                {/* ORDERS */}

                                                <td className="border p-3 text-center">
                                                    {
                                                        customer.total_orders
                                                    }
                                                </td>


                                                {/* TOTAL SPENT */}

                                                <td className="border p-3 text-center font-semibold">
                                                    ₹
                                                    {Number(
                                                        customer.total_spent
                                                    ).toFixed(2)}
                                                </td>


                                                {/* LAST PURCHASE */}

                                                <td className="border p-3 text-center">

                                                    {customer.last_purchase
                                                        ? new Date(
                                                            customer.last_purchase
                                                        ).toLocaleDateString(
                                                            "en-IN"
                                                        )
                                                        : "No purchase"}

                                                </td>


                                                {/* ACTION */}

                                                <td className="border p-3 text-center">

                                                    <button
                                                        onClick={() =>
                                                            fetchPurchaseHistory(
                                                                customer
                                                            )
                                                        }
                                                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-semibold"
                                                    >
                                                        🧾 View History
                                                    </button>

                                                </td>

                                            </tr>

                                        )
                                    )

                                ) : (

                                    <tr>

                                        <td
                                            colSpan="8"
                                            className="border p-8 text-center text-gray-500"
                                        >
                                            {searchTerm
                                                ? "No customers found."
                                                : "No customers available."}
                                        </td>

                                    </tr>

                                )}

                            </tbody>

                        </table>

                    </div>

                </div>

            )}


            {/* ================================================= */}
            {/* CUSTOMER PURCHASE HISTORY MODAL */}
            {/* ================================================= */}

            {showHistory && (

                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">

                    <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">


                        {/* ========================================== */}
                        {/* MODAL HEADER */}
                        {/* ========================================== */}

                        <div className="flex justify-between items-center p-5 border-b">

                            <div>

                                <h2 className="text-xl font-bold text-gray-800">
                                    Customer Purchase History
                                </h2>

                                {selectedCustomer && (

                                    <p className="text-sm text-gray-500 mt-1">

                                        {selectedCustomer.customer_name}

                                        {" • "}

                                        {selectedCustomer.phone_number}

                                    </p>

                                )}

                            </div>


                            <button
                                onClick={closeHistory}
                                className="text-gray-500 hover:text-gray-800 text-2xl"
                            >
                                ×
                            </button>

                        </div>


                        {/* ========================================== */}
                        {/* CUSTOMER SUMMARY */}
                        {/* ========================================== */}

                        {selectedCustomer && (

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-gray-50 border-b">


                                {/* NAME */}

                                <div className="bg-white rounded-lg p-4 shadow-sm">

                                    <p className="text-sm text-gray-500">
                                        Customer
                                    </p>

                                    <p className="font-bold text-gray-800">
                                        {selectedCustomer.customer_name}
                                    </p>

                                </div>


                                {/* PHONE */}

                                <div className="bg-white rounded-lg p-4 shadow-sm">

                                    <p className="text-sm text-gray-500">
                                        Phone
                                    </p>

                                    <p className="font-bold text-gray-800">
                                        {selectedCustomer.phone_number}
                                    </p>

                                </div>


                                {/* LOYALTY */}

                                <div className="bg-white rounded-lg p-4 shadow-sm">

                                    <p className="text-sm text-gray-500">
                                        Loyalty Points
                                    </p>

                                    <p className="font-bold text-yellow-600">
                                        ⭐{" "}
                                        {selectedCustomer.loyalty_points}
                                    </p>

                                </div>


                                {/* TOTAL ORDERS */}

                                <div className="bg-white rounded-lg p-4 shadow-sm">

                                    <p className="text-sm text-gray-500">
                                        Total Orders
                                    </p>

                                    <p className="font-bold text-blue-600">
                                        {purchaseHistory.length}
                                    </p>

                                </div>

                            </div>

                        )}


                        {/* ========================================== */}
                        {/* PURCHASE HISTORY CONTENT */}
                        {/* ========================================== */}

                        <div className="p-5 overflow-auto max-h-[60vh]">

                            {historyLoading ? (

                                <div className="text-center py-10 text-gray-500">
                                    Loading purchase history...
                                </div>

                            ) : purchaseHistory.length === 0 ? (

                                <div className="text-center py-10 text-gray-500">
                                    No purchases found for this customer.
                                </div>

                            ) : (

                                <div className="space-y-5">

                                    {purchaseHistory.map(
                                        (purchase) => (

                                            <div
                                                key={purchase.id}
                                                className="border rounded-xl overflow-hidden"
                                            >


                                                {/* ========================================== */}
                                                {/* INVOICE HEADER */}
                                                {/* ========================================== */}

                                                <div className="bg-gray-100 p-4 flex flex-col md:flex-row md:justify-between gap-2">

                                                    <div>

                                                        <p className="font-bold text-gray-800">
                                                            🧾{" "}
                                                            {purchase.invoice_number}
                                                        </p>

                                                        <p className="text-sm text-gray-500">

                                                            {purchase.invoice_date
                                                                ? new Date(
                                                                    purchase.invoice_date
                                                                ).toLocaleDateString(
                                                                    "en-IN"
                                                                )
                                                                : "-"
                                                            }

                                                            {" • "}

                                                            {purchase.invoice_time ||
                                                                "-"
                                                            }

                                                        </p>

                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Cashier:{" "}
                                                            {purchase.cashier_name ||
                                                                "-"
                                                            }
                                                        </p>

                                                    </div>


                                                    <div className="text-left md:text-right">

                                                        <p className="font-bold text-green-600 text-lg">
                                                            ₹
                                                            {Number(
                                                                purchase.total
                                                            ).toFixed(2)}
                                                        </p>

                                                        <p className="text-sm text-gray-500">
                                                            {purchase.payment_Method ||
                                                                "-"
                                                            }
                                                        </p>

                                                    </div>

                                                </div>


                                                {/* ========================================== */}
                                                {/* ITEMS */}
                                                {/* ========================================== */}

                                                <div className="p-4 overflow-x-auto">

                                                    <table className="w-full border-collapse">

                                                        <thead>

                                                            <tr className="bg-gray-50">

                                                                <th className="border p-2 text-left">
                                                                    Product
                                                                </th>

                                                                <th className="border p-2 text-center">
                                                                    Qty
                                                                </th>

                                                                <th className="border p-2 text-center">
                                                                    Price
                                                                </th>

                                                                <th className="border p-2 text-center">
                                                                    Amount
                                                                </th>

                                                            </tr>

                                                        </thead>


                                                        <tbody>

                                                            {purchase.items.map(
                                                                (
                                                                    item,
                                                                    index
                                                                ) => (

                                                                    <tr
                                                                        key={`${purchase.id}-${index}`}
                                                                    >

                                                                        <td className="border p-2">
                                                                            {
                                                                                item.item_name
                                                                            }
                                                                        </td>

                                                                        <td className="border p-2 text-center">
                                                                            {
                                                                                item.qty
                                                                            }
                                                                        </td>

                                                                        <td className="border p-2 text-center">
                                                                            ₹
                                                                            {Number(
                                                                                item.price
                                                                            ).toFixed(2)}
                                                                        </td>

                                                                        <td className="border p-2 text-center font-semibold">
                                                                            ₹
                                                                            {Number(
                                                                                item.amount
                                                                            ).toFixed(2)}
                                                                        </td>

                                                                    </tr>

                                                                )
                                                            )}

                                                        </tbody>

                                                    </table>

                                                </div>


                                                {/* ========================================== */}
                                                {/* INVOICE TOTAL DETAILS */}
                                                {/* ========================================== */}

                                                <div className="bg-gray-50 border-t p-4">

                                                    <div className="flex justify-end">

                                                        <div className="w-full md:w-72 space-y-2 text-sm">

                                                            <div className="flex justify-between">

                                                                <span className="text-gray-500">
                                                                    Subtotal
                                                                </span>

                                                                <span>
                                                                    ₹
                                                                    {Number(
                                                                        purchase.subtotal
                                                                    ).toFixed(2)}
                                                                </span>

                                                            </div>


                                                            <div className="flex justify-between">

                                                                <span className="text-gray-500">
                                                                    Discount
                                                                </span>

                                                                <span>
                                                                    ₹
                                                                    {Number(
                                                                        purchase.discount
                                                                    ).toFixed(2)}
                                                                </span>

                                                            </div>


                                                            <div className="flex justify-between">

                                                                <span className="text-gray-500">
                                                                    Loyalty Discount
                                                                </span>

                                                                <span>
                                                                    ₹
                                                                    {Number(
                                                                        purchase.loyalty_discount
                                                                    ).toFixed(2)}
                                                                </span>

                                                            </div>


                                                            <div className="flex justify-between">

                                                                <span className="text-gray-500">
                                                                    Tax
                                                                </span>

                                                                <span>
                                                                    ₹
                                                                    {Number(
                                                                        purchase.tax
                                                                    ).toFixed(2)}
                                                                </span>

                                                            </div>


                                                            <div className="border-t pt-2 flex justify-between font-bold text-base">

                                                                <span>
                                                                    Total
                                                                </span>

                                                                <span className="text-green-600">
                                                                    ₹
                                                                    {Number(
                                                                        purchase.total
                                                                    ).toFixed(2)}
                                                                </span>

                                                            </div>

                                                        </div>

                                                    </div>

                                                </div>

                                            </div>

                                        )
                                    )}

                                </div>

                            )}

                        </div>


                        {/* ========================================== */}
                        {/* FOOTER */}
                        {/* ========================================== */}

                        <div className="border-t p-4 flex justify-end">

                            <button
                                onClick={closeHistory}
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

export default Customers;