import React, {
    useCallback,
    useEffect,
    useState,
} from "react";

import axios from "axios";
import { jsPDF } from "jspdf";
import Toast from "./Toast";


const API_URL =
    "https://invoice-backend-78hd.onrender.com";


const Customers = () => {

    // ==========================================
    // CUSTOMERS
    // ==========================================

    const [customers, setCustomers] =
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


    const showToast = useCallback(
        (
            message,
            type = "error"
        ) => {

            setToast({
                message,
                type,
            });

        },
        []
    );


    const closeToast = useCallback(
        () => {

            setToast({
                message: "",
                type: "success",
            });

        },
        []
    );


    // ==========================================
    // PURCHASE HISTORY
    // ==========================================

    const [selectedCustomer, setSelectedCustomer] =
        useState(null);

    const [purchaseHistory, setPurchaseHistory] =
        useState([]);

    const [historyLoading, setHistoryLoading] =
        useState(false);

    const [showHistory, setShowHistory] =
        useState(false);


    // ==========================================
    // FETCH CUSTOMERS
    // ==========================================

    const fetchCustomers =
        useCallback(
            async () => {

                try {

                    setLoading(true);

                    const res =
                        await axios.get(
                            `${API_URL}/api/customers`,
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

                        setCustomers(
                            res.data.customers
                        );

                    }

                }

                catch (err) {

                    console.error(
                        "Customers Error:",
                        err
                    );


                    showToast(
                        err.response?.data?.message ||
                            "Failed to load customers.",
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
    // FETCH PURCHASE HISTORY
    // ==========================================

    const fetchPurchaseHistory =
        async (
            customer
        ) => {

            try {

                setHistoryLoading(
                    true
                );


                setSelectedCustomer(
                    customer
                );

                setPurchaseHistory(
                    []
                );

                setShowHistory(
                    true
                );


                const res =
                    await axios.get(
                        `${API_URL}/api/customers/${customer.id}/purchases`,
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

                    setSelectedCustomer(
                        res.data.customer
                    );

                    setPurchaseHistory(
                        res.data.purchases ||
                            []
                    );

                }

            }

            catch (err) {

                console.error(
                    "Purchase History Error:",
                    err
                );


                showToast(
                    err.response?.data?.message ||
                        "Failed to load purchase history.",
                    "error"
                );


                setShowHistory(
                    false
                );

            }

            finally {

                setHistoryLoading(
                    false
                );

            }

        };


    // ==========================================
    // CLOSE HISTORY
    // ==========================================

    const closeHistory =
        () => {

            setShowHistory(
                false
            );

            setSelectedCustomer(
                null
            );

            setPurchaseHistory(
                []
            );

        };


    // ==========================================
    // DOWNLOAD PDF
    // ==========================================

    const downloadCustomerPDF =
        () => {

            if (
                !selectedCustomer
            ) {

                showToast(
                    "No customer selected.",
                    "error"
                );

                return;

            }


            const doc =
                new jsPDF();


            let y = 20;


            doc.setFontSize(
                20
            );

            doc.setFont(
                "helvetica",
                "bold"
            );


            doc.text(
                "AK SUPER MARKET",
                105,
                y,
                {
                    align: "center",
                }
            );


            y += 10;


            doc.setFontSize(
                15
            );


            doc.text(
                "Customer Purchase History",
                105,
                y,
                {
                    align: "center",
                }
            );


            y += 12;


            doc.line(
                15,
                y,
                195,
                y
            );


            y += 10;


            doc.setFontSize(
                12
            );

            doc.setFont(
                "helvetica",
                "bold"
            );


            doc.text(
                "Customer Details",
                15,
                y
            );


            y += 8;


            doc.setFont(
                "helvetica",
                "normal"
            );

            doc.setFontSize(
                10
            );


            doc.text(
                `Customer: ${
                    selectedCustomer.customer_name ||
                    "-"
                }`,
                20,
                y
            );


            y += 6;


            doc.text(
                `Phone: ${
                    selectedCustomer.phone_number ||
                    "-"
                }`,
                20,
                y
            );


            y += 6;


            doc.text(
                `Loyalty Points: ${
                    selectedCustomer.loyalty_points ||
                    0
                }`,
                20,
                y
            );


            y += 6;


            doc.text(
                `Total Orders: ${
                    purchaseHistory.length
                }`,
                20,
                y
            );


            y += 12;


            doc.line(
                15,
                y,
                195,
                y
            );


            y += 10;


            doc.setFontSize(
                13
            );

            doc.setFont(
                "helvetica",
                "bold"
            );


            doc.text(
                "Purchase History",
                15,
                y
            );


            y += 9;


            if (
                !purchaseHistory ||
                purchaseHistory.length ===
                    0
            ) {

                doc.setFontSize(
                    10
                );

                doc.setFont(
                    "helvetica",
                    "normal"
                );


                doc.text(
                    "No purchases found for this customer.",
                    20,
                    y
                );

            }

            else {

                purchaseHistory.forEach(
                    (
                        purchase,
                        index
                    ) => {

                        if (
                            y > 255
                        ) {

                            doc.addPage();

                            y = 20;

                        }


                        const originalTotal =
                            Number(
                                purchase.total ||
                                    0
                            );


                        const totalRefund =
                            Number(
                                purchase.totalRefund ||
                                    0
                            );


                        const netPaid =
                            Math.max(
                                0,
                                originalTotal -
                                    totalRefund
                            );


                        doc.setFontSize(
                            11
                        );

                        doc.setFont(
                            "helvetica",
                            "bold"
                        );


                        doc.text(
                            `${index + 1}. Invoice: ${
                                purchase.invoice_number ||
                                "-"
                            }`,
                            20,
                            y
                        );


                        y += 6;


                        doc.setFontSize(
                            9
                        );

                        doc.setFont(
                            "helvetica",
                            "normal"
                        );


                        const invoiceDate =
                            purchase.invoice_date
                                ? new Date(
                                    purchase.invoice_date
                                ).toLocaleDateString(
                                    "en-IN"
                                )
                                : "-";


                        doc.text(
                            `Date: ${invoiceDate}   Time: ${
                                purchase.invoice_time ||
                                "-"
                            }`,
                            20,
                            y
                        );


                        y += 5;


                        doc.text(
                            `Cashier: ${
                                purchase.cashier_name ||
                                "-"
                            }`,
                            20,
                            y
                        );


                        y += 7;


                        doc.setFont(
                            "helvetica",
                            "bold"
                        );


                        doc.text(
                            "Product",
                            20,
                            y
                        );

                        doc.text(
                            "Qty",
                            105,
                            y
                        );

                        doc.text(
                            "Price",
                            130,
                            y
                        );

                        doc.text(
                            "Amount",
                            165,
                            y
                        );


                        y += 5;


                        doc.line(
                            20,
                            y,
                            190,
                            y
                        );


                        y += 6;


                        doc.setFont(
                            "helvetica",
                            "normal"
                        );


                        purchase.items?.forEach(
                            (
                                item
                            ) => {

                                if (
                                    y > 275
                                ) {

                                    doc.addPage();

                                    y = 20;

                                }


                                const productName =
                                    String(
                                        item.item_name ||
                                            "-"
                                    );


                                const quantity =
                                    Number(
                                        item.qty ||
                                            0
                                    );


                                const price =
                                    Number(
                                        item.price ||
                                            0
                                    );


                                const amount =
                                    Number(
                                        item.amount ||
                                            0
                                    );


                                const shortName =
                                    productName.length >
                                    38
                                        ? productName.substring(
                                            0,
                                            35
                                        ) + "..."
                                        : productName;


                                doc.text(
                                    shortName,
                                    20,
                                    y
                                );


                                doc.text(
                                    String(
                                        quantity
                                    ),
                                    105,
                                    y
                                );


                                doc.text(
                                    `RS: ${price.toFixed(
                                        2
                                    )}`,
                                    130,
                                    y
                                );


                                doc.text(
                                    `RS: ${amount.toFixed(
                                        2
                                    )}`,
                                    165,
                                    y
                                );


                                y += 6;

                            }
                        );


                        y += 3;


                        doc.line(
                            20,
                            y,
                            190,
                            y
                        );


                        y += 7;


                        doc.text(
                            `Subtotal: RS: ${Number(
                                purchase.subtotal ||
                                    0
                            ).toFixed(
                                2
                            )}`,
                            110,
                            y
                        );


                        y += 5;


                        doc.text(
                            `Discount: RS: ${Number(
                                purchase.discount ||
                                    0
                            ).toFixed(
                                2
                            )}`,
                            110,
                            y
                        );


                        y += 5;


                        doc.text(
                            `Loyalty Discount: RS: ${Number(
                                purchase.loyalty_discount ||
                                    0
                            ).toFixed(
                                2
                            )}`,
                            110,
                            y
                        );


                        y += 5;


                        doc.text(
                            `Tax: RS: ${Number(
                                purchase.tax ||
                                    0
                            ).toFixed(
                                2
                            )}`,
                            110,
                            y
                        );


                        y += 6;


                        doc.setFont(
                            "helvetica",
                            "bold"
                        );


                        doc.text(
                            `Original Total: RS: ${originalTotal.toFixed(
                                2
                            )}`,
                            110,
                            y
                        );


                        if (
                            purchase.returns &&
                            purchase.returns.length >
                                0
                        ) {

                            y += 6;


                            doc.text(
                                `Refunded: RS: ${totalRefund.toFixed(
                                    2
                                )}`,
                                110,
                                y
                            );


                            y += 6;


                            doc.text(
                                `Net Paid: RS: ${netPaid.toFixed(
                                    2
                                )}`,
                                110,
                                y
                            );

                        }


                        y += 7;


                        doc.setFont(
                            "helvetica",
                            "normal"
                        );


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


                        doc.line(
                            15,
                            y,
                            195,
                            y
                        );


                        y += 10;

                    }
                );

            }


            const pageCount =
                doc.internal.getNumberOfPages();


            for (
                let i = 1;
                i <= pageCount;
                i++
            ) {

                doc.setPage(
                    i
                );

                doc.setFontSize(
                    8
                );

                doc.setFont(
                    "helvetica",
                    "normal"
                );


                doc.text(
                    `AK SUPER MARKET - Customer Report | Page ${i} of ${pageCount}`,
                    105,
                    290,
                    {
                        align: "center",
                    }
                );

            }


            const customerName =
                selectedCustomer.customer_name
                    ?.replace(
                        /[^a-z0-9]/gi,
                        "_"
                    ) ||
                "Customer";


            doc.save(
                `AK_Super_Market_${customerName}_Purchase_History.pdf`
            );

        };


    // ==========================================
    // LOAD CUSTOMERS
    // ==========================================

    useEffect(
        () => {

            fetchCustomers();

        },
        [fetchCustomers]
    );


    // ==========================================
    // FILTER CUSTOMERS
    // ==========================================

    const filteredCustomers =
        customers.filter(
            (customer) => {

                const name =
                    customer.customer_name
                        ?.toLowerCase() ||
                    "";


                const phone =
                    customer.phone_number
                        ?.toString() ||
                    "";


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
    // SUMMARY
    // ==========================================

    const totalCustomers =
        customers.length;


    const customersWithOrders =
        customers.filter(
            (customer) =>
                Number(
                    customer.total_orders ||
                        0
                ) > 0
        ).length;


    const totalLoyaltyPoints =
        customers.reduce(
            (
                total,
                customer
            ) =>
                total +
                Number(
                    customer.loyalty_points ||
                        0
                ),
            0
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
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />

                        </svg>

                    </div>


                    <div>

                        <h1 className="text-2xl font-bold text-slate-800">

                            Customers

                        </h1>


                        <p className="text-sm text-slate-500 mt-0.5">

                            Manage customers and their purchase history

                        </p>

                    </div>

                </div>

            </div>


            {/* ==========================================
                MAIN CARD
            ========================================== */}

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">


                {/* ==========================================
                    SEARCH HEADER
                ========================================== */}

                <div className="px-5 sm:px-6 py-5 border-b border-slate-200">

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                        <div>

                            <h2 className="text-base font-semibold text-slate-800">

                                Customer Overview

                            </h2>


                            <p className="text-xs text-slate-500 mt-1">

                                View customers, loyalty points and purchase activity

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
                                placeholder="Search customers..."
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


                            {/* TOTAL CUSTOMERS */}

                            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">

                                <div className="flex items-center justify-between">

                                    <div>

                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">

                                            Total Customers

                                        </p>


                                        <p className="text-2xl font-bold text-slate-800 mt-1">

                                            {totalCustomers}

                                        </p>


                                        <p className="text-xs text-slate-400 mt-1">

                                            Customers registered

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
                                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                                            />

                                        </svg>

                                    </div>

                                </div>

                            </div>


                            {/* ACTIVE CUSTOMERS */}

                            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">

                                <div className="flex items-center justify-between">

                                    <div>

                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">

                                            Active Customers

                                        </p>


                                        <p className="text-2xl font-bold text-emerald-600 mt-1">

                                            {customersWithOrders}

                                        </p>


                                        <p className="text-xs text-slate-400 mt-1">

                                            Customers with purchases

                                        </p>

                                    </div>


                                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">

                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="w-5 h-5 text-emerald-600"
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

                                </div>

                            </div>


                            {/* LOYALTY POINTS */}

                            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">

                                <div className="flex items-center justify-between">

                                    <div>

                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">

                                            Loyalty Points

                                        </p>


                                        <p className="text-2xl font-bold text-amber-600 mt-1">

                                            {totalLoyaltyPoints}

                                        </p>


                                        <p className="text-xs text-slate-400 mt-1">

                                            Total points available

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
                                                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L5 8.72c-.783-.57-.38-1.81.588-1.81H9.05a1 1 0 00.95-.69l1.049-3.293z"
                                            />

                                        </svg>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                )}


                {/* ==========================================
                    TABLE
                ========================================== */}

                {loading ? (

                    <div className="px-5 py-14 text-center">

                        <div className="flex flex-col items-center">

                            <div className="w-10 h-10 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin mb-4"></div>


                            <p className="text-sm font-semibold text-slate-600">

                                Loading customers...

                            </p>


                            <p className="text-xs text-slate-400 mt-1">

                                Please wait while customer data is loaded.

                            </p>

                        </div>

                    </div>

                ) : (

                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[1100px]">

                            <thead>

                                <tr className="bg-slate-50 border-b border-slate-200">

                                    <th className="px-4 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500 w-16">

                                        #

                                    </th>


                                    <th className="px-5 py-3.5 text-left text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                        Customer

                                    </th>


                                    <th className="px-5 py-3.5 text-left text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                        Phone

                                    </th>


                                    <th className="px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                        Loyalty Points

                                    </th>


                                    <th className="px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                        Orders

                                    </th>


                                    <th className="px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                        Total Spent

                                    </th>


                                    <th className="px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                        Last Purchase

                                    </th>


                                    <th className="px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                        Action

                                    </th>

                                </tr>

                            </thead>


                            <tbody className="divide-y divide-slate-100">

                                {filteredCustomers.length >
                                0 ? (

                                    filteredCustomers.map(
                                        (
                                            customer,
                                            index
                                        ) => (

                                            <tr
                                                key={
                                                    customer.id
                                                }
                                                className="hover:bg-slate-50/80 transition"
                                            >

                                                {/* NUMBER */}

                                                <td className="px-4 py-4 text-center">

                                                    <span className="text-xs font-medium text-slate-400">

                                                        {
                                                            index +
                                                            1
                                                        }

                                                    </span>

                                                </td>


                                                {/* CUSTOMER */}

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
                                                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                                />

                                                            </svg>

                                                        </div>


                                                        <span className="text-sm font-semibold text-slate-800">

                                                            {
                                                                customer.customer_name
                                                            }

                                                        </span>

                                                    </div>

                                                </td>


                                                {/* PHONE */}

                                                <td className="px-5 py-4">

                                                    <span className="text-sm text-slate-600">

                                                        {
                                                            customer.phone_number
                                                        }

                                                    </span>

                                                </td>


                                                {/* LOYALTY */}

                                                <td className="px-5 py-4 text-center">

                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-100 text-amber-700 text-xs font-semibold">

                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>

                                                        {
                                                            customer.loyalty_points ||
                                                            0
                                                        }

                                                    </span>

                                                </td>


                                                {/* ORDERS */}

                                                <td className="px-5 py-4 text-center">

                                                    <span className="text-sm font-semibold text-slate-800">

                                                        {
                                                            customer.total_orders ||
                                                            0
                                                        }

                                                    </span>

                                                </td>


                                                {/* TOTAL */}

                                                <td className="px-5 py-4 text-center">

                                                    <span className="text-sm font-semibold text-slate-800">

                                                        ₹
                                                        {Number(
                                                            customer.total_spent ||
                                                                0
                                                        ).toFixed(
                                                            2
                                                        )}

                                                    </span>

                                                </td>


                                                {/* LAST PURCHASE */}

                                                <td className="px-5 py-4 text-center">

                                                    <span className="text-xs text-slate-500">

                                                        {customer.last_purchase
                                                            ? new Date(
                                                                customer.last_purchase
                                                            ).toLocaleDateString(
                                                                "en-IN"
                                                            )
                                                            : "No purchase"}

                                                    </span>

                                                </td>


                                                {/* ACTION */}

                                                <td className="px-5 py-4 text-center">

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            fetchPurchaseHistory(
                                                                customer
                                                            )
                                                        }
                                                        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition shadow-sm"
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
                                                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a3 3 0 016 0M9 5h6"
                                                            />

                                                        </svg>

                                                        View History

                                                    </button>

                                                </td>

                                            </tr>

                                        )
                                    )

                                ) : (

                                    <tr>

                                        <td
                                            colSpan="8"
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
                                                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                                                        />

                                                    </svg>

                                                </div>


                                                <p className="text-sm font-semibold text-slate-600">

                                                    {searchTerm
                                                        ? `No customers found for "${searchTerm}".`
                                                        : "No customers found."}

                                                </p>


                                                <p className="text-xs text-slate-400 mt-1">

                                                    {searchTerm
                                                        ? "Try a different search term."
                                                        : "Customer records will appear here."}

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
                    FOOTER
                ========================================== */}

                {!loading &&
                    filteredCustomers.length >
                        0 && (

                        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">

                            <p className="text-xs text-slate-500">

                                Showing

                                <span className="font-semibold text-slate-700">

                                    {" "}
                                    {
                                        filteredCustomers.length
                                    }

                                </span>

                                {" "}customer
                                {filteredCustomers.length !==
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
                CUSTOMER HISTORY MODAL
            ================================================= */}

            {showHistory && (

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

                                        Customer Purchase History

                                    </h2>


                                    {selectedCustomer && (

                                        <p className="text-xs text-slate-500 mt-0.5">

                                            {
                                                selectedCustomer.customer_name
                                            }

                                            {" • "}

                                            {
                                                selectedCustomer.phone_number
                                            }

                                        </p>

                                    )}

                                </div>

                            </div>


                            <div className="flex items-center gap-2">

                                <button
                                    type="button"
                                    onClick={
                                        downloadCustomerPDF
                                    }
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
                                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />

                                    </svg>

                                    Download PDF

                                </button>


                                <button
                                    type="button"
                                    onClick={
                                        closeHistory
                                    }
                                    className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 text-xl transition"
                                    title="Close"
                                >

                                    ×

                                </button>

                            </div>

                        </div>


                        {/* CUSTOMER SUMMARY */}

                        {selectedCustomer && (

                            <div className="p-5 sm:p-6 bg-slate-50/70 border-b border-slate-200">

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">


                                    {/* CUSTOMER */}

                                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">

                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">

                                            Customer

                                        </p>


                                        <p className="text-base font-bold text-slate-800 mt-1">

                                            {
                                                selectedCustomer.customer_name
                                            }

                                        </p>

                                    </div>


                                    {/* PHONE */}

                                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">

                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">

                                            Phone

                                        </p>


                                        <p className="text-base font-bold text-slate-800 mt-1">

                                            {
                                                selectedCustomer.phone_number
                                            }

                                        </p>

                                    </div>


                                    {/* LOYALTY */}

                                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">

                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">

                                            Loyalty Points

                                        </p>


                                        <p className="text-lg font-bold text-amber-600 mt-1">

                                            {
                                                selectedCustomer.loyalty_points ||
                                                0
                                            }

                                        </p>

                                    </div>


                                    {/* ORDERS */}

                                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">

                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">

                                            Total Orders

                                        </p>


                                        <p className="text-lg font-bold text-slate-800 mt-1">

                                            {
                                                purchaseHistory.length
                                            }

                                        </p>

                                    </div>

                                </div>

                            </div>

                        )}


                        {/* BODY */}

                        <div className="p-5 overflow-y-auto max-h-[65vh]">

                            {historyLoading ? (

                                <div className="py-14 text-center">

                                    <div className="w-10 h-10 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin mx-auto mb-4"></div>


                                    <p className="text-sm font-semibold text-slate-600">

                                        Loading purchase history...

                                    </p>

                                </div>

                            ) : purchaseHistory.length ===
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
                                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a3 3 0 016 0M9 5h6"
                                            />

                                        </svg>

                                    </div>


                                    <p className="text-sm font-semibold text-slate-600">

                                        No purchases found for this customer.

                                    </p>


                                    <p className="text-xs text-slate-400 mt-1">

                                        Purchase activity will appear here.

                                    </p>

                                </div>

                            ) : (

                                <div className="space-y-4">

                                    {purchaseHistory.map(
                                        (
                                            purchase
                                        ) => {

                                            const hasRefund =
                                                purchase.returns &&
                                                purchase.returns.length >
                                                    0;


                                            const totalRefund =
                                                Number(
                                                    purchase.totalRefund ||
                                                        0
                                                );


                                            const originalTotal =
                                                Number(
                                                    purchase.total ||
                                                        0
                                                );


                                            const netPaid =
                                                Math.max(
                                                    0,
                                                    originalTotal -
                                                        totalRefund
                                                );


                                            return (

                                                <div
                                                    key={
                                                        purchase.id
                                                    }
                                                    className="border border-slate-200 rounded-xl overflow-hidden"
                                                >


                                                    {/* INVOICE HEADER */}

                                                    <div className="px-4 py-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">

                                                        <div>

                                                            <div className="flex flex-wrap items-center gap-2">

                                                                <div className="flex items-center gap-2">

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
                                                                                d="M9 14h6m-6 4h6m2 4H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                                            />

                                                                        </svg>

                                                                    </div>


                                                                    <p className="text-sm font-bold text-slate-800">

                                                                        {
                                                                            purchase.invoice_number
                                                                        }

                                                                    </p>

                                                                </div>


                                                                {hasRefund && (

                                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 border border-red-100 text-red-700 text-xs font-semibold">

                                                                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>

                                                                        REFUNDED

                                                                    </span>

                                                                )}

                                                            </div>


                                                            <p className="text-xs text-slate-500 mt-1">

                                                                {purchase.invoice_date
                                                                    ? new Date(
                                                                        purchase.invoice_date
                                                                    ).toLocaleDateString(
                                                                        "en-IN"
                                                                    )
                                                                    : "-"}

                                                                {" • "}

                                                                {
                                                                    purchase.invoice_time ||
                                                                    "-"
                                                                }

                                                            </p>


                                                            <p className="text-xs text-slate-400 mt-1">

                                                                Cashier:{" "}

                                                                {
                                                                    purchase.cashier_name ||
                                                                    "-"
                                                                }

                                                            </p>

                                                        </div>


                                                        <div className="text-left md:text-right">

                                                            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">

                                                                Original Total

                                                            </p>


                                                            <p
                                                                className={`text-lg font-bold ${
                                                                    hasRefund
                                                                        ? "text-slate-400 line-through"
                                                                        : "text-slate-800"
                                                                }`}
                                                            >

                                                                ₹
                                                                {originalTotal.toFixed(
                                                                    2
                                                                )}

                                                            </p>


                                                            {hasRefund && (

                                                                <>

                                                                    <p className="text-xs text-red-600 font-semibold mt-1">

                                                                        Refunded: -₹
                                                                        {totalRefund.toFixed(
                                                                            2
                                                                        )}

                                                                    </p>


                                                                    <p className="text-sm text-emerald-600 font-bold mt-1">

                                                                        Net Paid: ₹
                                                                        {netPaid.toFixed(
                                                                            2
                                                                        )}

                                                                    </p>

                                                                </>

                                                            )}


                                                            <p className="text-xs text-slate-500 mt-1">

                                                                {
                                                                    purchase.payment_Method ||
                                                                    purchase.payment_method ||
                                                                    "-"
                                                                }

                                                            </p>

                                                        </div>

                                                    </div>


                                                    {/* ITEMS */}

                                                    <div className="p-4 overflow-x-auto">

                                                        <table className="w-full min-w-[650px]">

                                                            <thead>

                                                                <tr className="bg-slate-50 border-b border-slate-200">

                                                                    <th className="px-4 py-3 text-left text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                                                        Product

                                                                    </th>


                                                                    <th className="px-4 py-3 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                                                        Qty

                                                                    </th>


                                                                    <th className="px-4 py-3 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                                                        Price

                                                                    </th>


                                                                    <th className="px-4 py-3 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                                                        Amount

                                                                    </th>

                                                                </tr>

                                                            </thead>


                                                            <tbody className="divide-y divide-slate-100">

                                                                {purchase.items?.map(
                                                                    (
                                                                        item,
                                                                        index
                                                                    ) => {

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
                                                                                className="hover:bg-slate-50/80 transition"
                                                                            >

                                                                                <td className="px-4 py-3">

                                                                                    <span className="text-sm font-semibold text-slate-800">

                                                                                        {
                                                                                            item.item_name
                                                                                        }

                                                                                    </span>


                                                                                    {returnedQty >
                                                                                        0 && (

                                                                                        <p className="text-xs text-red-600 font-semibold mt-1">

                                                                                            {returnedQty} returned

                                                                                        </p>

                                                                                    )}

                                                                                </td>


                                                                                <td className="px-4 py-3 text-center">

                                                                                    <span className="text-sm text-slate-700">

                                                                                        {
                                                                                            originalQty
                                                                                        }

                                                                                    </span>


                                                                                    {returnedQty >
                                                                                        0 && (

                                                                                        <p className="text-xs text-slate-400 mt-1">

                                                                                            Remaining:{" "}

                                                                                            <span className="font-semibold text-slate-600">

                                                                                                {
                                                                                                    remainingQty
                                                                                                }

                                                                                            </span>

                                                                                        </p>

                                                                                    )}

                                                                                </td>


                                                                                <td className="px-4 py-3 text-center text-sm text-slate-700">

                                                                                    ₹
                                                                                    {Number(
                                                                                        item.price ||
                                                                                            0
                                                                                    ).toFixed(
                                                                                        2
                                                                                    )}

                                                                                </td>


                                                                                <td className="px-4 py-3 text-center">

                                                                                    <span className="text-sm font-semibold text-slate-800">

                                                                                        ₹
                                                                                        {Number(
                                                                                            item.amount ||
                                                                                                0
                                                                                        ).toFixed(
                                                                                            2
                                                                                        )}

                                                                                    </span>

                                                                                </td>

                                                                            </tr>

                                                                        );

                                                                    }
                                                                )}

                                                            </tbody>

                                                        </table>

                                                    </div>


                                                    {/* REFUND DETAILS */}

                                                    {hasRefund && (

                                                        <div className="mx-4 mb-4 border border-red-100 bg-red-50 rounded-xl p-4">

                                                            <div className="flex items-center justify-between mb-3">

                                                                <div>

                                                                    <h3 className="text-sm font-bold text-red-700">

                                                                        Refund / Return Details

                                                                    </h3>


                                                                    <p className="text-xs text-red-500 mt-0.5">

                                                                        Returned items and refund information

                                                                    </p>

                                                                </div>


                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-red-100 text-red-700 text-xs font-semibold">

                                                                    {
                                                                        purchase.refundStatus ||
                                                                        "REFUNDED"
                                                                    }

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

                                                                            <div className="flex flex-col md:flex-row md:justify-between gap-3">

                                                                                <div>

                                                                                    <p className="text-sm font-semibold text-slate-800">

                                                                                        {
                                                                                            returnItem.product_name
                                                                                        }

                                                                                    </p>


                                                                                    <p className="text-xs text-slate-500 mt-1">

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

                                                                                        <p className="text-xs text-slate-500 mt-1">

                                                                                            Reason:{" "}

                                                                                            {
                                                                                                returnItem.reason
                                                                                            }

                                                                                        </p>

                                                                                    )}


                                                                                    <p className="text-xs text-slate-400 mt-1">

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

                                                                                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">

                                                                                        Returned By

                                                                                    </p>


                                                                                    <p className="text-sm font-semibold text-slate-700 mt-1">

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


                                                    {/* TOTAL DETAILS */}

                                                    <div className="px-4 py-4 border-t border-slate-200 bg-slate-50">

                                                        <div className="flex justify-end">

                                                            <div className="w-full md:w-80 space-y-2">

                                                                <div className="flex justify-between text-sm">

                                                                    <span className="text-slate-500">

                                                                        Subtotal

                                                                    </span>


                                                                    <span className="font-medium text-slate-700">

                                                                        ₹
                                                                        {Number(
                                                                            purchase.subtotal ||
                                                                                0
                                                                        ).toFixed(
                                                                            2
                                                                        )}

                                                                    </span>

                                                                </div>


                                                                <div className="flex justify-between text-sm">

                                                                    <span className="text-slate-500">

                                                                        Discount

                                                                    </span>


                                                                    <span className="font-medium text-slate-700">

                                                                        ₹
                                                                        {Number(
                                                                            purchase.discount ||
                                                                                0
                                                                        ).toFixed(
                                                                            2
                                                                        )}

                                                                    </span>

                                                                </div>


                                                                <div className="flex justify-between text-sm">

                                                                    <span className="text-slate-500">

                                                                        Loyalty Discount

                                                                    </span>


                                                                    <span className="font-medium text-slate-700">

                                                                        ₹
                                                                        {Number(
                                                                            purchase.loyalty_discount ||
                                                                                0
                                                                        ).toFixed(
                                                                            2
                                                                        )}

                                                                    </span>

                                                                </div>


                                                                <div className="flex justify-between text-sm">

                                                                    <span className="text-slate-500">

                                                                        Tax

                                                                    </span>


                                                                    <span className="font-medium text-slate-700">

                                                                        ₹
                                                                        {Number(
                                                                            purchase.tax ||
                                                                                0
                                                                        ).toFixed(
                                                                            2
                                                                        )}

                                                                    </span>

                                                                </div>


                                                                <div className="border-t border-slate-200 pt-2 flex justify-between">

                                                                    <span className="text-sm font-bold text-slate-800">

                                                                        Original Total

                                                                    </span>


                                                                    <span className="text-base font-bold text-slate-800">

                                                                        ₹
                                                                        {originalTotal.toFixed(
                                                                            2
                                                                        )}

                                                                    </span>

                                                                </div>


                                                                {hasRefund && (

                                                                    <>

                                                                        <div className="flex justify-between text-sm">

                                                                            <span className="font-semibold text-red-600">

                                                                                Refunded

                                                                            </span>


                                                                            <span className="font-semibold text-red-600">

                                                                                - ₹
                                                                                {totalRefund.toFixed(
                                                                                    2
                                                                                )}

                                                                            </span>

                                                                        </div>


                                                                        <div className="border-t border-slate-200 pt-2 flex justify-between">

                                                                            <span className="text-sm font-bold text-slate-800">

                                                                                Net Paid

                                                                            </span>


                                                                            <span className="text-base font-bold text-emerald-600">

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


                        {/* FOOTER */}

                        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">

                            <p className="text-xs text-slate-500">

                                Showing

                                <span className="font-semibold text-slate-700">

                                    {" "}
                                    {
                                        purchaseHistory.length
                                    }

                                </span>

                                {" "}purchase
                                {purchaseHistory.length !==
                                1
                                    ? "s"
                                    : ""}

                            </p>


                            <button
                                type="button"
                                onClick={
                                    closeHistory
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


export default Customers;