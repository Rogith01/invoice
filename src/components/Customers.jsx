
import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
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
                        Authorization: `Bearer ${sessionStorage.getItem(
                            "token"
                        )}`,
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
                setSelectedCustomer(res.data.customer);
                setPurchaseHistory(res.data.purchases || []);
            }
        } catch (err) {
            console.error("Purchase History Error:", err);

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
// DOWNLOAD CUSTOMER HISTORY AS PDF
// ==========================================

const downloadCustomerPDF = () => {

    if (!selectedCustomer) {
        showToast("No customer selected.", "error");
        return;
    }

    const doc = new jsPDF();

    let y = 20;

    // ==========================================
    // HEADER
    // ==========================================

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");

    doc.text(
        "AK SUPER MARKET",
        105,
        y,
        { align: "center" }
    );

    y += 10;

    doc.setFontSize(15);

    doc.text(
        "Customer Purchase History",
        105,
        y,
        { align: "center" }
    );

    y += 12;

    doc.line(15, y, 195, y);

    y += 10;

    // ==========================================
    // CUSTOMER DETAILS
    // ==========================================

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");

    doc.text("Customer Details", 15, y);

    y += 8;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    doc.text(
        `Customer: ${selectedCustomer.customer_name || "-"}`,
        20,
        y
    );

    y += 6;

    doc.text(
        `Phone: ${selectedCustomer.phone_number || "-"}`,
        20,
        y
    );

    y += 6;

    doc.text(
        `Loyalty Points: ${selectedCustomer.loyalty_points || 0}`,
        20,
        y
    );

    y += 6;

    doc.text(
        `Total Orders: ${purchaseHistory.length}`,
        20,
        y
    );

    y += 12;

    doc.line(15, y, 195, y);

    y += 10;

    // ==========================================
    // PURCHASE HISTORY
    // ==========================================

    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");

    doc.text("Purchase History", 15, y);

    y += 9;

    if (!purchaseHistory || purchaseHistory.length === 0) {

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        doc.text(
            "No purchases found for this customer.",
            20,
            y
        );

    } else {

        purchaseHistory.forEach((purchase, index) => {

            // New page if needed
            if (y > 255) {
                doc.addPage();
                y = 20;
            }

            const originalTotal =
                Number(purchase.total || 0);

            const totalRefund =
                Number(purchase.totalRefund || 0);

            const netPaid =
                Math.max(
                    0,
                    originalTotal - totalRefund
                );

            // ======================================
            // INVOICE HEADER
            // ======================================

            doc.setFontSize(11);
            doc.setFont("helvetica", "bold");

            doc.text(
                `${index + 1}. Invoice: ${
                    purchase.invoice_number || "-"
                }`,
                20,
                y
            );

            y += 6;

            doc.setFontSize(9);
            doc.setFont("helvetica", "normal");

            const invoiceDate =
                purchase.invoice_date
                    ? new Date(
                        purchase.invoice_date
                    ).toLocaleDateString("en-IN")
                    : "-";

            doc.text(
                `Date: ${invoiceDate}   Time: ${
                    purchase.invoice_time || "-"
                }`,
                20,
                y
            );

            y += 5;

            doc.text(
                `Cashier: ${
                    purchase.cashier_name || "-"
                }`,
                20,
                y
            );

            y += 7;

            // ======================================
            // ITEMS HEADER
            // ======================================

            doc.setFont("helvetica", "bold");

            doc.text("Product", 20, y);
            doc.text("Qty", 105, y);
            doc.text("Price", 130, y);
            doc.text("Amount", 165, y);

            y += 5;

            doc.line(20, y, 190, y);

            y += 6;

            // ======================================
            // ITEMS
            // ======================================

            doc.setFont("helvetica", "normal");

            purchase.items?.forEach((item) => {

                if (y > 275) {

                    doc.addPage();
                    y = 20;

                }

                const productName =
                    String(
                        item.item_name || "-"
                    );

                const quantity =
                    Number(item.qty || 0);

                const price =
                    Number(item.price || 0);

                const amount =
                    Number(item.amount || 0);

                // Keep long product names inside page
                const shortName =
                    productName.length > 38
                        ? productName.substring(0, 35) + "..."
                        : productName;

                doc.text(
                    shortName,
                    20,
                    y
                );

                doc.text(
                    String(quantity),
                    105,
                    y
                );

                doc.text(
                    `RS: ${price.toFixed(2)}`,
                    130,
                    y
                );

                doc.text(
                    `RS: ${amount.toFixed(2)}`,
                    165,
                    y
                );

                y += 6;

            });

            y += 3;

            doc.line(20, y, 190, y);

            y += 7;

            // ======================================
            // TOTAL DETAILS
            // ======================================

            doc.text(
                `Subtotal: RS: ${
                    Number(
                        purchase.subtotal || 0
                    ).toFixed(2)
                }`,
                110,
                y
            );

            y += 5;

            doc.text(
                `Discount: RS: ${
                    Number(
                        purchase.discount || 0
                    ).toFixed(2)
                }`,
                110,
                y
            );

            y += 5;

            doc.text(
                `Loyalty Discount: RS: ${
                    Number(
                        purchase.loyalty_discount || 0
                    ).toFixed(2)
                }`,
                110,
                y
            );

            y += 5;

            doc.text(
                `Tax: RS: ${
                    Number(
                        purchase.tax || 0
                    ).toFixed(2)
                }`,
                110,
                y
            );

            y += 6;

            doc.setFont("helvetica", "bold");

            doc.text(
                `Original Total: RS: ${
                    originalTotal.toFixed(2)
                }`,
                110,
                y
            );

            // ======================================
            // REFUND
            // ======================================

            if (
                purchase.returns &&
                purchase.returns.length > 0
            ) {

                y += 6;

                doc.text(
                    `Refunded: RS: ${
                        totalRefund.toFixed(2)
                    }`,
                    110,
                    y
                );

                y += 6;

                doc.text(
                    `Net Paid: RS: ${
                        netPaid.toFixed(2)
                    }`,
                    110,
                    y
                );

            }

            y += 7;

            doc.setFont("helvetica", "normal");

            doc.text(
                `Payment: ${
                    purchase.payment_Method ||
                    purchase.payment_method ||
                    "-"
                }`,
                20,
                y
            );

            y += 10;

            doc.line(15, y, 195, y);

            y += 10;

        });

    }

    // ==========================================
    // FOOTER
    // ==========================================

    const pageCount =
        doc.internal.getNumberOfPages();

    for (
        let i = 1;
        i <= pageCount;
        i++
    ) {

        doc.setPage(i);

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");

        doc.text(
            `AK SUPER MARKET - Customer Report | Page ${i} of ${pageCount}`,
            105,
            290,
            {
                align: "center"
            }
        );

    }

    // ==========================================
    // DOWNLOAD
    // ==========================================

    const customerName =
        selectedCustomer.customer_name
            ?.replace(/[^a-z0-9]/gi, "_") ||
        "Customer";

    doc.save(
        `AK_Super_Market_${customerName}_Purchase_History.pdf`
    );
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

    const filteredCustomers = customers.filter((customer) => {
        const name =
            customer.customer_name?.toLowerCase() || "";

        const phone =
            customer.phone_number?.toString() || "";

        const search =
            searchTerm.toLowerCase().trim();

        return (
            name.includes(search) ||
            phone.includes(search)
        );
    });

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
                            setSearchTerm(e.target.value)
                        }
                        placeholder="Search customer or phone number..."
                        className="w-full border border-gray-300 rounded-lg pl-10 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm("")}
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

                            <tbody>

                                {filteredCustomers.length > 0 ? (

                                    filteredCustomers.map(
                                        (customer, index) => (

                                            <tr
                                                key={customer.id}
                                                className="hover:bg-gray-50"
                                            >

                                                <td className="border p-3 text-center">
                                                    {index + 1}
                                                </td>

                                                <td className="border p-3 font-semibold">
                                                    {customer.customer_name}
                                                </td>

                                                <td className="border p-3 text-center">
                                                    {customer.phone_number}
                                                </td>

                                                <td className="border p-3 text-center">
                                                    ⭐{" "}
                                                    {customer.loyalty_points}
                                                </td>

                                                <td className="border p-3 text-center">
                                                    {customer.total_orders}
                                                </td>

                                                <td className="border p-3 text-center font-semibold">
                                                    ₹
                                                    {Number(
                                                        customer.total_spent
                                                    ).toFixed(2)}
                                                </td>

                                                <td className="border p-3 text-center">

                                                    {customer.last_purchase
                                                        ? new Date(
                                                            customer.last_purchase
                                                        ).toLocaleDateString(
                                                            "en-IN"
                                                        )
                                                        : "No purchase"}

                                                </td>

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

                            <div className="flex items-center gap-2">

                                <button
                                    onClick={downloadCustomerPDF}
                                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2"
                                >
                                    📄 Download PDF
                                </button>

                                <button
                                    onClick={closeHistory}
                                    className="text-gray-500 hover:text-gray-800 text-2xl px-2"
                                >
                                    ×
                                </button>

                            </div>

                        </div>

                        {/* ========================================== */}
                        {/* CUSTOMER SUMMARY */}
                        {/* ========================================== */}

                        {selectedCustomer && (

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 bg-gray-50 border-b">

                                <div className="bg-white rounded-lg p-4 shadow-sm">

                                    <p className="text-sm text-gray-500">
                                        Customer
                                    </p>

                                    <p className="font-bold text-gray-800">
                                        {selectedCustomer.customer_name}
                                    </p>

                                </div>

                                <div className="bg-white rounded-lg p-4 shadow-sm">

                                    <p className="text-sm text-gray-500">
                                        Phone
                                    </p>

                                    <p className="font-bold text-gray-800">
                                        {selectedCustomer.phone_number}
                                    </p>

                                </div>

                                <div className="bg-white rounded-lg p-4 shadow-sm">

                                    <p className="text-sm text-gray-500">
                                        Loyalty Points
                                    </p>

                                    <p className="font-bold text-yellow-600">
                                        ⭐{" "}
                                        {selectedCustomer.loyalty_points}
                                    </p>

                                </div>

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
                                        (purchase) => {

                                            // ==========================================
                                            // BACKEND RETURN VALUES
                                            // ==========================================

                                            const hasRefund =
                                                purchase.returns &&
                                                purchase.returns.length > 0;

                                            const totalRefund =
                                                Number(
                                                    purchase.totalRefund || 0
                                                );

                                            const originalTotal =
                                                Number(
                                                    purchase.total || 0
                                                );

                                            const netPaid =
                                                Math.max(
                                                    0,
                                                    originalTotal -
                                                        totalRefund
                                                );

                                            return (

                                                <div
                                                    key={purchase.id}
                                                    className={`border rounded-xl overflow-hidden ${
                                                        hasRefund
                                                            ? "border-red-300"
                                                            : "border-gray-200"
                                                    }`}
                                                >

                                                    {/* ========================================== */}
                                                    {/* INVOICE HEADER */}
                                                    {/* ========================================== */}

                                                    <div className="bg-gray-100 p-4 flex flex-col md:flex-row md:justify-between gap-2">

                                                        <div>

                                                            <div className="flex flex-wrap items-center gap-2">

                                                                <p className="font-bold text-gray-800">
                                                                    🧾{" "}
                                                                    {
                                                                        purchase.invoice_number
                                                                    }
                                                                </p>

                                                                {hasRefund && (

                                                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
                                                                        🔴 REFUNDED
                                                                    </span>

                                                                )}

                                                            </div>

                                                            <p className="text-sm text-gray-500">

                                                                {purchase.invoice_date
                                                                    ? new Date(
                                                                        purchase.invoice_date
                                                                    ).toLocaleDateString(
                                                                        "en-IN"
                                                                    )
                                                                    : "-"}

                                                                {" • "}

                                                                {purchase.invoice_time ||
                                                                    "-"}

                                                            </p>

                                                            <p className="text-xs text-gray-500 mt-1">

                                                                Cashier:{" "}

                                                                {purchase.cashier_name ||
                                                                    "-"}

                                                            </p>

                                                        </div>

                                                        <div className="text-left md:text-right">

                                                            {/* ORIGINAL TOTAL */}

                                                            <p className="text-xs text-gray-500">
                                                                Original Total
                                                            </p>

                                                            <p
                                                                className={`font-bold text-lg ${
                                                                    hasRefund
                                                                        ? "text-gray-500 line-through"
                                                                        : "text-green-600"
                                                                }`}
                                                            >
                                                                ₹
                                                                {originalTotal.toFixed(
                                                                    2
                                                                )}
                                                            </p>

                                                            {/* REFUND */}

                                                            {hasRefund && (

                                                                <>

                                                                    <p className="text-sm text-red-600 font-semibold">

                                                                        Refunded: -₹
                                                                        {totalRefund.toFixed(
                                                                            2
                                                                        )}

                                                                    </p>

                                                                    <p className="text-sm text-green-600 font-bold">

                                                                        Net Paid: ₹
                                                                        {netPaid.toFixed(
                                                                            2
                                                                        )}

                                                                    </p>

                                                                </>

                                                            )}

                                                            <p className="text-sm text-gray-500 mt-1">

                                                                {purchase.payment_Method ||
                                                                    purchase.payment_method ||
                                                                    "-"}

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

                                                                    <th className="border p-2 text-center">
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

                                                                {purchase.items?.map(
                                                                    (
                                                                        item,
                                                                        index
                                                                    ) => {

                                                                        // ==========================================
                                                                        // CALCULATE RETURNED QTY
                                                                        // ==========================================

                                                                        const returnedQty =
                                                                            purchase.returns
                                                                                ?.filter(
                                                                                    returnItem =>
                                                                                        Number(
                                                                                            returnItem.product_id
                                                                                        ) ===
                                                                                            Number(
                                                                                                item.product_id
                                                                                            ) ||
                                                                                        returnItem.product_name ===
                                                                                            item.item_name
                                                                                )
                                                                                .reduce(
                                                                                    (
                                                                                        sum,
                                                                                        returnItem
                                                                                    ) =>
                                                                                        sum +
                                                                                        Number(
                                                                                            returnItem.return_qty ||
                                                                                                0
                                                                                        ),
                                                                                    0
                                                                                ) ||
                                                                            0;

                                                                        const originalQty =
                                                                            Number(
                                                                                item.qty ||
                                                                                    0
                                                                            );

                                                                        const remainingQty =
                                                                            Math.max(
                                                                                0,
                                                                                originalQty -
                                                                                    returnedQty
                                                                            );

                                                                        return (

                                                                            <tr
                                                                                key={`${purchase.id}-${index}`}
                                                                            >

                                                                                {/* PRODUCT */}

                                                                                <td className="border p-2 text-center">

                                                                                    <div className="font-medium">
                                                                                        {
                                                                                            item.item_name
                                                                                        }
                                                                                    </div>

                                                                                    {returnedQty >
                                                                                        0 && (

                                                                                        <div className="text-xs text-red-600 font-semibold mt-1">

                                                                                            ↩{" "}
                                                                                            {
                                                                                                returnedQty
                                                                                            }{" "}
                                                                                            returned

                                                                                        </div>

                                                                                    )}

                                                                                </td>

                                                                                {/* QTY */}

                                                                                <td className="border p-2 text-center">

                                                                                    <div>
                                                                                        {
                                                                                            originalQty
                                                                                        }
                                                                                    </div>

                                                                                    {returnedQty >
                                                                                        0 && (

                                                                                        <div className="text-xs text-gray-500 mt-1">

                                                                                            Remaining:{" "}

                                                                                            <span className="font-semibold">
                                                                                                {
                                                                                                    remainingQty
                                                                                                }
                                                                                            </span>

                                                                                        </div>

                                                                                    )}

                                                                                </td>

                                                                                {/* PRICE */}

                                                                                <td className="border p-2 text-center">

                                                                                    ₹
                                                                                    {Number(
                                                                                        item.price ||
                                                                                            0
                                                                                    ).toFixed(
                                                                                        2
                                                                                    )}

                                                                                </td>

                                                                                {/* AMOUNT */}

                                                                                <td className="border p-2 text-center font-semibold">

                                                                                    ₹
                                                                                    {Number(
                                                                                        item.amount ||
                                                                                            0
                                                                                    ).toFixed(
                                                                                        2
                                                                                    )}

                                                                                </td>

                                                                            </tr>

                                                                        );
                                                                    }
                                                                )}

                                                            </tbody>

                                                        </table>

                                                    </div>

                                                    {/* ========================================== */}
                                                    {/* REFUND DETAILS */}
                                                    {/* ========================================== */}

                                                    {hasRefund && (

                                                        <div className="mx-4 mb-4 border border-red-200 bg-red-50 rounded-lg p-4">

                                                            <div className="flex items-center justify-between mb-3">

                                                                <h3 className="font-bold text-red-700">
                                                                    ↩ Refund / Return Details
                                                                </h3>

                                                                <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold">
                                                                    {purchase.refundStatus ||
                                                                        "REFUNDED"}
                                                                </span>

                                                            </div>

                                                            <div className="space-y-2">

                                                                {purchase.returns?.map(
                                                                    (
                                                                        returnItem
                                                                    ) => (

                                                                        <div
                                                                            key={
                                                                                returnItem.id
                                                                            }
                                                                            className="bg-white rounded-lg p-3 border border-red-100"
                                                                        >

                                                                            <div className="flex flex-col md:flex-row md:justify-between gap-2">

                                                                                <div>

                                                                                    <p className="font-semibold text-gray-800">
                                                                                        {
                                                                                            returnItem.product_name
                                                                                        }
                                                                                    </p>

                                                                                    <p className="text-sm text-gray-500">

                                                                                        Returned Qty:{" "}

                                                                                        <span className="font-semibold text-red-600">
                                                                                            {
                                                                                                returnItem.return_qty
                                                                                            }
                                                                                        </span>

                                                                                        {" • "}

                                                                                        Refund: ₹
                                                                                        {Number(
                                                                                            returnItem.refund_amount ||
                                                                                                0
                                                                                        ).toFixed(
                                                                                            2
                                                                                        )}

                                                                                    </p>

                                                                                    {returnItem.reason && (

                                                                                        <p className="text-xs text-gray-500 mt-1">

                                                                                            Reason:{" "}

                                                                                            {
                                                                                                returnItem.reason
                                                                                            }

                                                                                        </p>

                                                                                    )}

                                                                                    <p className="text-xs text-gray-400 mt-1">

                                                                                        {returnItem.created_at
                                                                                            ? new Date(
                                                                                                returnItem.created_at
                                                                                            ).toLocaleString(
                                                                                                "en-IN"
                                                                                            )
                                                                                            : ""}

                                                                                    </p>

                                                                                </div>

                                                                                <div className="text-left md:text-right">

                                                                                    <p className="text-xs text-gray-400">
                                                                                        Returned by
                                                                                    </p>

                                                                                    <p className="text-sm font-semibold text-gray-700">
                                                                                        {
                                                                                            returnItem.returned_by ||
                                                                                            "-"
                                                                                        }
                                                                                    </p>

                                                                                </div>

                                                                            </div>

                                                                        </div>

                                                                    )
                                                                )}

                                                            </div>

                                                        </div>

                                                    )}

                                                    {/* ========================================== */}
                                                    {/* INVOICE TOTAL DETAILS */}
                                                    {/* ========================================== */}

                                                    <div className="bg-gray-50 border-t p-4">

                                                        <div className="flex justify-end">

                                                            <div className="w-full md:w-72 space-y-2 text-sm">

                                                                {/* SUBTOTAL */}

                                                                <div className="flex justify-between">

                                                                    <span className="text-gray-500">
                                                                        Subtotal
                                                                    </span>

                                                                    <span>
                                                                        ₹
                                                                        {Number(
                                                                            purchase.subtotal ||
                                                                                0
                                                                        ).toFixed(
                                                                            2
                                                                        )}
                                                                    </span>

                                                                </div>

                                                                {/* DISCOUNT */}

                                                                <div className="flex justify-between">

                                                                    <span className="text-gray-500">
                                                                        Discount
                                                                    </span>

                                                                    <span>
                                                                        ₹
                                                                        {Number(
                                                                            purchase.discount ||
                                                                                0
                                                                        ).toFixed(
                                                                            2
                                                                        )}
                                                                    </span>

                                                                </div>

                                                                {/* LOYALTY DISCOUNT */}

                                                                <div className="flex justify-between">

                                                                    <span className="text-gray-500">
                                                                        Loyalty Discount
                                                                    </span>

                                                                    <span>
                                                                        ₹
                                                                        {Number(
                                                                            purchase.loyalty_discount ||
                                                                                0
                                                                        ).toFixed(
                                                                            2
                                                                        )}
                                                                    </span>

                                                                </div>

                                                                {/* TAX */}

                                                                <div className="flex justify-between">

                                                                    <span className="text-gray-500">
                                                                        Tax
                                                                    </span>

                                                                    <span>
                                                                        ₹
                                                                        {Number(
                                                                            purchase.tax ||
                                                                                0
                                                                        ).toFixed(
                                                                            2
                                                                        )}
                                                                    </span>

                                                                </div>

                                                                {/* ORIGINAL TOTAL */}

                                                                <div className="border-t pt-2 flex justify-between font-bold text-base">

                                                                    <span>
                                                                        Original Total
                                                                    </span>

                                                                    <span>
                                                                        ₹
                                                                        {originalTotal.toFixed(
                                                                            2
                                                                        )}
                                                                    </span>

                                                                </div>

                                                                {/* REFUND */}

                                                                {hasRefund && (

                                                                    <>

                                                                        <div className="flex justify-between text-red-600 font-semibold">

                                                                            <span>
                                                                                Refunded
                                                                            </span>

                                                                            <span>
                                                                                - ₹
                                                                                {totalRefund.toFixed(
                                                                                    2
                                                                                )}
                                                                            </span>

                                                                        </div>

                                                                        {/* NET PAID */}

                                                                        <div className="border-t pt-2 flex justify-between font-bold text-base">

                                                                            <span>
                                                                                Net Paid
                                                                            </span>

                                                                            <span className="text-green-600">
                                                                                ₹
                                                                                {netPaid.toFixed(
                                                                                    2
                                                                                )}
                                                                            </span>

                                                                        </div>

                                                                    </>

                                                                )}

                                                            </div>

                                                        </div>

                                                    </div>

                                                </div>

                                            );
                                        }
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
