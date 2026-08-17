import React, { useEffect, useState } from "react";
import axios from "axios";

const CashRegister = () => {
    const [openingCash, setOpeningCash] = useState("");
    const [actualCash, setActualCash] = useState("");

    const [cashSales, setCashSales] = useState(0);
    const [onlineSales, setOnlineSales] = useState(0);
    const [refunds, setRefunds] = useState(0);
    
useEffect(() => {
    fetchCashRegisterSummary();
}, []);

const fetchCashRegisterSummary = async () => {
    try {
        const token = sessionStorage.getItem("token");

        const response = await axios.get(
            "https://invoice-backend-78hd.onrender.com/api/cash-register/summary",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (response.data.success) {
            const summary = response.data.summary;

            setCashSales(
                Number(summary.cashSales || 0)
            );

            setOnlineSales(
                Number(summary.onlineSales || 0)
            );

            setRefunds(
                Number(summary.refunds || 0)
            );
        }

    } catch (error) {

        console.error(
            "Cash Register Summary Error:",
            error
        );

    }
};
    const expectedCash =
        Number(openingCash || 0) +
        Number(cashSales || 0) -
        Number(refunds || 0);

    const difference =
        Number(actualCash || 0) - expectedCash;

    return (
        <div className="min-h-screen bg-gray-100 p-6">

            <div className="max-w-5xl mx-auto">

                {/* HEADER */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">
                        💰 Cash Register
                    </h1>

                    <p className="text-gray-500 mt-1">
                        Manage daily cash drawer and closing balance
                    </p>
                </div>

                {/* OPENING CASH */}
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
                            setOpeningCash(e.target.value)
                        }
                        placeholder="Enter opening cash"
                        className="w-full md:w-80 border rounded-lg px-4 py-3"
                    />

                </div>

                {/* SALES SUMMARY */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

                    <div className="bg-white rounded-xl shadow p-5">
                        <p className="text-gray-500">
                            Cash Sales
                        </p>

                        <h2 className="text-2xl font-bold mt-2">
                            ₹ {Number(cashSales).toFixed(2)}
                        </h2>
                    </div>

                    <div className="bg-white rounded-xl shadow p-5">
                        <p className="text-gray-500">
                            Online Sales
                        </p>

                        <h2 className="text-2xl font-bold mt-2">
                            ₹ {Number(onlineSales).toFixed(2)}
                        </h2>
                    </div>

                    <div className="bg-white rounded-xl shadow p-5">
                        <p className="text-gray-500">
                            Refunds
                        </p>

                        <h2 className="text-2xl font-bold mt-2">
                            ₹ {Number(refunds).toFixed(2)}
                        </h2>
                    </div>

                </div>

                {/* REGISTER CALCULATION */}
                <div className="bg-white rounded-xl shadow p-6 mb-6">

                    <h2 className="text-xl font-bold mb-5">
                        Register Summary
                    </h2>

                    <div className="space-y-4">

                        <div className="flex justify-between">
                            <span>Opening Cash</span>
                            <span>
                                ₹ {Number(openingCash || 0).toFixed(2)}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span>Cash Sales</span>
                            <span>
                                ₹ {Number(cashSales).toFixed(2)}
                            </span>
                        </div>

                        <div className="flex justify-between">
                            <span>Refunds</span>
                            <span>
                                - ₹ {Number(refunds).toFixed(2)}
                            </span>
                        </div>

                        <div className="border-t pt-4 flex justify-between text-xl font-bold">
                            <span>Expected Cash</span>

                            <span>
                                ₹ {expectedCash.toFixed(2)}
                            </span>
                        </div>

                    </div>

                </div>

                {/* CLOSING CASH */}
                <div className="bg-white rounded-xl shadow p-6">

                    <h2 className="text-xl font-bold mb-4">
                        Closing Cash
                    </h2>

                    <label className="block font-semibold mb-2">
                        Actual Cash Counted
                    </label>

                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={actualCash}
                        onChange={(e) =>
                            setActualCash(e.target.value)
                        }
                        placeholder="Enter actual cash"
                        className="w-full md:w-80 border rounded-lg px-4 py-3"
                    />

                    <div className="mt-6 border-t pt-5">

                        <div className="flex justify-between text-xl font-bold">
                            <span>
                                Difference
                            </span>

                            <span>
                                ₹ {difference.toFixed(2)}
                            </span>
                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
};

export default CashRegister;