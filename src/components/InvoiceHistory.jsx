import React, {
    useEffect,
    useState,
    useCallback,
    useRef,
} from "react";

import axios from "axios";

import { useNavigate } from "react-router-dom";

import Toast from "./Toast";


const API_URL =
    "https://invoice-backend-78hd.onrender.com";


const InvoiceHistory = () => {

    const navigate = useNavigate();


    // ==========================================
    // SEARCH
    // ==========================================

    const [search, setSearch] =
        useState("");


    // ==========================================
    // INVOICES
    // ==========================================

    const [invoices, setInvoices] =
        useState([]);


    // ==========================================
    // DELETE CONFIRMATION
    // ==========================================

    const [deleteConfirm, setDeleteConfirm] =
        useState({
            show: false,
            id: null,
        });


    // ==========================================
    // TOAST
    // ==========================================

    const [toast, setToast] =
        useState({
            message: "",
            type: "success",
        });


    // ==========================================
    // TOAST SOUNDS
    // ==========================================

    const successSoundRef =
        useRef(null);

    const errorSoundRef =
        useRef(null);


    // ==========================================
    // LOGGED-IN USER
    // ==========================================

    const user =
        JSON.parse(
            sessionStorage.getItem("user")
        );


    // ==========================================
    // INITIALIZE TOAST SOUNDS
    // ==========================================

    useEffect(() => {

        successSoundRef.current =
            new Audio(
                "/success-tone.mp3"
            );

        successSoundRef.current.volume =
            1.0;


        errorSoundRef.current =
            new Audio(
                "/error-tone.mp3"
            );

        errorSoundRef.current.volume =
            1.0;


        return () => {

            if (
                successSoundRef.current
            ) {

                successSoundRef.current.pause();

                successSoundRef.current =
                    null;

            }


            if (
                errorSoundRef.current
            ) {

                errorSoundRef.current.pause();

                errorSoundRef.current =
                    null;

            }

        };

    }, []);


    // ==========================================
    // SHOW TOAST
    // ==========================================

    const showToast = (
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
    // FETCH INVOICES
    // ==========================================

    const fetchInvoices =
        useCallback(
            async () => {

                try {

                    const res =
                        await axios.get(
                            `${API_URL}/api/invoices`
                        );


                    if (
                        res.data.success
                    ) {

                        setInvoices(
                            res.data.invoices || []
                        );

                    }

                    else {

                        showToast(
                            res.data.message ||
                                "Failed to load invoice history.",
                            "error"
                        );

                    }

                }

                catch (err) {

                    console.log(err);


                    showToast(
                        "Failed to load invoice history.",
                        "error"
                    );

                }

            },
            []
        );


    // ==========================================
    // LOAD INVOICES
    // ==========================================

    useEffect(() => {

        fetchInvoices();

    }, [fetchInvoices]);


    // ==========================================
    // CONFIRM DELETE
    // ==========================================

    const confirmDeleteInvoice = (
        id
    ) => {

        setDeleteConfirm({
            show: true,
            id,
        });

    };


    // ==========================================
    // CANCEL DELETE
    // ==========================================

    const cancelDelete = () => {

        setDeleteConfirm({
            show: false,
            id: null,
        });

    };


    // ==========================================
    // DELETE INVOICE
    // ==========================================

    const handleDelete = async () => {

        const {
            id,
        } = deleteConfirm;


        if (!id) {

            return;

        }


        try {

            const token =
                sessionStorage.getItem(
                    "token"
                );


            await axios.delete(
                `${API_URL}/api/invoices/${id}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );


            setDeleteConfirm({
                show: false,
                id: null,
            });


            showToast(
                "Invoice deleted successfully.",
                "success"
            );


            await fetchInvoices();

        }

        catch (err) {

            console.log(err);


            setDeleteConfirm({
                show: false,
                id: null,
            });


            if (
                err.response?.status === 401
            ) {

                showToast(
                    "Please login again.",
                    "warning"
                );

            }

            else if (
                err.response?.status === 403
            ) {

                showToast(
                    "Only Admin can delete invoices.",
                    "error"
                );

            }

            else {

                showToast(
                    "Failed to delete invoice.",
                    "error"
                );

            }

        }

    };


    // ==========================================
    // FILTER INVOICES
    // ==========================================

    const filteredInvoices =
        invoices.filter(
            (invoice) => {

                const searchValue =
                    search.toLowerCase();


                return (

                    String(
                        invoice.invoice_number ||
                            ""
                    )
                        .toLowerCase()
                        .includes(
                            searchValue
                        )

                    ||

                    String(
                        invoice.customer_name ||
                            ""
                    )
                        .toLowerCase()
                        .includes(
                            searchValue
                        )

                );

            }
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
                message={toast.message}
                type={toast.type}
                onClose={hideToast}
            />


            {/* ==========================================
                DELETE MODAL
            ========================================== */}

            {deleteConfirm.show && (

                <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">

                    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

                        <div className="p-6">

                            {/* ICON */}

                            <div className="flex justify-center mb-5">

                                <div className="w-14 h-14 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">

                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-7 h-7 text-red-600"
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


                            {/* TITLE */}

                            <h2 className="text-xl font-bold text-slate-800 text-center">

                                Delete Invoice?

                            </h2>


                            {/* DESCRIPTION */}

                            <p className="text-sm text-slate-500 text-center mt-2 leading-6">

                                Are you sure you want to delete this invoice?

                            </p>


                            <p className="text-xs text-red-500 text-center mt-2">

                                This action cannot be undone.

                            </p>


                            {/* ACTIONS */}

                            <div className="grid grid-cols-2 gap-3 mt-6">

                                <button
                                    type="button"
                                    onClick={
                                        cancelDelete
                                    }
                                    className="h-11 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition"
                                >

                                    Cancel

                                </button>


                                <button
                                    type="button"
                                    onClick={
                                        handleDelete
                                    }
                                    className="h-11 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition"
                                >

                                    Delete

                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            )}


            {/* ==========================================
                PAGE HEADER
            ========================================== */}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

                <div>

                    <div className="flex items-center gap-3">

                        {/* HEADER ICON */}

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
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />

                            </svg>

                        </div>


                        {/* TITLE */}

                        <div>

                            <h1 className="text-2xl font-bold text-slate-800">

                                Invoice History

                            </h1>


                            <p className="text-sm text-slate-500 mt-0.5">

                                View and manage all generated invoices

                            </p>

                        </div>

                    </div>

                </div>


                {/* RIGHT SIDE */}

                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">

                    {/* INVOICE COUNT */}

                    <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm">

                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>

                        <span className="text-sm font-semibold text-slate-700">

                            {filteredInvoices.length} Invoice
                            {filteredInvoices.length !== 1
                                ? "s"
                                : ""}

                        </span>

                    </div>


                    {/* REFUND HISTORY */}

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/refund-history"
                            )
                        }
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition shadow-sm"
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
                                d="M9 14l-4-4 4-4"
                            />

                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 10h9a5 5 0 015 5v1"
                            />

                        </svg>

                        Refund History

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

                                Invoice History

                            </h2>


                            <p className="text-xs text-slate-500 mt-1">

                                Search and manage your generated invoices

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
                                placeholder="Search invoice or customer..."
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
                                    aria-label="Clear Search"
                                >

                                    ×

                                </button>

                            )}

                        </div>

                    </div>

                </div>


                {/* ==========================================
                    TABLE
                ========================================== */}

{/* ==========================================
    TABLE
========================================== */}

<div className="px-4 sm:px-6 lg:px-8 py-5">

    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">

        <table className="w-full min-w-[1000px]">

            <thead>

                <tr className="bg-slate-50 border-b border-slate-200">

                    <th className="px-5 py-4 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">
                        Invoice
                    </th>

                    <th className="px-5 py-4 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">
                        Cashier
                    </th>

                    <th className="px-5 py-4 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">
                        Customer
                    </th>

                    <th className="px-5 py-4 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">
                        Phone
                    </th>

                    <th className="px-5 py-4 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">
                        Date
                    </th>

                    <th className="px-5 py-4 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">
                        Payment
                    </th>

                    <th className="px-5 py-4 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">
                        Total
                    </th>

                    <th className="px-5 py-4 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">
                        Action
                    </th>

                </tr>

            </thead>


            <tbody className="divide-y divide-slate-100">

                {filteredInvoices.length > 0 ? (

                    filteredInvoices.map(
                        (invoice) => (

                            <tr
                                key={invoice.id}
                                className="bg-white hover:bg-slate-50/70 transition duration-150"
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
                                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                />

                                            </svg>

                                        </div>


                                        <span className="text-sm font-semibold text-slate-800">

                                            {invoice.invoice_number}

                                        </span>

                                    </div>

                                </td>


                                {/* CASHIER */}

                                <td className="px-5 py-4 text-center">

                                    <span className="text-sm text-slate-600">

                                        {invoice.cashier_name || "—"}

                                    </span>

                                </td>


                                {/* CUSTOMER */}

                                <td className="px-5 py-4 text-center">

                                    <span className="text-sm font-medium text-slate-700">

                                        {invoice.customer_name || "—"}

                                    </span>

                                </td>


                                {/* PHONE */}

                                <td className="px-5 py-4 text-center">

                                    <span className="text-sm text-slate-600">

                                        {invoice.phone_number || "—"}

                                    </span>

                                </td>


                                {/* DATE */}

                                <td className="px-5 py-4 text-center">

                                    <span className="text-sm text-slate-600">

                                        {invoice.invoice_date
                                            ? new Date(
                                                invoice.invoice_date
                                            ).toLocaleDateString(
                                                "en-GB"
                                            )
                                            : "—"}

                                    </span>

                                </td>


                                {/* PAYMENT */}

                                <td className="px-5 py-4 text-center">

                                    <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 text-xs font-medium">

                                        {invoice.payment_Method || "—"}

                                    </span>

                                </td>


                                {/* TOTAL */}

                                <td className="px-5 py-4 text-center">

                                    <span className="text-sm font-semibold text-slate-800">

                                        ₹
                                        {Number(
                                            invoice.total
                                        ).toFixed(2)}

                                    </span>

                                </td>


                                {/* ACTION */}

                                <td className="px-5 py-4 text-center">

                                    <div className="flex justify-center items-center gap-2">

                                        {/* VIEW */}

                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate(
                                                    `/invoice/${invoice.id}`
                                                )
                                            }
                                            className="w-9 h-9 flex items-center justify-center rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 transition"
                                            title="View Invoice"
                                            aria-label="View Invoice"
                                        >

                                          <svg xmlns="http://www.w3.org/2000/svg" className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" > <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /> </svg>
                                        </button>


                                        {/* DELETE */}

                                        {user?.role ===
                                            "Admin" && (

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    confirmDeleteInvoice(
                                                        invoice.id
                                                    )
                                                }
                                                className="w-9 h-9 flex items-center justify-center rounded-lg text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 transition"
                                                title="Delete Invoice"
                                                aria-label="Delete Invoice"
                                            >

                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="w-[18px] h-[18px]"
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

                                        )}

                                    </div>

                                </td>

                            </tr>

                        )

                    )

                ) : (

                    /* ==========================================
                       EXISTING EMPTY STATE — KEPT
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
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V19a2 2 0 01-2-2z"
                                        />

                                    </svg>

                                </div>


                                <p className="text-sm font-semibold text-slate-600">

                                    {search
                                        ? `No invoices found for "${search}".`
                                        : "No invoices found."}

                                </p>


                                <p className="text-xs text-slate-400 mt-1">

                                    {search
                                        ? "Try a different search term."
                                        : "Generated invoices will appear here."}

                                </p>

                            </div>

                        </td>

                    </tr>

                )}

            </tbody>

        </table>

    </div>

</div>


                {/* ==========================================
                    TABLE FOOTER
                ========================================== */}

                {filteredInvoices.length > 0 && (

                    <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">

                        <p className="text-xs text-slate-500">

                            Showing

                            <span className="font-semibold text-slate-700">

                                {" "}
                                {filteredInvoices.length}

                            </span>

                            {" "}
                            invoice
                            {filteredInvoices.length !== 1
                                ? "s"
                                : ""}

                        </p>


                        {search && (

                            <button
                                type="button"
                                onClick={() =>
                                    setSearch("")
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


export default InvoiceHistory;