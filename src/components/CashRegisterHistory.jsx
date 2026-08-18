import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL =
    "https://invoice-backend-78hd.onrender.com";

const CashRegisterHistory = () => {

    const [history, setHistory] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    // ==================================================
    // FETCH HISTORY
    // ==================================================

    const fetchHistory = async () => {

        try {

            setLoading(true);
            setError("");

            const token =
                sessionStorage.getItem("token");

            const response =
                await axios.get(
                    `${API_URL}/api/cash-register/history`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            if (
                response.data.success
            ) {

                setHistory(
                    response.data.history || []
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

    };


    // ==================================================
    // LOAD HISTORY
    // ==================================================

    useEffect(() => {

        fetchHistory();

    }, []);


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

        return `₹ ${Number(
            value || 0
        ).toFixed(2)}`;

    };


    // ==================================================
    // UI
    // ==================================================

    return (

        <div className="min-h-screen bg-gray-100 p-6">

            <div className="max-w-7xl mx-auto">


                {/* ==========================================
                    HEADER
                ========================================== */}

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">

                    <div>

                        <h1 className="text-3xl font-bold text-gray-800">
                            📋 Cash Register History
                        </h1>

                        <p className="text-gray-500 mt-1">
                            View previous cash register sessions
                        </p>

                    </div>


                    <button
                        onClick={fetchHistory}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold"
                    >
                        🔄 Refresh
                    </button>

                </div>


                {/* ==========================================
                    ERROR
                ========================================== */}

                {error && (

                    <div className="mb-5 bg-red-100 text-red-700 px-4 py-3 rounded-lg">

                        {error}

                    </div>

                )}


                {/* ==========================================
                    LOADING
                ========================================== */}

                {loading ? (

                    <div className="bg-white rounded-xl shadow p-8 text-center">

                        <p className="text-gray-500">
                            Loading cash register history...
                        </p>

                    </div>

                ) : history.length === 0 ? (

                    /* ==========================================
                       NO HISTORY
                    ========================================== */

                    <div className="bg-white rounded-xl shadow p-10 text-center">

                        <div className="text-5xl mb-4">
                            📋
                        </div>

                        <h2 className="text-xl font-bold text-gray-700">
                            No Cash Register History
                        </h2>

                        <p className="text-gray-500 mt-2">
                            Closed register sessions will appear here.
                        </p>

                    </div>

                ) : (

                    /* ==========================================
                       HISTORY TABLE
                    ========================================== */

                    <div className="bg-white rounded-xl shadow overflow-hidden">

                        <div className="overflow-x-auto">

                            <table className="w-full text-center">

                                <thead className="bg-slate-800 text-white">

                                    <tr>

                                        <th className="px-5 py-4">
                                            Date
                                        </th>

                                        <th className="px-5 py-4">
                                            Cashier
                                        </th>

                                        <th className="px-5 py-4">
                                            Opening
                                        </th>

                                        <th className="px-5 py-4">
                                            Expected
                                        </th>

                                        <th className="px-5 py-4">
                                            Actual
                                        </th>

                                        <th className="px-5 py-4">
                                            Difference
                                        </th>

                                        {/* OWNER TAKEN */}

                                        <th className="px-5 py-4">
                                            Owner Taken
                                        </th>

                                        <th className="px-5 py-4">
                                            Status
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {history.map(
                                        (register) => {

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
                                                    key={
                                                        register.id
                                                    }
                                                    className="border-b hover:bg-gray-50"
                                                >

                                                    {/* DATE */}

                                                    <td className="px-5 py-4">

                                                        <div className="font-medium text-gray-800">

                                                            {formatDate(
                                                                register.opening_time
                                                            )}

                                                        </div>

                                                        {register.closing_time && (

                                                            <div className="text-xs text-gray-500 mt-1">

                                                                Closed:{" "}

                                                                {formatDate(
                                                                    register.closing_time
                                                                )}

                                                            </div>

                                                        )}

                                                    </td>


                                                    {/* CASHIER */}

                                                    <td className="px-5 py-4">

                                                        <div className="font-medium">

                                                            👤{" "}

                                                            {
                                                                register.cashier_name
                                                            }

                                                        </div>

                                                    </td>


                                                    {/* OPENING */}

                                                    <td className="px-5 py-4 text-center">

                                                        {formatMoney(
                                                            register.opening_cash
                                                        )}

                                                    </td>


                                                    {/* EXPECTED */}

                                                    <td className="px-5 py-4 text-center">

                                                        {register.expected_cash !== null

                                                            ? formatMoney(
                                                                register.expected_cash
                                                            )

                                                            : "-"

                                                        }

                                                    </td>


                                                    {/* ACTUAL */}

                                                    <td className="px-5 py-4 text-center">

                                                        {register.actual_cash !== null

                                                            ? formatMoney(
                                                                register.actual_cash
                                                            )

                                                            : "-"

                                                        }

                                                    </td>


                                                    {/* DIFFERENCE */}

                                                    <td
                                                        className={`px-5 py-4 text-center font-bold ${
                                                            difference < 0
                                                                ? "text-red-600"
                                                                : difference > 0
                                                                ? "text-green-600"
                                                                : "text-gray-700"
                                                        }`}
                                                    >

                                                        {register.difference !== null

                                                            ? formatMoney(
                                                                difference
                                                            )

                                                            : "-"

                                                        }

                                                    </td>


                                                    {/* OWNER TAKEN */}

                                                    <td className="px-5 py-4 text-center">

                                                        {register.owner_taken !== null

                                                            ? (

                                                                <span className="font-bold text-orange-600">

                                                                    {formatMoney(
                                                                        ownerTaken
                                                                    )}

                                                                </span>

                                                            )

                                                            : "-"

                                                        }

                                                    </td>


                                                    {/* STATUS */}

                                                    <td className="px-5 py-4 text-center">

                                                        <span
                                                            className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                                                                register.status === "OPEN"
                                                                    ? "bg-green-100 text-green-700"
                                                                    : "bg-gray-100 text-gray-600"
                                                            }`}
                                                        >

                                                            {
                                                                register.status
                                                            }

                                                        </span>

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

            </div>

        </div>

    );

};

export default CashRegisterHistory;