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
    // OWNER TAKES AMOUNT STATES
    // ==================================================

    const [ownerTakenAmount, setOwnerTakenAmount] =
        useState("");

    const [ownerTakeSaved, setOwnerTakeSaved] =
        useState(false);

    const [remainingCash, setRemainingCash] =
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
                    sessionStorage.getItem("token");

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
    // EXPECTED CASH
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
    // CLOSE REGISTER
    // ==================================================

    const handleCloseRegister =
        async () => {

            setError("");

            setMessage("");

            if (!registerOpen) {

                setError(
                    "Please open the register first."
                );

                return;

            }


            const amount =
                Number(actualCash);

            if (
                !Number.isFinite(amount) ||
                amount < 0
            ) {

                setError(
                    "Please enter a valid actual cash amount."
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

                    setMessage(
                        "Cash register closed successfully."
                    );

                    setRegisterOpen(false);

                    // Reset owner section
                    setOwnerTakenAmount("");

                    setOwnerTakeSaved(false);

                    setRemainingCash(null);

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
    // OWNER TAKES CASH
    // ==================================================

    const handleOwnerTake =
        async () => {

            setError("");

            setMessage("");


            const amount =
                Number(ownerTakenAmount);

            const actual =
                Number(actualCash || 0);


            // ==================================================
            // VALIDATE AMOUNT
            // ==================================================

            if (
                !Number.isFinite(amount) ||
                amount < 0
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
                amount > actual
            ) {

                setError(
                    `Owner cannot take more than actual cash of ₹${actual.toFixed(2)}`
                );

                return;

            }


            try {

                setLoading(true);

                const token =
                    getToken();


                const response =
                    await axios.post(
                        `${API_URL}/api/cash-register/owner-take`,
                        {
                            ownerTakenAmount:
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

                    setOwnerTakeSaved(true);

                    setRemainingCash(
                        Number(
                            response.data.remainingCash || 0
                        )
                    );

                    setMessage(
                        "Owner taken amount saved successfully."
                    );

                }

            } catch (err) {

                console.error(
                    "Owner Take Error:",
                    err
                );

                setError(
                    err.response?.data?.message ||
                    "Unable to save owner taken amount."
                );

            } finally {

                setLoading(false);

            }

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
                    SUCCESS MESSAGE
                ================================================== */}

                {message && (

                    <div className="mb-4 bg-green-100 text-green-700 px-4 py-3 rounded-lg">

                        {message}

                    </div>

                )}


                {/* ==================================================
                    ERROR MESSAGE
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
                        className="mt-4 px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold disabled:opacity-50"
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">


                    {/* CASH SALES */}

                    <div className="bg-white rounded-xl shadow p-5">

                        <p className="text-gray-500">
                            Cash Sales
                        </p>

                        <h2 className="text-2xl font-bold mt-2">
                            ₹ {cashSales.toFixed(2)}
                        </h2>

                    </div>


                    {/* ONLINE SALES */}

                    <div className="bg-white rounded-xl shadow p-5">

                        <p className="text-gray-500">
                            Online Sales
                        </p>

                        <h2 className="text-2xl font-bold mt-2">
                            ₹ {onlineSales.toFixed(2)}
                        </h2>

                    </div>


                    {/* REFUNDS */}

                    <div className="bg-white rounded-xl shadow p-5">

                        <p className="text-gray-500">
                            Refunds
                        </p>

                        <h2 className="text-2xl font-bold mt-2">
                            ₹ {refunds.toFixed(2)}
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

                            <span>
                                ₹ {Number(
                                    openingCash || 0
                                ).toFixed(2)}
                            </span>

                        </div>


                        {/* CASH SALES */}

                        <div className="flex justify-between">

                            <span>
                                Cash Sales
                            </span>

                            <span>
                                ₹ {cashSales.toFixed(2)}
                            </span>

                        </div>


                        {/* REFUNDS */}

                        <div className="flex justify-between">

                            <span>
                                Refunds
                            </span>

                            <span>
                                - ₹ {refunds.toFixed(2)}
                            </span>

                        </div>


                        {/* EXPECTED CASH */}

                        <div className="border-t pt-4 flex justify-between text-xl font-bold">

                            <span>
                                Expected Cash
                            </span>

                            <span>
                                ₹ {expectedCash.toFixed(2)}
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


                    {/* ACTUAL CASH */}

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
                        disabled={!registerOpen}
                        className="w-full md:w-80 border rounded-lg px-4 py-3"
                    />


                    {/* CLOSE BUTTON */}

                    <button
                        onClick={
                            handleCloseRegister
                        }
                        disabled={
                            !registerOpen ||
                            loading
                        }
                        className="mt-4 px-6 py-3 rounded-lg bg-red-600 text-white font-semibold disabled:opacity-50"
                    >

                        {loading
                            ? "Processing..."
                            : "Close Register"
                        }

                    </button>


                    {/* DIFFERENCE */}

                    {registerOpen &&
                        actualCash !== "" && (

                        <div className="mt-6 border-t pt-5">

                            <div className="flex justify-between text-xl font-bold">

                                <span>
                                    Difference
                                </span>

                                <span>
                                    ₹ {difference.toFixed(2)}
                                </span>

                            </div>


                            <p className="mt-2 text-gray-500">

                                {difference === 0
                                    ? "Register is perfectly balanced."
                                    : difference < 0
                                    ? `Short by ₹ ${Math.abs(
                                        difference
                                    ).toFixed(2)}`
                                    : `Over by ₹ ${difference.toFixed(
                                        2
                                    )}`
                                }

                            </p>

                        </div>

                    )}


                    {/* ==================================================
                        OWNER TAKES AMOUNT
                    ================================================== */}

                    {!registerOpen &&
                        actualCash !== "" && (

                        <div className="mt-8 border-t pt-6">


                            <h2 className="text-xl font-bold mb-2">
                                💰 Owner Takes Cash
                            </h2>


                            <p className="text-gray-500 mb-5">
                                Enter the amount the owner takes
                                from the cash drawer. Enter ₹0
                                if nothing is taken.
                            </p>


                            {!ownerTakeSaved ? (

                                <>

                                    <label className="block font-semibold mb-2">
                                        Owner Takes Amount
                                    </label>


                                    <input
                                        type="number"
                                        min="0"
                                        max={Number(
                                            actualCash || 0
                                        )}
                                        step="0.01"
                                        value={ownerTakenAmount}
                                        onChange={(e) =>
                                            setOwnerTakenAmount(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter amount owner takes"
                                        className="w-full md:w-80 border rounded-lg px-4 py-3"
                                    />


                                    <button
                                        onClick={
                                            handleOwnerTake
                                        }
                                        disabled={loading}
                                        className="mt-4 px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold disabled:opacity-50"
                                    >

                                        {loading
                                            ? "Saving..."
                                            : "Confirm Owner Amount"
                                        }

                                    </button>

                                </>

                            ) : (

                                <div className="bg-green-50 border border-green-200 rounded-lg p-5">


                                    <div className="flex justify-between mb-3">

                                        <span className="font-semibold">
                                            Owner Took
                                        </span>

                                        <span className="font-bold">
                                            ₹ {Number(
                                                ownerTakenAmount || 0
                                            ).toFixed(2)}
                                        </span>

                                    </div>


                                    <div className="border-t pt-3 flex justify-between text-lg font-bold">

                                        <span>
                                            Remaining Cash
                                        </span>

                                        <span className="text-green-700">
                                            ₹ {Number(
                                                remainingCash || 0
                                            ).toFixed(2)}
                                        </span>

                                    </div>


                                    <p className="text-sm text-gray-500 mt-3">
                                        This amount has been recorded
                                        for this register.
                                    </p>

                                </div>

                            )}

                        </div>

                    )}

                </div>

            </div>

        </div>

    );

};

export default CashRegister;