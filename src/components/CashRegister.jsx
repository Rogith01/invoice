import React, {
    useEffect,
    useState
} from "react";

import axios from "axios";
import { useNavigate } from "react-router-dom";


const API_URL =
    "https://invoice-backend-78hd.onrender.com";


const CashRegister = () => {

    const navigate = useNavigate();


    // ==================================================
    // STATES
    // ==================================================

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


    // ==================================================
    // CLOSE DIALOG
    // ==================================================

    const [showCloseDialog, setShowCloseDialog] =
        useState(false);


    // ==================================================
    // FINAL CLOSE SUMMARY
    // ==================================================

    const [closeSummary, setCloseSummary] =
        useState(null);


    // ==================================================
    // TOKEN
    // ==================================================

    const getToken = () => {

        return sessionStorage.getItem("token");

    };


    // ==================================================
    // FETCH SUMMARY
    // ==================================================

    const fetchCashRegisterSummary =
        async () => {

            try {

                const token =
                    getToken();

                const response =
                    await axios.get(
                        `${API_URL}/api/cash-register/summary`,
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


    // ==================================================
    // FETCH CURRENT OPEN REGISTER
    // ==================================================

    const fetchCurrentRegister =
        async () => {

            try {

                const token =
                    getToken();

                const response =
                    await axios.get(
                        `${API_URL}/api/cash-register/current`,
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

            } catch (error) {

                console.error(
                    "Current Register Error:",
                    error
                );

            }

        };


    // ==================================================
    // INITIAL LOAD
    // ==================================================

    useEffect(() => {

        fetchCashRegisterSummary();

        fetchCurrentRegister();

    }, []);


    // ==================================================
    // TOTAL SALES
    // ==================================================

    const totalSales =
        Number(cashSales || 0) +
        Number(onlineSales || 0);


    // ==================================================
    // EXPECTED CASH
    //
    // Online sales are NOT included.
    //
    // Opening Cash
    // + Cash Sales
    // - Refunds
    // ==================================================

    const expectedCash =
        Number(openingCash || 0) +
        Number(cashSales || 0) -
        Number(refunds || 0);


    // ==================================================
    // DIFFERENCE
    // ==================================================

    const difference =
        Number(actualCash || 0) -
        expectedCash;


    // ==================================================
    // REMAINING CASH
    // ==================================================

    const remainingCash =
        Number(actualCash || 0) -
        Number(ownerTaken || 0);


    // ==================================================
    // OPEN REGISTER
    // ==================================================

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


                const token =
                    getToken();


                const response =
                    await axios.post(
                        `${API_URL}/api/cash-register/open`,
                        {
                            openingCash:
                                amount
                        },
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


    // ==================================================
    // OPEN CLOSE DIALOG
    // ==================================================

    const handleOpenCloseDialog =
        () => {

            setError("");

            setMessage("");

            setActualCash("");

            setOwnerTaken("");

            setShowCloseDialog(true);

        };


    // ==================================================
    // CLOSE REGISTER
    // ==================================================

    const handleCloseRegister =
        async () => {

            setError("");


            const actual =
                Number(actualCash);

            const owner =
                Number(ownerTaken || 0);


            // ==================================================
            // VALIDATE ACTUAL CASH
            // ==================================================

            if (
                !Number.isFinite(actual) ||
                actual < 0
            ) {

                setError(
                    "Please enter a valid actual cash amount."
                );

                return;

            }


            // ==================================================
            // VALIDATE OWNER TAKEN
            // ==================================================

            if (
                !Number.isFinite(owner) ||
                owner < 0
            ) {

                setError(
                    "Please enter a valid owner taken amount."
                );

                return;

            }


            // ==================================================
            // OWNER CANNOT TAKE MORE THAN ACTUAL CASH
            // ==================================================

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


                const token =
                    getToken();


                const response =
                    await axios.post(
                        `${API_URL}/api/cash-register/close`,
                        {
                            actualCash:
                                actual,

                            ownerTaken:
                                owner
                        },
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

                    const summary = {

                        // ------------------------------------------
                        // REGISTER VALUES
                        // ------------------------------------------

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

                        // ------------------------------------------
                        // SALES VALUES
                        // ------------------------------------------

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


    // ==================================================
    // FORMAT MONEY
    // ==================================================

    const formatMoney =
        (value) => {

            return `₹ ${Number(
                value || 0
            ).toFixed(2)}`;

        };


    // ==================================================
    // CLOSE FINAL SUMMARY
    // ==================================================

    const closeFinalSummary = () => {

        setCloseSummary(null);


        setMessage(
            "Cash register closed successfully."
        );


        fetchCashRegisterSummary();

        fetchCurrentRegister();

    };


    // ==================================================
    // UI
    // ==================================================

    return (

        <div className="min-h-screen bg-gray-100 p-6">

            <div className="max-w-5xl mx-auto">


                {/* ==================================================
                    HEADER
                ================================================== */}

                <div className="flex items-center justify-between mb-6">

                    <div>

                        <h1 className="text-3xl font-bold text-gray-800">

                            💰 Cash Register

                        </h1>

                        <p className="text-gray-500 mt-1">

                            Daily cash drawer management

                        </p>

                    </div>


                    <button
                        onClick={() =>
                            navigate(
                                "/cash-register-history"
                            )
                        }
                        className="bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-lg font-semibold shadow"
                    >

                        📋 History

                    </button>

                </div>


                {/* ==================================================
                    MESSAGE
                ================================================== */}

                {message && (

                    <div className="mb-4 bg-green-100 text-green-700 px-4 py-3 rounded-lg">

                        {message}

                    </div>

                )}


                {/* ==================================================
                    ERROR
                ================================================== */}

                {error && (

                    <div className="mb-4 bg-red-100 text-red-700 px-4 py-3 rounded-lg">

                        {error}

                    </div>

                )}


                {/* ==================================================
                    REGISTER STATUS
                ================================================== */}

                <div className="bg-white rounded-xl shadow p-6 mb-6">

                    <div className="flex items-center justify-between">

                        <div>

                            <h2 className="text-xl font-bold">

                                Register Status

                            </h2>

                            <p className="mt-1 text-gray-500">

                                {registerOpen
                                    ? "Register is currently OPEN"
                                    : "Register is currently CLOSED"
                                }

                            </p>

                        </div>


                        <div
                            className={`px-4 py-2 rounded-full font-semibold ${
                                registerOpen
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-600"
                            }`}
                        >

                            {registerOpen
                                ? "OPEN"
                                : "CLOSED"
                            }

                        </div>

                    </div>

                </div>


                {/* ==================================================
                    OPENING CASH
                ================================================== */}

                <div className="bg-white rounded-xl shadow p-6 mb-6">

                    <h2 className="text-xl font-bold mb-4">

                        Opening Cash

                    </h2>


                    <label className="block font-semibold mb-2">

                        Opening Cash Amount

                    </label>


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
                        placeholder="Enter opening cash"
                        disabled={registerOpen}
                        className="w-full md:w-80 border rounded-lg px-4 py-3"
                    />


                    <button
                        onClick={
                            handleOpenRegister
                        }
                        disabled={
                            registerOpen ||
                            loading
                        }
                        className="mt-4 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-50"
                    >

                        {loading
                            ? "Processing..."
                            : "Open Register"
                        }

                    </button>

                </div>


                {/* ==================================================
                    SALES SUMMARY
                ================================================== */}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">


                    {/* CASH SALES */}

                    <div className="bg-white rounded-xl shadow p-5">

                        <p className="text-gray-500">

                            Cash Sales

                        </p>

                        <h2 className="text-2xl font-bold mt-2">

                            {formatMoney(
                                cashSales
                            )}

                        </h2>

                    </div>


                    {/* ONLINE SALES */}

                    <div className="bg-white rounded-xl shadow p-5">

                        <p className="text-gray-500">

                            Online Sales

                        </p>

                        <h2 className="text-2xl font-bold mt-2">

                            {formatMoney(
                                onlineSales
                            )}

                        </h2>

                    </div>


                    {/* TOTAL SALES */}

                    <div className="bg-white rounded-xl shadow p-5">

                        <p className="text-gray-500">

                            Total Sales

                        </p>

                        <h2 className="text-2xl font-bold mt-2">

                            {formatMoney(
                                totalSales
                            )}

                        </h2>

                    </div>


                    {/* REFUNDS */}

                    <div className="bg-white rounded-xl shadow p-5">

                        <p className="text-gray-500">

                            Refunds

                        </p>

                        <h2 className="text-2xl font-bold mt-2">

                            {formatMoney(
                                refunds
                            )}

                        </h2>

                    </div>

                </div>


                {/* ==================================================
                    REGISTER SUMMARY
                ================================================== */}

                <div className="bg-white rounded-xl shadow p-6 mb-6">

                    <h2 className="text-xl font-bold mb-5">

                        Register Summary

                    </h2>


                    <div className="space-y-4">


                        {/* OPENING CASH */}

                        <div className="flex justify-between">

                            <span>

                                Opening Cash

                            </span>

                            <span className="font-semibold">

                                {formatMoney(
                                    openingCash
                                )}

                            </span>

                        </div>


                        {/* CASH SALES */}

                        <div className="flex justify-between">

                            <span>

                                Cash Sales

                            </span>

                            <span className="font-semibold">

                                {formatMoney(
                                    cashSales
                                )}

                            </span>

                        </div>


                        {/* ONLINE SALES */}

                        <div className="flex justify-between">

                            <span>

                                Online Sales

                            </span>

                            <span className="font-semibold">

                                {formatMoney(
                                    onlineSales
                                )}

                            </span>

                        </div>


                        {/* TOTAL SALES */}

                        <div className="flex justify-between">

                            <span>

                                Total Sales

                            </span>

                            <span className="font-semibold">

                                {formatMoney(
                                    totalSales
                                )}

                            </span>

                        </div>


                        {/* REFUNDS */}

                        <div className="flex justify-between">

                            <span>

                                Refunds

                            </span>

                            <span className="font-semibold">

                                - {formatMoney(
                                    refunds
                                )}

                            </span>

                        </div>


                        {/* EXPLANATION */}

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">

                            <p className="text-sm text-blue-700">

                                💡 Online sales are displayed for
                                reporting, but they are not added
                                to Expected Cash because they are
                                not physical cash in the drawer.

                            </p>

                        </div>


                        {/* EXPECTED CASH */}

                        <div className="border-t pt-4 flex justify-between text-xl font-bold">

                            <span>

                                Expected Cash

                            </span>

                            <span className="text-blue-700">

                                {formatMoney(
                                    expectedCash
                                )}

                            </span>

                        </div>

                    </div>

                </div>


                {/* ==================================================
                    CLOSING CASH
                ================================================== */}

                <div className="bg-white rounded-xl shadow p-6">

                    <h2 className="text-xl font-bold mb-4">

                        Closing Cash

                    </h2>


                    <p className="text-gray-500 mb-4">

                        Count the physical cash in the drawer before closing.

                    </p>


                    <button
                        onClick={
                            handleOpenCloseDialog
                        }
                        disabled={
                            !registerOpen ||
                            loading
                        }
                        className="px-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50"
                    >

                        🔒 Close Register

                    </button>

                </div>


                {/* ==================================================
                    CLOSE REGISTER DIALOG
                ================================================== */}

                {showCloseDialog && (

                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">

                        {/* ==================================================
                            MODAL
                            FIXED HEIGHT + SCROLLABLE BODY
                        ================================================== */}

                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">


                            {/* ==================================================
                                HEADER
                            ================================================== */}

                            <div className="px-6 py-5 border-b shrink-0">

                                <h2 className="text-2xl font-bold text-gray-800">

                                    🔒 Close Cash Register

                                </h2>

                                <p className="text-gray-500 mt-1">

                                    Complete the cash closing details.

                                </p>

                            </div>


                            {/* ==================================================
                                BODY
                                SCROLLABLE
                            ================================================== */}

                            <div className="p-6 overflow-y-auto flex-1">


                                {/* ==================================================
                                    SALES INFORMATION
                                ================================================== */}

                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5">

                                    <h3 className="font-bold text-gray-800 mb-4">

                                        Today's Sales

                                    </h3>


                                    <div className="space-y-3">


                                        {/* CASH */}

                                        <div className="flex justify-between">

                                            <span className="text-gray-600">

                                                Cash Sales

                                            </span>

                                            <span className="font-semibold">

                                                {formatMoney(
                                                    cashSales
                                                )}

                                            </span>

                                        </div>


                                        {/* ONLINE */}

                                        <div className="flex justify-between">

                                            <span className="text-gray-600">

                                                Online Sales

                                            </span>

                                            <span className="font-semibold">

                                                {formatMoney(
                                                    onlineSales
                                                )}

                                            </span>

                                        </div>


                                        {/* TOTAL */}

                                        <div className="border-t pt-3 flex justify-between">

                                            <span className="font-semibold">

                                                Total Sales

                                            </span>

                                            <span className="font-bold">

                                                {formatMoney(
                                                    totalSales
                                                )}

                                            </span>

                                        </div>

                                    </div>

                                </div>


                                {/* ==================================================
                                    EXPECTED CASH
                                ================================================== */}

                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">

                                    <div className="flex justify-between">

                                        <span className="text-gray-600">

                                            Expected Cash

                                        </span>

                                        <span className="font-bold text-blue-700">

                                            {formatMoney(
                                                expectedCash
                                            )}

                                        </span>

                                    </div>


                                    <p className="text-xs text-blue-600 mt-2">

                                        Opening Cash + Cash Sales - Refunds.
                                        Online Sales are not included.

                                    </p>

                                </div>


                                {/* ==================================================
                                    ACTUAL CASH
                                ================================================== */}

                                <label className="block font-semibold mb-2">

                                    Actual Cash Counted

                                </label>


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
                                    placeholder="Enter actual cash"
                                    autoFocus
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-5 focus:ring-2 focus:ring-blue-500 outline-none"
                                />


                                {/* ==================================================
                                    DIFFERENCE
                                ================================================== */}

                                {actualCash !== "" && (

                                    <div
                                        className={`rounded-xl p-4 mb-5 ${
                                            difference === 0
                                                ? "bg-green-50 border border-green-200"
                                                : difference < 0
                                                ? "bg-red-50 border border-red-200"
                                                : "bg-yellow-50 border border-yellow-200"
                                        }`}
                                    >

                                        <div className="flex justify-between">

                                            <span className="font-semibold">

                                                Difference

                                            </span>

                                            <span className="font-bold">

                                                {formatMoney(
                                                    difference
                                                )}

                                            </span>

                                        </div>


                                        <p className="text-sm mt-1">

                                            {difference === 0
                                                ? "✓ Register is perfectly balanced."
                                                : difference < 0
                                                ? `Short by ${formatMoney(
                                                    Math.abs(
                                                        difference
                                                    )
                                                )}`
                                                : `Over by ${formatMoney(
                                                    difference
                                                )}`
                                            }

                                        </p>

                                    </div>

                                )}


                                {/* ==================================================
                                    OWNER TAKEN
                                ================================================== */}

                                <label className="block font-semibold mb-2">

                                    Owner Taken Amount

                                </label>


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
                                    placeholder="Enter amount taken by owner"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none"
                                />


                                <p className="text-xs text-gray-500 mt-2">

                                    This amount is recorded separately
                                    and does not affect the cash difference.

                                </p>


                                {/* ==================================================
                                    REMAINING CASH
                                ================================================== */}

                                {ownerTaken !== "" &&
                                    actualCash !== "" && (

                                    <div className="mt-5 bg-purple-50 border border-purple-200 rounded-xl p-4">

                                        <div className="flex justify-between">

                                            <span className="font-semibold">

                                                Cash Remaining for Next Day

                                            </span>

                                            <span className="font-bold text-purple-700">

                                                {formatMoney(
                                                    remainingCash
                                                )}

                                            </span>

                                        </div>

                                    </div>

                                )}


                                {/* ==================================================
                                    ERROR
                                ================================================== */}

                                {error && (

                                    <div className="mt-4 bg-red-100 text-red-700 px-4 py-3 rounded-lg">

                                        {error}

                                    </div>

                                )}

                            </div>


                            {/* ==================================================
                                FOOTER
                                ALWAYS VISIBLE
                            ================================================== */}

                            <div className="px-6 py-5 border-t flex justify-end gap-3 shrink-0 bg-white rounded-b-2xl">

                                <button
                                    onClick={() => {

                                        setShowCloseDialog(
                                            false
                                        );

                                        setError("");

                                    }}
                                    disabled={loading}
                                    className="px-5 py-2.5 rounded-lg border border-gray-300 font-semibold text-gray-700 hover:bg-gray-100"
                                >

                                    Cancel

                                </button>


                                <button
                                    onClick={
                                        handleCloseRegister
                                    }
                                    disabled={
                                        loading ||
                                        actualCash === ""
                                    }
                                    className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50"
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


                {/* ==================================================
                    FINAL SUCCESS DIALOG
                ================================================== */}

                {closeSummary && (

                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">

                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">


                            {/* HEADER */}

                            <div className="p-6 text-center border-b shrink-0">

                                <div className="text-5xl mb-3">

                                    ✅

                                </div>

                                <h2 className="text-2xl font-bold text-gray-800">

                                    Register Closed Successfully

                                </h2>

                                <p className="text-gray-500 mt-1">

                                    Today's cash register has been closed.

                                </p>

                            </div>


                            {/* SUMMARY */}

                            <div className="p-6 space-y-4 overflow-y-auto flex-1">


                                {/* CASH SALES */}

                                <div className="flex justify-between">

                                    <span>

                                        Cash Sales

                                    </span>

                                    <span className="font-bold">

                                        {formatMoney(
                                            closeSummary.cashSales
                                        )}

                                    </span>

                                </div>


                                {/* ONLINE SALES */}

                                <div className="flex justify-between">

                                    <span>

                                        Online Sales

                                    </span>

                                    <span className="font-bold">

                                        {formatMoney(
                                            closeSummary.onlineSales
                                        )}

                                    </span>

                                </div>


                                {/* TOTAL SALES */}

                                <div className="flex justify-between">

                                    <span className="font-semibold">

                                        Total Sales

                                    </span>

                                    <span className="font-bold">

                                        {formatMoney(
                                            closeSummary.totalSales
                                        )}

                                    </span>

                                </div>


                                {/* REFUNDS */}

                                <div className="flex justify-between">

                                    <span>

                                        Refunds

                                    </span>

                                    <span className="font-bold">

                                        - {formatMoney(
                                            closeSummary.refunds
                                        )}

                                    </span>

                                </div>


                                {/* SEPARATOR */}

                                <div className="border-t pt-4">


                                    {/* EXPECTED CASH */}

                                    <div className="flex justify-between">

                                        <span>

                                            Expected Cash

                                        </span>

                                        <span className="font-bold">

                                            {formatMoney(
                                                closeSummary.expectedCash
                                            )}

                                        </span>

                                    </div>


                                    {/* ACTUAL CASH */}

                                    <div className="flex justify-between mt-4">

                                        <span>

                                            Actual Cash

                                        </span>

                                        <span className="font-bold">

                                            {formatMoney(
                                                closeSummary.actualCash
                                            )}

                                        </span>

                                    </div>


                                    {/* DIFFERENCE */}

                                    <div className="flex justify-between mt-4">

                                        <span>

                                            Difference

                                        </span>

                                        <span
                                            className={`font-bold ${
                                                closeSummary.difference < 0
                                                    ? "text-red-600"
                                                    : closeSummary.difference > 0
                                                    ? "text-green-600"
                                                    : "text-gray-700"
                                            }`}
                                        >

                                            {formatMoney(
                                                closeSummary.difference
                                            )}

                                        </span>

                                    </div>

                                </div>


                                {/* OWNER TAKEN */}

                                <div className="border-t pt-4 flex justify-between">

                                    <span className="font-semibold">

                                        Owner Taken

                                    </span>

                                    <span className="font-bold text-purple-700">

                                        {formatMoney(
                                            closeSummary.ownerTaken
                                        )}

                                    </span>

                                </div>


                                {/* REMAINING CASH */}

                                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">

                                    <div className="flex justify-between">

                                        <span className="font-semibold">

                                            Remaining Cash

                                        </span>

                                        <span className="font-bold text-purple-700">

                                            {formatMoney(
                                                closeSummary.remainingCash
                                            )}

                                        </span>

                                    </div>


                                    <p className="text-sm text-gray-500 mt-2">

                                        Enter this amount as the opening
                                        cash when starting the next register.

                                    </p>

                                </div>

                            </div>


                            {/* FOOTER */}

                            <div className="p-6 border-t shrink-0">

                                <button
                                    onClick={
                                        closeFinalSummary
                                    }
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold"
                                >

                                    Done

                                </button>

                            </div>

                        </div>

                    </div>

                )}

            </div>

        </div>

    );

};


export default CashRegister;