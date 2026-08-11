import React, { useEffect, useState } from "react";
import axios from "axios";

const Reports = () => {

    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // ======================================================
    // SET DEFAULT DATES
    // ======================================================

    useEffect(() => {

        const today = new Date()
            .toISOString()
            .split("T")[0];

        setFromDate(today);
        setToDate(today);

    }, []);

    // ======================================================
    // FETCH REPORT
    // ======================================================

    const generateReport = async () => {

        if (!fromDate || !toDate) {
            setError("Please select both dates.");
            return;
        }

        if (fromDate > toDate) {
            setError(
                "From date cannot be after To date."
            );
            return;
        }

        try {

            setLoading(true);
            setError("");

            const token =
                sessionStorage.getItem("token");

            const res = await axios.get(
                "https://invoice-backend-78hd.onrender.com/api/reports",
                {
                    params: {
                        fromDate,
                        toDate
                    },

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

            if (res.data.success) {

                setReport(
                    res.data.report
                );

            } else {

                setError(
                    res.data.message ||
                    "Failed to generate report."
                );
            }

        } catch (err) {

            console.error(
                "Reports Error:",
                err
            );

            if (
                err.response?.status === 401
            ) {

                setError(
                    "Session expired. Please login again."
                );

            } else {

                setError(
                    err.response?.data?.message ||
                    "Failed to generate report."
                );
            }

        } finally {

            setLoading(false);
        }
    };

    // ======================================================
    // FORMAT MONEY
    // ======================================================

    const money = (value) => {

        return `₹${Number(
            value || 0
        ).toFixed(2)}`;

    };

    return (

        <div className="max-w-7xl mx-auto mt-8 px-4 pb-10">

            {/* ================================================== */}
            {/* HEADER */}
            {/* ================================================== */}

            <div className="mb-6">

                <h1 className="text-3xl font-bold text-gray-800">
                    Reports
                </h1>

                <p className="text-gray-500 mt-1">
                    Analyze sales, refunds, products and cashier performance.
                </p>

            </div>


            {/* ================================================== */}
            {/* DATE FILTER */}
            {/* ================================================== */}

            <div className="bg-white shadow-md rounded-xl p-5 mb-6">

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">

                    {/* FROM DATE */}

                    <div>

                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            From Date
                        </label>

                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) =>
                                setFromDate(
                                    e.target.value
                                )
                            }
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />

                    </div>


                    {/* TO DATE */}

                    <div>

                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            To Date
                        </label>

                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) =>
                                setToDate(
                                    e.target.value
                                )
                            }
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />

                    </div>


                    {/* BUTTON */}

                    <button
                        type="button"
                        onClick={generateReport}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold px-5 py-2.5 rounded-lg transition"
                    >

                        {loading
                            ? "Generating..."
                            : "📊 Generate Report"}

                    </button>

                </div>


                {/* ERROR */}

                {error && (

                    <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>

                )}

            </div>


            {/* ================================================== */}
            {/* REPORT */}
            {/* ================================================== */}

            {report && (

                <>

                    {/* ================================================== */}
                    {/* SALES SUMMARY */}
                    {/* ================================================== */}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

                        {/* SALES */}

                        <div className="bg-white shadow-md rounded-xl p-5 border-l-4 border-indigo-500">

                            <p className="text-sm text-gray-500">
                                Total Sales
                            </p>

                            <p className="text-2xl font-bold text-indigo-600 mt-1">
                                {money(
                                    report.summary?.totalSales
                                )}
                            </p>

                        </div>


                        {/* NET SALES */}

                        <div className="bg-white shadow-md rounded-xl p-5 border-l-4 border-green-500">

                            <p className="text-sm text-gray-500">
                                Net Sales
                            </p>

                            <p className="text-2xl font-bold text-green-600 mt-1">
                                {money(
                                    report.netSales
                                )}
                            </p>

                        </div>


                        {/* REFUNDS */}

                        <div className="bg-white shadow-md rounded-xl p-5 border-l-4 border-red-500">

                            <p className="text-sm text-gray-500">
                                Total Refunds
                            </p>

                            <p className="text-2xl font-bold text-red-600 mt-1">
                                {money(
                                    report.refunds?.totalRefunds
                                )}
                            </p>

                        </div>


                        {/* ORDERS */}

                        <div className="bg-white shadow-md rounded-xl p-5 border-l-4 border-blue-500">

                            <p className="text-sm text-gray-500">
                                Total Orders
                            </p>

                            <p className="text-2xl font-bold text-blue-600 mt-1">
                                {Number(
                                    report.summary?.totalOrders || 0
                                )}
                            </p>

                        </div>

                    </div>


                    {/* ================================================== */}
                    {/* SECONDARY SUMMARY */}
                    {/* ================================================== */}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

                        {/* CASH */}

                        <div className="bg-white shadow-md rounded-xl p-5">

                            <p className="text-sm text-gray-500">
                                Cash Sales
                            </p>

                            <p className="text-xl font-bold text-gray-800 mt-1">
                                {money(
                                    report.summary?.cashSales
                                )}
                            </p>

                        </div>


                        {/* ONLINE */}

                        <div className="bg-white shadow-md rounded-xl p-5">

                            <p className="text-sm text-gray-500">
                                Online Sales
                            </p>

                            <p className="text-xl font-bold text-gray-800 mt-1">
                                {money(
                                    report.summary?.onlineSales
                                )}
                            </p>

                        </div>


                        {/* ITEMS */}

                        <div className="bg-white shadow-md rounded-xl p-5">

                            <p className="text-sm text-gray-500">
                                Items Sold
                            </p>

                            <p className="text-xl font-bold text-gray-800 mt-1">
                                {Number(
                                    report.totalItemsSold || 0
                                )}
                            </p>

                        </div>


                        {/* RETURNED */}

                        <div className="bg-white shadow-md rounded-xl p-5">

                            <p className="text-sm text-gray-500">
                                Items Returned
                            </p>

                            <p className="text-xl font-bold text-gray-800 mt-1">
                                {Number(
                                    report.refunds?.returnedQuantity || 0
                                )}
                            </p>

                        </div>

                    </div>


                    {/* ================================================== */}
                    {/* DAILY SALES */}
                    {/* ================================================== */}

                    <div className="bg-white shadow-md rounded-xl p-6 mb-6">

                        <h2 className="text-xl font-bold text-gray-800 mb-4">
                            📅 Daily Sales
                        </h2>

                        <div className="overflow-x-auto">

                            <table className="w-full border">

                                <thead className="bg-gray-100">

                                    <tr>

                                        <th className="border p-3 text-left">
                                            Date
                                        </th>

                                        <th className="border p-3 text-center">
                                            Orders
                                        </th>

                                        <th className="border p-3 text-right">
                                            Sales
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {report.dailySales?.length > 0 ? (

                                        report.dailySales.map(
                                            (day) => (

                                                <tr
                                                    key={day.saleDate}
                                                    className="hover:bg-gray-50"
                                                >

                                                    <td className="border p-3">
                                                        {new Date(
                                                            day.saleDate
                                                        ).toLocaleDateString(
                                                            "en-GB"
                                                        )}
                                                    </td>

                                                    <td className="border p-3 text-center">
                                                        {day.orders}
                                                    </td>

                                                    <td className="border p-3 text-right font-semibold">
                                                        {money(
                                                            day.sales
                                                        )}
                                                    </td>

                                                </tr>

                                            )
                                        )

                                    ) : (

                                        <tr>

                                            <td
                                                colSpan="3"
                                                className="border p-6 text-center text-gray-500"
                                            >
                                                No sales found for this period.
                                            </td>

                                        </tr>

                                    )}

                                </tbody>

                            </table>

                        </div>

                    </div>


                    {/* ================================================== */}
                    {/* TOP PRODUCTS */}
                    {/* ================================================== */}

                    <div className="bg-white shadow-md rounded-xl p-6 mb-6">

                        <h2 className="text-xl font-bold text-gray-800 mb-4">
                            🏆 Top Selling Products
                        </h2>

                        <div className="overflow-x-auto">

                            <table className="w-full border">

                                <thead className="bg-gray-100">

                                    <tr>

                                        <th className="border p-3 text-left">
                                            #
                                        </th>

                                        <th className="border p-3 text-left">
                                            Product
                                        </th>

                                        <th className="border p-3 text-center">
                                            Quantity Sold
                                        </th>

                                        <th className="border p-3 text-right">
                                            Sales
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {report.products?.length > 0 ? (

                                        report.products.map(
                                            (product, index) => (

                                                <tr
                                                    key={product.productName}
                                                    className="hover:bg-gray-50"
                                                >

                                                    <td className="border p-3">
                                                        {index + 1}
                                                    </td>

                                                    <td className="border p-3 font-semibold">
                                                        {product.productName}
                                                    </td>

                                                    <td className="border p-3 text-center">
                                                        {product.quantitySold}
                                                    </td>

                                                    <td className="border p-3 text-right font-semibold">
                                                        {money(
                                                            product.sales
                                                        )}
                                                    </td>

                                                </tr>

                                            )
                                        )

                                    ) : (

                                        <tr>

                                            <td
                                                colSpan="4"
                                                className="border p-6 text-center text-gray-500"
                                            >
                                                No products sold during this period.
                                            </td>

                                        </tr>

                                    )}

                                </tbody>

                            </table>

                        </div>

                    </div>


                    {/* ================================================== */}
                    {/* CASHIER PERFORMANCE */}
                    {/* ================================================== */}

                    <div className="bg-white shadow-md rounded-xl p-6">

                        <h2 className="text-xl font-bold text-gray-800 mb-4">
                            👨‍💼 Cashier Performance
                        </h2>

                        <div className="overflow-x-auto">

                            <table className="w-full border">

                                <thead className="bg-gray-100">

                                    <tr>

                                        <th className="border p-3 text-left">
                                            Cashier
                                        </th>

                                        <th className="border p-3 text-center">
                                            Orders
                                        </th>

                                        <th className="border p-3 text-right">
                                            Sales
                                        </th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {report.cashiers?.length > 0 ? (

                                        report.cashiers.map(
                                            (cashier) => (

                                                <tr
                                                    key={cashier.cashierName}
                                                    className="hover:bg-gray-50"
                                                >

                                                    <td className="border p-3 font-semibold">
                                                        {cashier.cashierName || "Unknown"}
                                                    </td>

                                                    <td className="border p-3 text-center">
                                                        {cashier.orders}
                                                    </td>

                                                    <td className="border p-3 text-right font-semibold">
                                                        {money(
                                                            cashier.sales
                                                        )}
                                                    </td>

                                                </tr>

                                            )
                                        )

                                    ) : (

                                        <tr>

                                            <td
                                                colSpan="3"
                                                className="border p-6 text-center text-gray-500"
                                            >
                                                No cashier sales found.
                                            </td>

                                        </tr>

                                    )}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </>

            )}

        </div>
    );
};

export default Reports;