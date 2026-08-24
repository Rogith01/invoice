import React, {
    useEffect,
    useState,
    useCallback
} from "react";

import { useNavigate } from "react-router-dom";

import api from "../api";


// ==================================================
// CASH REGISTER HISTORY
// ==================================================

const CashRegisterHistory = () => {

    const navigate = useNavigate();


    // ==================================================
    // STATE
    // ==================================================

    const [history, setHistory] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [search, setSearch] = useState("");


    // ==================================================
    // FETCH HISTORY
    // ==================================================

    const fetchHistory = useCallback(async () => {

        try {

            setLoading(true);

            setError("");


            const response = await api.get(
                "/api/cash-register/history"
            );


            if (response.data.success) {

                setHistory(
                    response.data.history || []
                );

            } else {

                setError(
                    response.data.message ||
                    "Unable to load cash register history."
                );

            }

        } catch (err) {

            console.error(
                "Cash Register History Error:",
                err
            );


            setError(
                err.response?.data?.message ||
                "Unable to load cash register history."
            );

        } finally {

            setLoading(false);

        }

    }, []);


    // ==================================================
    // LOAD HISTORY
    // ==================================================

    useEffect(() => {

        fetchHistory();

    }, [fetchHistory]);


    // ==================================================
    // FORMAT DATE
    // ==================================================

    const formatDate = (date) => {

        if (!date) {

            return "-";

        }


        return new Date(date).toLocaleString(
            "en-IN",
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        );

    };


    // ==================================================
    // FORMAT MONEY
    // ==================================================

    const formatMoney = (value) => {

        return `₹ ${Number(value || 0).toFixed(2)}`;

    };


    // ==================================================
    // FILTER HISTORY
    // ==================================================

    const filteredHistory = history.filter(
        (register) => {

            const searchValue =
                search.toLowerCase().trim();


            return (

                String(
                    register.cashier_name || ""
                )
                    .toLowerCase()
                    .includes(searchValue)

                ||

                String(
                    register.status || ""
                )
                    .toLowerCase()
                    .includes(searchValue)

                ||

                formatDate(
                    register.opening_time
                )
                    .toLowerCase()
                    .includes(searchValue)

            );

        }
    );


    // ==================================================
    // RENDER
    // ==================================================

    return (

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">


            {/* ==================================================
                MAIN CARD
            ================================================== */}

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">


                {/* ==================================================
                    PAGE HEADER
                ================================================== */}

                <div className="px-5 sm:px-6 py-5 border-b border-slate-200">

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">


                        {/* TITLE */}

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
                                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />

                                </svg>

                            </div>


                            <div>

                                <h1 className="text-2xl font-bold text-slate-800">

                                    Cash Register History

                                </h1>


                                <p className="text-sm text-slate-500 mt-0.5">

                                    View and manage previous cash register sessions

                                </p>

                            </div>

                        </div>


                        {/* RIGHT SIDE */}

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">


                            {/* SESSION COUNT */}

                            <div className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm">

                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>

                                <span className="text-sm font-semibold text-slate-700">

                                    {filteredHistory.length} Sessions

                                </span>

                            </div>


                            {/* BACK BUTTON */}

                            <button
                                type="button"
                                onClick={() =>
                                    navigate("/cash-register")
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

                                Cash Register

                            </button>

                        </div>

                    </div>

                </div>


                {/* ==================================================
                    SEARCH HEADER
                ================================================== */}

                <div className="px-5 sm:px-6 py-5 border-b border-slate-200">

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">


                        {/* DESCRIPTION */}

                        <div>

                            <h2 className="text-base font-semibold text-slate-800">

                                Register Sessions

                            </h2>


                            <p className="text-xs text-slate-500 mt-1">

                                Search and review previous cash register activity

                            </p>

                        </div>


                        {/* SEARCH + REFRESH */}

                        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">


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
                                    placeholder="Search cashier or status..."
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(e.target.value)
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


                            {/* REFRESH */}

                            <button
                                type="button"
                                onClick={fetchHistory}
                                disabled={loading}
                                className="inline-flex items-center justify-center gap-2 h-10 px-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >

                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className={`w-4 h-4 ${
                                        loading
                                            ? "animate-spin"
                                            : ""
                                    }`}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >

                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 4v5h5M20 20v-5h-5M5.07 9A7 7 0 0117.66 6.34L20 9M19 15a7 7 0 01-12.66 2.66L4 15"
                                    />

                                </svg>

                                Refresh

                            </button>

                        </div>

                    </div>

                </div>


                {/* ==================================================
                    ERROR
                ================================================== */}

                {error && (

                    <div className="px-5 sm:px-6 pt-5">

                        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">

                            <div className="w-8 h-8 shrink-0 rounded-lg bg-red-100 flex items-center justify-center">

                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-4 h-4 text-red-600"
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


                            <div>

                                <p className="text-sm font-semibold text-red-700">

                                    Unable to load register history

                                </p>


                                <p className="text-xs text-red-600 mt-0.5">

                                    {error}

                                </p>

                            </div>

                        </div>

                    </div>

                )}


                {/* ==================================================
                    CONTENT
                ================================================== */}

                <div className="px-4 sm:px-6 lg:px-8 py-5">

                    {loading ? (

                        /* ==================================================
                            LOADING
                        ================================================== */

                        <div className="px-5 py-14 text-center">

                            <div className="flex flex-col items-center">

                                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">

                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-6 h-6 text-slate-400 animate-spin"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >

                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 3v3m6.36-.36l-2.12 2.12M21 12h-3m-.36 6.36l-2.12-2.12M12 21v-3m-6.36.36l2.12-2.12M3 12h3m.36-6.36l2.12 2.12"
                                        />

                                    </svg>

                                </div>


                                <p className="text-sm font-semibold text-slate-600">

                                    Loading cash register history...

                                </p>


                                <p className="text-xs text-slate-400 mt-1">

                                    Please wait while the register sessions are loaded.

                                </p>

                            </div>

                        </div>

                    ) : filteredHistory.length > 0 ? (

                        /* ==================================================
                            TABLE
                        ================================================== */

                        <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white">

                            <table className="w-full min-w-[1100px] table-fixed">

                                {/* TABLE HEADER */}

                                <thead>

                                    <tr className="bg-slate-50 border-b border-slate-200">

                                        <th className="w-[18%] px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">
                                            Date
                                        </th>

                                        <th className="w-[14%] px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">
                                            Cashier
                                        </th>

                                        <th className="w-[10%] px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">
                                            Opening
                                        </th>

                                        <th className="w-[11%] px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">
                                            Expected
                                        </th>

                                        <th className="w-[10%] px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">
                                            Actual
                                        </th>

                                        <th className="w-[12%] px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">
                                            Difference
                                        </th>

                                        <th className="w-[13%] px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">
                                            Owner Taken
                                        </th>

                                        <th className="w-[12%] px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">
                                            Status
                                        </th>

                                    </tr>

                                </thead>


                                {/* TABLE BODY */}

                                <tbody className="divide-y divide-slate-100">

                                    {filteredHistory.map((register) => {

                                        const difference =
                                            Number(
                                                register.difference || 0
                                            );


                                        const ownerTaken =
                                            Number(
                                                register.owner_taken || 0
                                            );


                                        return (

                                            <tr
                                                key={register.id}
                                                className="hover:bg-slate-50/80 transition"
                                            >

                                                {/* DATE */}

                                                <td className="px-5 py-4 text-center align-middle">

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
                                                                    d="M8 7V3m8 4V3m-9 8h10M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z"
                                                                />

                                                            </svg>

                                                        </div>


                                                        <div className="text-center">

                                                            <p className="text-sm font-semibold text-slate-800">

                                                                {formatDate(
                                                                    register.opening_time
                                                                )}

                                                            </p>


                                                            {register.closing_time && (

                                                                <p className="text-xs text-slate-400 mt-0.5">

                                                                    Closed:{" "}

                                                                    {formatDate(
                                                                        register.closing_time
                                                                    )}

                                                                </p>

                                                            )}

                                                        </div>

                                                    </div>

                                                </td>


                                                {/* CASHIER */}

                                                <td className="px-5 py-4 text-center align-middle">

                                                    <div className="flex items-center justify-center gap-2.5">

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
                                                                    d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 004 4v2m7-10a4 4 0 100-8 4 4 0 000 8zm7 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
                                                                />

                                                            </svg>

                                                        </div>


                                                        <span className="text-sm font-semibold text-slate-700">

                                                            {register.cashier_name || "-"}

                                                        </span>

                                                    </div>

                                                </td>


                                                {/* OPENING */}

                                                <td className="px-5 py-4 text-center align-middle">

                                                    <span className="text-sm font-semibold text-slate-800">

                                                        {formatMoney(
                                                            register.opening_cash
                                                        )}

                                                    </span>

                                                </td>


                                                {/* EXPECTED */}

                                                <td className="px-5 py-4 text-center align-middle">

                                                    <span className="text-sm font-semibold text-slate-800">

                                                        {register.expected_cash !== null &&
                                                        register.expected_cash !== undefined
                                                            ? formatMoney(
                                                                register.expected_cash
                                                            )
                                                            : "-"
                                                        }

                                                    </span>

                                                </td>


                                                {/* ACTUAL */}

                                                <td className="px-5 py-4 text-center align-middle">

                                                    <span className="text-sm font-semibold text-slate-800">

                                                        {register.actual_cash !== null &&
                                                        register.actual_cash !== undefined
                                                            ? formatMoney(
                                                                register.actual_cash
                                                            )
                                                            : "-"
                                                        }

                                                    </span>

                                                </td>


                                                {/* DIFFERENCE */}

                                                <td className="px-5 py-4 text-center align-middle">

                                                    {register.difference !== null &&
                                                    register.difference !== undefined ? (

                                                        <span
                                                            className={`text-sm font-bold ${
                                                                difference < 0
                                                                    ? "text-red-600"
                                                                    : difference > 0
                                                                    ? "text-emerald-600"
                                                                    : "text-slate-700"
                                                            }`}
                                                        >

                                                            {difference > 0
                                                                ? "+"
                                                                : ""
                                                            }

                                                            {formatMoney(
                                                                difference
                                                            )}

                                                        </span>

                                                    ) : (

                                                        <span className="text-sm text-slate-400">
                                                            -
                                                        </span>

                                                    )}

                                                </td>


                                                {/* OWNER TAKEN */}

                                                <td className="px-5 py-4 text-center align-middle">

                                                    {register.owner_taken !== null &&
                                                    register.owner_taken !== undefined ? (

                                                        <span className="text-sm font-semibold text-slate-800">

                                                            {formatMoney(
                                                                ownerTaken
                                                            )}

                                                        </span>

                                                    ) : (

                                                        <span className="text-sm text-slate-400">
                                                            -
                                                        </span>

                                                    )}

                                                </td>


                                                {/* STATUS */}

                                                <td className="px-5 py-4 text-center align-middle">

                                                    <div className="flex items-center justify-center">

                                                        <span
                                                            className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${
                                                                register.status === "OPEN"
                                                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                                                    : "bg-slate-100 border-slate-200 text-slate-600"
                                                            }`}
                                                        >

                                                            <span
                                                                className={`w-1.5 h-1.5 rounded-full ${
                                                                    register.status === "OPEN"
                                                                        ? "bg-emerald-500"
                                                                        : "bg-slate-400"
                                                                }`}
                                                            ></span>


                                                            {register.status || "CLOSED"}

                                                        </span>

                                                    </div>

                                                </td>

                                            </tr>

                                        );

                                    })}

                                </tbody>

                            </table>

                        </div>

                    ) : (

                        /* ==================================================
                            EMPTY STATE
                        ================================================== */

                        <div className="px-5 py-14 text-center">

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
                                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />

                                    </svg>

                                </div>


                                <p className="text-sm font-semibold text-slate-600">

                                    {search
                                        ? `No register sessions found for "${search}".`
                                        : "No cash register history available."
                                    }

                                </p>


                                <p className="text-xs text-slate-400 mt-1">

                                    {search
                                        ? "Try a different cashier name or status."
                                        : "Closed register sessions will appear here."
                                    }

                                </p>

                            </div>

                        </div>

                    )}

                </div>


                {/* ==================================================
                    FOOTER
                ================================================== */}

                {filteredHistory.length > 0 && !loading && (

                    <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">

                        <p className="text-xs text-slate-500">

                            Showing{" "}

                            <span className="font-semibold text-slate-700">

                                {filteredHistory.length}

                            </span>{" "}

                            session
                            {filteredHistory.length !== 1
                                ? "s"
                                : ""
                            }

                        </p>


                        {search && (

                            <button
                                type="button"
                                onClick={() =>
                                    setSearch("")
                                }
                                className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition self-start sm:self-auto"
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


export default CashRegisterHistory;