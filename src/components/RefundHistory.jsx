import React, {
    useEffect,
    useState,
    useCallback,
} from "react";

import { useNavigate } from "react-router-dom";

import Toast from "./Toast";

import api from "../api";


// ==========================================
// REFUND HISTORY
// ==========================================

const RefundHistory = () => {

    const navigate = useNavigate();


    // ==========================================
    // REFUNDS
    // ==========================================

    const [refunds, setRefunds] =
        useState([]);

    const [search, setSearch] =
        useState("");

    const [loading, setLoading] =
        useState(true);


    // ==========================================
    // TOAST
    // ==========================================

    const [toast, setToast] =
        useState({
            message: "",
            type: "success",
        });


    // ==========================================
    // SHOW TOAST
    // ==========================================

    const showToast = (
        message,
        type = "success"
    ) => {

        setToast({
            message,
            type,
        });

    };


    // ==========================================
    // CLOSE TOAST
    // ==========================================

    const hideToast = () => {

        setToast({
            message: "",
            type: "success",
        });

    };


    // ==========================================
    // FETCH REFUND HISTORY
    // ==========================================

    const fetchRefundHistory =
        useCallback(
            async () => {

                try {

                    setLoading(true);


                    // ==========================================
                    // API REQUEST
                    // JWT TOKEN IS AUTOMATICALLY ATTACHED
                    // BY api.js INTERCEPTOR
                    // ==========================================

                    const res =
                        await api.get(
                            "/api/refund-history"
                        );


                    if (
                        res.data.success
                    ) {

                        setRefunds(
                            res.data.refunds || []
                        );

                    }

                    else {

                        showToast(
                            res.data.message ||
                                "Failed to load refund history.",
                            "error"
                        );

                    }

                }

                catch (err) {

                    console.log(
                        "Refund History Error:",
                        err
                    );


                    if (
                        err.response?.status ===
                        401
                    ) {

                        showToast(
                            "Please login again.",
                            "warning"
                        );

                    }

                    else {

                        showToast(
                            "Failed to load refund history.",
                            "error"
                        );

                    }

                }

                finally {

                    setLoading(false);

                }

            },
            []
        );


    // ==========================================
    // LOAD REFUNDS
    // ==========================================

    useEffect(() => {

        fetchRefundHistory();

    }, [fetchRefundHistory]);


    // ==========================================
    // FILTER REFUNDS
    // ==========================================

    const filteredRefunds =
        refunds.filter(
            (refund) => {

                const searchText =
                    search
                        .toLowerCase()
                        .trim();


                return (

                    String(
                        refund.invoice_number ||
                            ""
                    )
                        .toLowerCase()
                        .includes(
                            searchText
                        )

                    ||

                    String(
                        refund.product_name ||
                            ""
                    )
                        .toLowerCase()
                        .includes(
                            searchText
                        )

                    ||

                    String(
                        refund.reason ||
                            ""
                    )
                        .toLowerCase()
                        .includes(
                            searchText
                        )

                    ||

                    String(
                        refund.returned_by ||
                            ""
                    )
                        .toLowerCase()
                        .includes(
                            searchText
                        )

                );

            }
        );


    // ==========================================
    // TOTAL REFUND AMOUNT
    // ==========================================

    const totalRefundAmount =
        filteredRefunds.reduce(
            (
                sum,
                refund
            ) =>
                sum +
                Number(
                    refund.refund_amount ||
                        0
                ),
            0
        );


    // ==========================================
    // TOTAL RETURNED QUANTITY
    // ==========================================

    const totalReturnedQuantity =
        filteredRefunds.reduce(
            (
                sum,
                refund
            ) =>
                sum +
                Number(
                    refund.return_qty ||
                        0
                ),
            0
        );


    // ==========================================
    // RENDER
    // ==========================================

    return (

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">


            {/* ==========================================
                TOAST
            ========================================== */}

            <Toast
                message={
                    toast.message
                }
                type={
                    toast.type
                }
                onClose={
                    hideToast
                }
            />


            {/* ==========================================
                PAGE HEADER
            ========================================== */}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

                <div>

                    <div className="flex items-center gap-3">

                        {/* ICON */}

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
                                    d="M9 14l-4-4 4-4"
                                />

                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 10h9a5 5 0 015 5v1"
                                />

                            </svg>

                        </div>


                        {/* TITLE */}

                        <div>

                            <h1 className="text-2xl font-bold text-slate-800">

                                Refund History

                            </h1>


                            <p className="text-sm text-slate-500 mt-0.5">

                                View returned products and refunded transactions

                            </p>

                        </div>

                    </div>

                </div>


                {/* RECORD COUNT + INVOICE BUTTON */}

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">

                    {/* COUNT */}

                    <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm">

                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>

                        <span className="text-sm font-semibold text-slate-700">

                            {filteredRefunds.length} Refund
                            {filteredRefunds.length !== 1
                                ? "s"
                                : ""}

                        </span>

                    </div>


                    {/* INVOICE HISTORY */}

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/invoices"
                            )
                        }
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
                                d="M10 19l-7-7m0 0l7-7m-7 7h18"
                            />

                        </svg>

                        Invoice History

                    </button>

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

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                        <div>

                            <h2 className="text-base font-semibold text-slate-800">

                                Refund Records

                            </h2>


                            <p className="text-xs text-slate-500 mt-1">

                                Search and review returned products and refund details

                            </p>

                        </div>


                        {/* SEARCH */}

                        <div className="relative w-full sm:w-80">

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
                                placeholder="Search refunds..."
                                value={search}
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                                className="w-full h-10 pl-9 pr-9 border border-slate-300 rounded-lg bg-slate-50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition"
                            />


                            {search && (

                                <button
                                    type="button"
                                    onClick={() =>
                                        setSearch("")
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
                    SUMMARY SECTION
                ========================================== */}

                <div className="p-5 sm:p-6 bg-slate-50/70 border-b border-slate-200">

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">


                        {/* TOTAL RECORDS */}

                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">

                            <div className="flex items-center justify-between">

                                <div>

                                    <p className="text-[11px] uppercase tracking-wide font-bold text-slate-400">

                                        Refund Records

                                    </p>


                                    <p className="text-2xl font-bold text-slate-800 mt-1">

                                        {filteredRefunds.length}

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
                                            d="M9 14l-4-4 4-4m0 8h6a5 5 0 005-5v-1"
                                        />

                                    </svg>

                                </div>

                            </div>

                        </div>


                        {/* RETURNED ITEMS */}

                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">

                            <div className="flex items-center justify-between">

                                <div>

                                    <p className="text-[11px] uppercase tracking-wide font-bold text-slate-400">

                                        Items Returned

                                    </p>


                                    <p className="text-2xl font-bold text-slate-800 mt-1">

                                        {totalReturnedQuantity}

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
                                            d="M20 7l-8 4-8-4m16 0l-8-4-8 4m16 0v10l-8 4-8-4V7"
                                        />

                                    </svg>

                                </div>

                            </div>

                        </div>


                        {/* REFUNDED AMOUNT */}

                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">

                            <div className="flex items-center justify-between">

                                <div>

                                    <p className="text-[11px] uppercase tracking-wide font-bold text-slate-400">

                                        Refunded Amount

                                    </p>


                                    <p className="text-2xl font-bold text-red-500 mt-1">

                                        ₹
                                        {totalRefundAmount.toFixed(
                                            2
                                        )}

                                    </p>

                                </div>


                                <div className="w-10 h-10 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center">

                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-5 h-5 text-red-500"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >

                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />

                                    </svg>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>


                {/* ==========================================
                    TABLE
                ========================================== */}

                <div className="overflow-x-auto">

                    <table className="w-full min-w-[1100px]">

                        <thead>

                            <tr className="bg-slate-50 border-b border-slate-200">

                                <th className="px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">
                                    Invoice
                                </th>

                                <th className="px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">
                                    Product
                                </th>

                                <th className="px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">
                                    Original Qty
                                </th>

                                <th className="px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">
                                    Returned Qty
                                </th>

                                <th className="px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">
                                    Refund Amount
                                </th>

                                <th className="px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">
                                    Reason
                                </th>

                                <th className="px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">
                                    Returned By
                                </th>

                                <th className="px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">
                                    Date
                                </th>

                            </tr>

                        </thead>


                        <tbody className="divide-y divide-slate-100">


                            {/* ==========================================
                                LOADING
                            ========================================== */}

                            {loading ? (

                                <tr>

                                    <td
                                        colSpan="8"
                                        className="px-5 py-14 text-center"
                                    >

                                        <div className="flex flex-col items-center">

                                            <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-700 rounded-full animate-spin mb-4"></div>


                                            <p className="text-sm font-semibold text-slate-700">

                                                Loading refund history...

                                            </p>


                                            <p className="text-xs text-slate-400 mt-1">

                                                Please wait while the records are loaded.

                                            </p>

                                        </div>

                                    </td>

                                </tr>

                            )


                            : filteredRefunds.length > 0 ? (

                                filteredRefunds.map(
                                    (refund) => (

                                        <tr
                                            key={refund.id}
                                            className="hover:bg-slate-50/80 transition"
                                        >

                                            {/* INVOICE */}

                                            <td className="px-5 py-4 text-center">

                                                <div className="flex items-center justify-center gap-3">

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
                                                                d="M9 14l-4-4 4-4m0 8h6a5 5 0 005-5v-1"
                                                            />

                                                        </svg>

                                                    </div>


                                                    <span className="text-sm font-semibold text-slate-800">

                                                        {refund.invoice_number ||
                                                            "—"}

                                                    </span>

                                                </div>

                                            </td>


                                            {/* PRODUCT */}

                                            <td className="px-5 py-4 text-center">

                                                <span className="text-sm font-semibold text-slate-800">

                                                    {refund.product_name ||
                                                        "—"}

                                                </span>

                                            </td>


                                            {/* ORIGINAL QTY */}

                                            <td className="px-5 py-4 text-center">

                                                <span className="text-sm font-semibold text-slate-700">

                                                    {refund.original_qty ??
                                                        "—"}

                                                </span>

                                            </td>


                                            {/* RETURNED QTY */}

                                            <td className="px-5 py-4 text-center">

                                                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-orange-50 border border-orange-100 text-orange-600 text-xs font-semibold">

                                                    {refund.return_qty ??
                                                        "—"}

                                                </span>

                                            </td>


                                            {/* REFUND AMOUNT */}

                                            <td className="px-5 py-4 text-center">

                                                <span className="text-sm font-semibold text-red-500">

                                                    ₹
                                                    {Number(
                                                        refund.refund_amount ||
                                                            0
                                                    ).toFixed(
                                                        2
                                                    )}

                                                </span>

                                            </td>


                                            {/* REASON */}

                                            <td className="px-5 py-4 text-center">

                                                <span className="text-sm text-slate-600">

                                                    {refund.reason ||
                                                        "—"}

                                                </span>

                                            </td>


                                            {/* RETURNED BY */}

                                            <td className="px-5 py-4 text-center">

                                                <div className="flex items-center justify-center gap-2">

                                                    <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center">

                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className="w-3.5 h-3.5 text-slate-500"
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


                                                    <span className="text-sm text-slate-600">

                                                        {refund.returned_by ||
                                                            "—"}

                                                    </span>

                                                </div>

                                            </td>


                                            {/* DATE */}

                                            <td className="px-5 py-4 text-center">

                                                <span className="text-sm text-slate-600 whitespace-nowrap">

                                                    {refund.created_at
                                                        ? new Date(
                                                            refund.created_at
                                                        ).toLocaleString(
                                                            "en-GB"
                                                        )
                                                        : "—"}

                                                </span>

                                            </td>

                                        </tr>

                                    )
                                )

                            )


                            : (

                                /* ==========================================
                                   EMPTY STATE
                                ========================================== */

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
                                                        d="M9 14l-4-4 4-4m0 8h6a5 5 0 005-5v-1"
                                                    />

                                                </svg>

                                            </div>


                                            <p className="text-sm font-semibold text-slate-600">

                                                {search
                                                    ? `No refund records found for "${search}".`
                                                    : "No refund records found."}

                                            </p>


                                            <p className="text-xs text-slate-400 mt-1">

                                                {search
                                                    ? "Try a different search term."
                                                    : "Refund transactions will appear here."}

                                            </p>

                                        </div>

                                    </td>

                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>


                {/* ==========================================
                    TABLE FOOTER
                ========================================== */}

                {!loading &&
                    filteredRefunds.length >
                        0 && (

                    <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">

                        <p className="text-xs text-slate-500">

                            Showing

                            <span className="font-semibold text-slate-700">

                                {" "}
                                {filteredRefunds.length}

                            </span>

                            {" "}refund
                            {filteredRefunds.length !==
                            1
                                ? "s"
                                : ""}

                        </p>


                        {search && (

                            <button
                                type="button"
                                onClick={() =>
                                    setSearch(
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

        </div>

    );

};


export default RefundHistory;