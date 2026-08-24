import React, {
    useEffect,
    useState
} from "react";

import { useNavigate } from "react-router-dom";
import api from "../api";


const CashRegister = () => {

    const navigate = useNavigate();


    // ==========================================
    // STATES
    // ==========================================

    const [openingCash, setOpeningCash] =
        useState("");

    const [actualCash, setActualCash] =
        useState("");

    const [ownerTaken, setOwnerTaken] =
        useState("");

    const [cashSales, setCashSales] =
        useState(0);

    const [onlineSales, setOnlineSales] =
        useState(0);

    const [refunds, setRefunds] =
        useState(0);

    const [registerOpen, setRegisterOpen] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");


    // ==========================================
    // CLOSE DIALOG
    // ==========================================

    const [showCloseDialog, setShowCloseDialog] =
        useState(false);


    // ==========================================
    // FINAL CLOSE SUMMARY
    // ==========================================

    const [closeSummary, setCloseSummary] =
        useState(null);


    // ==========================================
    // FETCH SUMMARY
    // ==========================================

    const fetchCashRegisterSummary =
        async () => {

            try {

                const response =
                    await api.get(
                        "/api/cash-register/summary"
                    );


                if (
                    response.data.success
                ) {

                    const summary =
                        response.data.summary;


                    setCashSales(
                        Number(
                            summary.cashSales || 0
                        )
                    );


                    setOnlineSales(
                        Number(
                            summary.onlineSales || 0
                        )
                    );


                    setRefunds(
                        Number(
                            summary.refunds || 0
                        )
                    );

                }

            } catch (err) {

                console.error(
                    "Summary Error:",
                    err
                );

                setError(
                    "Unable to load today's sales summary."
                );

            }

        };


    // ==========================================
    // FETCH CURRENT OPEN REGISTER
    // ==========================================

    const fetchCurrentRegister =
        async () => {

            try {

                const response =
                    await api.get(
                        "/api/cash-register/current"
                    );


                if (
                    response.data.success
                ) {

                    if (
                        response.data.registerOpen
                    ) {

                        const register =
                            response.data.register;


                        setRegisterOpen(true);


                        setOpeningCash(
                            Number(
                                register.opening_cash || 0
                            ).toString()
                        );

                    } else {

                        setRegisterOpen(false);

                        setOpeningCash("");

                    }

                }

            } catch (err) {

                console.error(
                    "Current Register Error:",
                    err
                );

            }

        };


    // ==========================================
    // INITIAL LOAD
    // ==========================================

    useEffect(() => {

        fetchCashRegisterSummary();

        fetchCurrentRegister();

    }, []);


    // ==========================================
    // TOTAL SALES
    // ==========================================

    const totalSales =
        Number(cashSales || 0) +
        Number(onlineSales || 0);


    // ==========================================
    // EXPECTED CASH
    // ==========================================

    const expectedCash =
        Number(openingCash || 0) +
        Number(cashSales || 0) -
        Number(refunds || 0);


    // ==========================================
    // DIFFERENCE
    // ==========================================

    const difference =
        Number(actualCash || 0) -
        expectedCash;


    // ==========================================
    // REMAINING CASH
    // ==========================================

    const remainingCash =
        Number(actualCash || 0) -
        Number(ownerTaken || 0);


    // ==========================================
    // OPEN REGISTER
    // ==========================================

    const handleOpenRegister =
        async () => {

            setError("");

            setMessage("");


            const amount =
                Number(openingCash);


            if (
                !Number.isFinite(amount) ||
                amount < 0
            ) {

                setError(
                    "Please enter a valid opening cash amount."
                );

                return;

            }


            try {

                setLoading(true);


                const response =
                    await api.post(
                        "/api/cash-register/open",
                        {
                            openingCash:
                                amount
                        }
                    );


                if (
                    response.data.success
                ) {

                    setRegisterOpen(true);


                    setMessage(
                        "Cash register opened successfully."
                    );


                    fetchCashRegisterSummary();

                    fetchCurrentRegister();

                }

            } catch (err) {

                console.error(
                    "Open Register Error:",
                    err
                );


                setError(
                    err.response?.data?.message ||
                    "Unable to open cash register."
                );

            } finally {

                setLoading(false);

            }

        };


    // ==========================================
    // OPEN CLOSE DIALOG
    // ==========================================

    const handleOpenCloseDialog =
        () => {

            setError("");

            setMessage("");

            setActualCash("");

            setOwnerTaken("");

            setShowCloseDialog(true);

        };


    // ==========================================
    // CLOSE REGISTER
    // ==========================================

    const handleCloseRegister =
        async () => {

            setError("");


            const actual =
                Number(actualCash);

            const owner =
                Number(ownerTaken || 0);


            if (
                !Number.isFinite(actual) ||
                actual < 0
            ) {

                setError(
                    "Please enter a valid actual cash amount."
                );

                return;

            }


            if (
                !Number.isFinite(owner) ||
                owner < 0
            ) {

                setError(
                    "Please enter a valid owner taken amount."
                );

                return;

            }


            if (
                owner > actual
            ) {

                setError(
                    "Owner taken amount cannot be greater than actual cash."
                );

                return;

            }


            try {

                setLoading(true);


                const response =
                    await api.post(
                        "/api/cash-register/close",
                        {
                            actualCash:
                                actual,

                            ownerTaken:
                                owner
                        }
                    );


                if (
                    response.data.success
                ) {

                    const summary = {

                        expectedCash:
                            Number(
                                response.data.expectedCash ??
                                expectedCash ??
                                0
                            ),

                        actualCash:
                            Number(
                                response.data.actualCash ??
                                actual ??
                                0
                            ),

                        difference:
                            Number(
                                response.data.difference ??
                                difference ??
                                0
                            ),

                        ownerTaken:
                            Number(
                                response.data.ownerTaken ??
                                owner ??
                                0
                            ),

                        remainingCash:
                            Number(
                                response.data.remainingCash ??
                                remainingCash ??
                                0
                            ),

                        cashSales:
                            Number(
                                response.data.cashSales ??
                                cashSales ??
                                0
                            ),

                        onlineSales:
                            Number(
                                response.data.onlineSales ??
                                onlineSales ??
                                0
                            ),

                        refunds:
                            Number(
                                response.data.refunds ??
                                refunds ??
                                0
                            ),

                        totalSales:
                            Number(
                                response.data.totalSales ??
                                (
                                    Number(cashSales || 0) +
                                    Number(onlineSales || 0)
                                )
                            )

                    };


                    setCloseSummary(
                        summary
                    );


                    setShowCloseDialog(
                        false
                    );


                    setRegisterOpen(
                        false
                    );


                    setActualCash("");

                    setOwnerTaken("");

                }

            } catch (err) {

                console.error(
                    "Close Register Error:",
                    err
                );


                setError(
                    err.response?.data?.message ||
                    "Unable to close cash register."
                );

            } finally {

                setLoading(false);

            }

        };


    // ==========================================
    // FORMAT MONEY
    // ==========================================

    const formatMoney =
        (value) => {

            return `₹ ${Number(
                value || 0
            ).toFixed(2)}`;

        };


    // ==========================================
    // CLOSE FINAL SUMMARY
    // ==========================================

    const closeFinalSummary = () => {

        setCloseSummary(null);


        setMessage(
            "Cash register closed successfully."
        );


        fetchCashRegisterSummary();

        fetchCurrentRegister();

    };


    // ==========================================
    // RENDER
    // ==========================================

    return (

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">


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
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-10V6m0 12v-2m9-4a9 9 0 11-18 0 9 9 0 0118 0z"
                                />

                            </svg>

                        </div>


                        <div>

                            <h1 className="text-2xl font-bold text-slate-800">

                                Cash Register

                            </h1>

                            <p className="text-sm text-slate-500 mt-0.5">

                                Manage your daily cash drawer

                            </p>

                        </div>

                    </div>

                </div>


                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            "/cash-register-history"
                        )
                    }
                    className="inline-flex items-center justify-center gap-2 self-start sm:self-auto px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
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
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />

                    </svg>

                    Register History

                </button>

            </div>


            {/* ==========================================
                MAIN CARD
            ========================================== */}

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">


                {/* ==========================================
                    STATUS HEADER
                ========================================== */}

                <div className="px-5 sm:px-6 py-5 border-b border-slate-200">

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                        <div>

                            <h2 className="text-base font-semibold text-slate-800">

                                Register Overview

                            </h2>

                            <p className="text-xs text-slate-500 mt-1">

                                Monitor the current register status and daily sales.

                            </p>

                        </div>


                        <span
                            className={`inline-flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-lg border text-xs font-bold ${
                                registerOpen
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                    : "bg-slate-100 border-slate-200 text-slate-600"
                            }`}
                        >

                            <span
                                className={`w-2 h-2 rounded-full ${
                                    registerOpen
                                        ? "bg-emerald-500"
                                        : "bg-slate-400"
                                }`}
                            ></span>

                            {registerOpen
                                ? "OPEN"
                                : "CLOSED"
                            }

                        </span>

                    </div>

                </div>


                {/* ==========================================
                    ALERTS
                ========================================== */}

                {(message || error) && (

                    <div className="px-5 sm:px-6 pt-5">

                        {message && (

                            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm font-medium">

                                <div className="flex items-center gap-2">

                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-4 h-4 shrink-0"
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

                                    {message}

                                </div>

                            </div>

                        )}


                        {error && (

                            <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">

                                <div className="flex items-center gap-2">

                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-4 h-4 shrink-0"
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

                                    {error}

                                </div>

                            </div>

                        )}

                    </div>

                )}


                <div className="p-5 sm:p-6">


                    {/* ==========================================
                        OPENING CASH
                    ========================================== */}

                    <div className="p-5 bg-slate-50/70 border border-slate-200 rounded-xl mb-6">

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">

                            <div>

                                <div className="flex items-center gap-3">

                                    <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center">

                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="w-4 h-4 text-slate-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >

                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-10V6m0 12v-2"
                                            />

                                        </svg>

                                    </div>

                                    <div>

                                        <h3 className="text-sm font-bold text-slate-800">

                                            Opening Cash

                                        </h3>

                                        <p className="text-xs text-slate-500 mt-1">

                                            Set the starting cash amount for this register.

                                        </p>

                                    </div>

                                </div>

                            </div>


                            {registerOpen && (

                                <span className="inline-flex items-center self-start px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">

                                    Register Active

                                </span>

                            )}

                        </div>


                        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,280px)_auto] gap-3">

                            <div>

                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">

                                    Opening Cash Amount

                                </label>

                                <div className="relative">

                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">

                                        ₹

                                    </span>

                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={openingCash}
                                        onChange={(e) =>
                                            setOpeningCash(
                                                e.target.value
                                            )
                                        }
                                        placeholder="0.00"
                                        disabled={registerOpen}
                                        className="w-full h-10 pl-7 pr-3 border border-slate-300 rounded-lg bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-400 transition"
                                    />

                                </div>

                            </div>


                            <div className="flex items-end">

                                <button
                                    type="button"
                                    onClick={
                                        handleOpenRegister
                                    }
                                    disabled={
                                        registerOpen ||
                                        loading
                                    }
                                    className="w-full sm:w-auto h-10 px-5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-semibold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >

                                    {loading
                                        ? "Processing..."
                                        : "Open Register"
                                    }

                                </button>

                            </div>

                        </div>

                    </div>


                    {/* ==========================================
                        TODAY SALES
                    ========================================== */}

                    <div className="mb-6">

                        <div className="mb-4">

                            <h3 className="text-sm font-bold text-slate-800">

                                Today's Sales

                            </h3>

                            <p className="text-xs text-slate-500 mt-1">

                                Current sales and refund summary

                            </p>

                        </div>


                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">


                            {/* CASH SALES */}

                            <div className="border border-slate-200 rounded-xl p-4 bg-white">

                                <div className="flex items-center justify-between">

                                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">

                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="w-4 h-4 text-slate-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >

                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-10V6m0 12v-2"
                                            />

                                        </svg>

                                    </div>

                                </div>

                                <p className="text-[11px] uppercase tracking-wide font-bold text-slate-500 mt-3">

                                    Cash Sales

                                </p>

                                <p className="text-xl font-bold text-slate-800 mt-1">

                                    {formatMoney(
                                        cashSales
                                    )}

                                </p>

                            </div>


                            {/* ONLINE SALES */}

                            <div className="border border-slate-200 rounded-xl p-4 bg-white">

                                <div className="flex items-center justify-between">

                                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">

                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="w-4 h-4 text-slate-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >

                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M3 10h18M7 15h2m2 0h2m2 0h2M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2z"
                                            />

                                        </svg>

                                    </div>

                                </div>

                                <p className="text-[11px] uppercase tracking-wide font-bold text-slate-500 mt-3">

                                    Online Sales

                                </p>

                                <p className="text-xl font-bold text-slate-800 mt-1">

                                    {formatMoney(
                                        onlineSales
                                    )}

                                </p>

                            </div>


                            {/* TOTAL SALES */}

                            <div className="border border-slate-200 rounded-xl p-4 bg-white">

                                <div className="flex items-center justify-between">

                                    <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center">

                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="w-4 h-4 text-white"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >

                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 8v8m-4-4h8M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z"
                                            />

                                        </svg>

                                    </div>

                                </div>

                                <p className="text-[11px] uppercase tracking-wide font-bold text-slate-500 mt-3">

                                    Total Sales

                                </p>

                                <p className="text-xl font-bold text-slate-800 mt-1">

                                    {formatMoney(
                                        totalSales
                                    )}

                                </p>

                            </div>


                            {/* REFUNDS */}

                            <div className="border border-slate-200 rounded-xl p-4 bg-white">

                                <div className="flex items-center justify-between">

                                    <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">

                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="w-4 h-4 text-red-500"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >

                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 14l-2-2m0 0l2-2m-2 2h8m-4-7a9 9 0 110 18 9 9 0 010-18z"
                                            />

                                        </svg>

                                    </div>

                                </div>

                                <p className="text-[11px] uppercase tracking-wide font-bold text-slate-500 mt-3">

                                    Refunds

                                </p>

                                <p className="text-xl font-bold text-slate-800 mt-1">

                                    {formatMoney(
                                        refunds
                                    )}

                                </p>

                            </div>

                        </div>

                    </div>


                    {/* ==========================================
                        REGISTER SUMMARY
                    ========================================== */}

                    <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">

                        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200">

                            <h3 className="text-sm font-bold text-slate-800">

                                Register Summary

                            </h3>

                            <p className="text-xs text-slate-500 mt-1">

                                Current cash position for this register

                            </p>

                        </div>


                        <div className="px-5">

                            <div className="flex justify-between items-center py-3.5 border-b border-slate-100">

                                <span className="text-sm text-slate-600">

                                    Opening Cash

                                </span>

                                <span className="text-sm font-semibold text-slate-800">

                                    {formatMoney(
                                        openingCash
                                    )}

                                </span>

                            </div>


                            <div className="flex justify-between items-center py-3.5 border-b border-slate-100">

                                <span className="text-sm text-slate-600">

                                    Cash Sales

                                </span>

                                <span className="text-sm font-semibold text-slate-800">

                                    {formatMoney(
                                        cashSales
                                    )}

                                </span>

                            </div>


                            <div className="flex justify-between items-center py-3.5 border-b border-slate-100">

                                <span className="text-sm text-slate-600">

                                    Online Sales

                                </span>

                                <span className="text-sm font-semibold text-slate-800">

                                    {formatMoney(
                                        onlineSales
                                    )}

                                </span>

                            </div>


                            <div className="flex justify-between items-center py-3.5 border-b border-slate-100">

                                <span className="text-sm text-slate-600">

                                    Total Sales

                                </span>

                                <span className="text-sm font-semibold text-slate-800">

                                    {formatMoney(
                                        totalSales
                                    )}

                                </span>

                            </div>


                            <div className="flex justify-between items-center py-3.5">

                                <span className="text-sm text-slate-600">

                                    Refunds

                                </span>

                                <span className="text-sm font-semibold text-slate-800">

                                    - {formatMoney(
                                        refunds
                                    )}

                                </span>

                            </div>


                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 my-4">

                                <div className="flex items-start gap-2">

                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-4 h-4 text-slate-400 shrink-0 mt-0.5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >

                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
                                        />

                                    </svg>

                                    <p className="text-xs text-slate-500 leading-5">

                                        Online sales are shown for reporting,
                                        but they are not included in Expected
                                        Cash because they are not physical cash
                                        in the drawer.

                                    </p>

                                </div>

                            </div>


                            <div className="flex justify-between items-center py-4 border-t border-slate-200">

                                <span className="text-sm font-bold text-slate-800">

                                    Expected Cash

                                </span>

                                <span className="text-lg font-bold text-slate-800">

                                    {formatMoney(
                                        expectedCash
                                    )}

                                </span>

                            </div>

                        </div>

                    </div>


                    {/* ==========================================
                        CLOSING CASH
                    ========================================== */}

                    <div className="p-5 bg-slate-50/70 border border-slate-200 rounded-xl">

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                            <div>

                                <div className="flex items-center gap-3">

                                    <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center">

                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="w-4 h-4 text-slate-600"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >

                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 15v2m-6 4h12a2 2 0 002-2v-7a2 2 0 00-2-2H6a2 2 0 00-2 2v7a2 2 0 002 2zm10-11V7a4 4 0 00-8 0v3h8z"
                                            />

                                        </svg>

                                    </div>

                                    <div>

                                        <h3 className="text-sm font-bold text-slate-800">

                                            Closing Cash

                                        </h3>

                                        <p className="text-xs text-slate-500 mt-1">

                                            Count the physical cash before closing the register.

                                        </p>

                                    </div>

                                </div>

                            </div>


                            <button
                                type="button"
                                onClick={
                                    handleOpenCloseDialog
                                }
                                disabled={
                                    !registerOpen ||
                                    loading
                                }
                                className="inline-flex items-center justify-center gap-2 h-10 px-5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
                                        d="M12 15v2m-6 4h12a2 2 0 002-2v-7a2 2 0 00-2-2H6a2 2 0 00-2 2v7a2 2 0 002 2zm10-11V7a4 4 0 00-8 0v3h8z"
                                    />

                                </svg>

                                Close Register

                            </button>

                        </div>

                    </div>

                </div>

            </div>


            {/* ==========================================
                CLOSE REGISTER MODAL
            ========================================== */}

            {showCloseDialog && (

                <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">

                    <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">


                        {/* HEADER */}

                        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">

                            <div className="flex items-center gap-3">

                                <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center">

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
                                            d="M12 15v2m-6 4h12a2 2 0 002-2v-7a2 2 0 00-2-2H6a2 2 0 00-2 2v7a2 2 0 002-2zm10-11V7a4 4 0 00-8 0v3h8z"
                                        />

                                    </svg>

                                </div>


                                <div>

                                    <h2 className="text-base font-bold text-slate-800">

                                        Close Cash Register

                                    </h2>

                                    <p className="text-xs text-slate-500 mt-0.5">

                                        Complete the cash closing details.

                                    </p>

                                </div>

                            </div>


                            <button
                                type="button"
                                onClick={() => {

                                    setShowCloseDialog(
                                        false
                                    );

                                    setError("");

                                }}
                                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 text-xl transition"
                                title="Close"
                            >

                                ×

                            </button>

                        </div>


                        {/* BODY */}

                        <div className="p-5 max-h-[70vh] overflow-y-auto">


                            {/* TODAY SALES */}

                            <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">

                                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">

                                    <h3 className="text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                        Today's Sales

                                    </h3>

                                </div>


                                <div className="px-4">

                                    <div className="flex justify-between py-3 border-b border-slate-100">

                                        <span className="text-sm text-slate-600">

                                            Cash Sales

                                        </span>

                                        <span className="text-sm font-semibold text-slate-800">

                                            {formatMoney(
                                                cashSales
                                            )}

                                        </span>

                                    </div>


                                    <div className="flex justify-between py-3 border-b border-slate-100">

                                        <span className="text-sm text-slate-600">

                                            Online Sales

                                        </span>

                                        <span className="text-sm font-semibold text-slate-800">

                                            {formatMoney(
                                                onlineSales
                                            )}

                                        </span>

                                    </div>


                                    <div className="flex justify-between py-3">

                                        <span className="text-sm font-semibold text-slate-700">

                                            Total Sales

                                        </span>

                                        <span className="text-sm font-bold text-slate-800">

                                            {formatMoney(
                                                totalSales
                                            )}

                                        </span>

                                    </div>

                                </div>

                            </div>


                            {/* EXPECTED CASH */}

                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5">

                                <div className="flex justify-between items-center">

                                    <span className="text-sm font-semibold text-slate-700">

                                        Expected Cash

                                    </span>

                                    <span className="text-base font-bold text-slate-800">

                                        {formatMoney(
                                            expectedCash
                                        )}

                                    </span>

                                </div>

                                <p className="text-xs text-slate-500 mt-2 leading-5">

                                    Opening Cash + Cash Sales - Refunds.
                                    Online Sales are not included.

                                </p>

                            </div>


                            {/* ACTUAL CASH */}

                            <div className="mb-5">

                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">

                                    Actual Cash Counted

                                </label>

                                <div className="relative">

                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">

                                        ₹

                                    </span>

                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={actualCash}
                                        onChange={(e) =>
                                            setActualCash(
                                                e.target.value
                                            )
                                        }
                                        placeholder="0.00"
                                        autoFocus
                                        className="w-full h-10 pl-7 pr-3 border border-slate-300 rounded-lg bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition"
                                    />

                                </div>

                            </div>


                            {/* DIFFERENCE */}

                            {actualCash !== "" && (

                                <div
                                    className={`rounded-lg p-4 mb-5 border ${
                                        difference === 0
                                            ? "bg-emerald-50 border-emerald-200"
                                            : difference < 0
                                            ? "bg-red-50 border-red-200"
                                            : "bg-amber-50 border-amber-200"
                                    }`}
                                >

                                    <div className="flex justify-between items-center">

                                        <span
                                            className={`text-sm font-semibold ${
                                                difference === 0
                                                    ? "text-emerald-700"
                                                    : difference < 0
                                                    ? "text-red-700"
                                                    : "text-amber-700"
                                            }`}
                                        >

                                            Difference

                                        </span>

                                        <span
                                            className={`font-bold ${
                                                difference === 0
                                                    ? "text-emerald-700"
                                                    : difference < 0
                                                    ? "text-red-700"
                                                    : "text-amber-700"
                                            }`}
                                        >

                                            {formatMoney(
                                                difference
                                            )}

                                        </span>

                                    </div>


                                    <p
                                        className={`text-xs mt-1 ${
                                            difference === 0
                                                ? "text-emerald-600"
                                                : difference < 0
                                                ? "text-red-600"
                                                : "text-amber-600"
                                        }`}
                                    >

                                        {difference === 0
                                            ? "Register is perfectly balanced."
                                            : difference < 0
                                            ? `Short by ${formatMoney(
                                                Math.abs(difference)
                                            )}`
                                            : `Over by ${formatMoney(
                                                difference
                                            )}`
                                        }

                                    </p>

                                </div>

                            )}


                            {/* OWNER TAKEN */}

                            <div>

                                <label className="block text-xs font-semibold text-slate-600 mb-1.5">

                                    Owner Taken Amount

                                </label>

                                <div className="relative">

                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">

                                        ₹

                                    </span>

                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={ownerTaken}
                                        onChange={(e) =>
                                            setOwnerTaken(
                                                e.target.value
                                            )
                                        }
                                        placeholder="0.00"
                                        className="w-full h-10 pl-7 pr-3 border border-slate-300 rounded-lg bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition"
                                    />

                                </div>


                                <p className="text-xs text-slate-400 mt-2">

                                    This amount is recorded separately and does not affect the cash difference.

                                </p>

                            </div>


                            {/* REMAINING CASH */}

                            {ownerTaken !== "" &&
                                actualCash !== "" && (

                                <div className="mt-4 bg-slate-50 border border-slate-200 rounded-lg p-4">

                                    <div className="flex justify-between items-center">

                                        <span className="text-sm font-semibold text-slate-700">

                                            Cash Remaining

                                        </span>

                                        <span className="font-bold text-slate-800">

                                            {formatMoney(
                                                remainingCash
                                            )}

                                        </span>

                                    </div>

                                </div>

                            )}


                            {/* ERROR */}

                            {error && (

                                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">

                                    {error}

                                </div>

                            )}

                        </div>


                        {/* FOOTER */}

                        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50/70 flex justify-end gap-2">

                            <button
                                type="button"
                                onClick={() => {

                                    setShowCloseDialog(
                                        false
                                    );

                                    setError("");

                                }}
                                disabled={loading}
                                className="h-10 px-4 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                            >

                                Cancel

                            </button>


                            <button
                                type="button"
                                onClick={
                                    handleCloseRegister
                                }
                                disabled={
                                    loading ||
                                    actualCash === ""
                                }
                                className="h-10 px-5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >

                                {loading
                                    ? "Closing..."
                                    : "Confirm & Close"
                                }

                            </button>

                        </div>

                    </div>

                </div>

            )}


            {/* ==========================================
                FINAL SUCCESS SUMMARY
            ========================================== */}

            {closeSummary && (

                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">

                    <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">


                        {/* HEADER */}

                        <div className="px-5 py-5 border-b border-slate-200">

                            <div className="flex flex-col items-center text-center">

                                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-3">

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


                                <h2 className="text-lg font-bold text-slate-800">

                                    Register Closed Successfully

                                </h2>


                                <p className="text-xs text-slate-500 mt-1">

                                    Today's cash register has been closed.

                                </p>

                            </div>

                        </div>


                        {/* SUMMARY */}

                        <div className="p-5 max-h-[65vh] overflow-y-auto">


                            <div className="border border-slate-200 rounded-xl overflow-hidden">

                                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">

                                    <h3 className="text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                        Closing Summary

                                    </h3>

                                </div>


                                <div className="px-4">


                                    <div className="flex justify-between py-3 border-b border-slate-100">

                                        <span className="text-sm text-slate-600">

                                            Cash Sales

                                        </span>

                                        <span className="text-sm font-semibold text-slate-800">

                                            {formatMoney(
                                                closeSummary.cashSales
                                            )}

                                        </span>

                                    </div>


                                    <div className="flex justify-between py-3 border-b border-slate-100">

                                        <span className="text-sm text-slate-600">

                                            Online Sales

                                        </span>

                                        <span className="text-sm font-semibold text-slate-800">

                                            {formatMoney(
                                                closeSummary.onlineSales
                                            )}

                                        </span>

                                    </div>


                                    <div className="flex justify-between py-3 border-b border-slate-100">

                                        <span className="text-sm font-semibold text-slate-700">

                                            Total Sales

                                        </span>

                                        <span className="text-sm font-bold text-slate-800">

                                            {formatMoney(
                                                closeSummary.totalSales
                                            )}

                                        </span>

                                    </div>


                                    <div className="flex justify-between py-3 border-b border-slate-100">

                                        <span className="text-sm text-slate-600">

                                            Refunds

                                        </span>

                                        <span className="text-sm font-semibold text-slate-800">

                                            - {formatMoney(
                                                closeSummary.refunds
                                            )}

                                        </span>

                                    </div>


                                    <div className="flex justify-between py-3 border-b border-slate-100">

                                        <span className="text-sm text-slate-600">

                                            Expected Cash

                                        </span>

                                        <span className="text-sm font-semibold text-slate-800">

                                            {formatMoney(
                                                closeSummary.expectedCash
                                            )}

                                        </span>

                                    </div>


                                    <div className="flex justify-between py-3 border-b border-slate-100">

                                        <span className="text-sm text-slate-600">

                                            Actual Cash

                                        </span>

                                        <span className="text-sm font-semibold text-slate-800">

                                            {formatMoney(
                                                closeSummary.actualCash
                                            )}

                                        </span>

                                    </div>


                                    <div className="flex justify-between py-3 border-b border-slate-100">

                                        <span className="text-sm text-slate-600">

                                            Difference

                                        </span>

                                        <span
                                            className={`text-sm font-bold ${
                                                closeSummary.difference < 0
                                                    ? "text-red-600"
                                                    : closeSummary.difference > 0
                                                    ? "text-emerald-600"
                                                    : "text-slate-700"
                                            }`}
                                        >

                                            {formatMoney(
                                                closeSummary.difference
                                            )}

                                        </span>

                                    </div>


                                    <div className="flex justify-between py-3">

                                        <span className="text-sm font-semibold text-slate-700">

                                            Owner Taken

                                        </span>

                                        <span className="text-sm font-bold text-slate-800">

                                            {formatMoney(
                                                closeSummary.ownerTaken
                                            )}

                                        </span>

                                    </div>

                                </div>

                            </div>


                            {/* REMAINING */}

                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-4">

                                <div className="flex justify-between items-center">

                                    <span className="text-sm font-semibold text-slate-700">

                                        Remaining Cash

                                    </span>

                                    <span className="text-lg font-bold text-slate-800">

                                        {formatMoney(
                                            closeSummary.remainingCash
                                        )}

                                    </span>

                                </div>


                                <div className="flex items-start gap-2 mt-2">

                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-4 h-4 text-slate-400 shrink-0 mt-0.5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >

                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
                                        />

                                    </svg>

                                    <p className="text-xs text-slate-500 leading-5">

                                        Enter this amount as opening cash when starting the next register.

                                    </p>

                                </div>

                            </div>

                        </div>


                        {/* FOOTER */}

                        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50/70">

                            <button
                                type="button"
                                onClick={
                                    closeFinalSummary
                                }
                                className="w-full h-10 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-semibold transition shadow-sm"
                            >

                                Done

                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

};


export default CashRegister;