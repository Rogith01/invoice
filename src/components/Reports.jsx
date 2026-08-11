
import React, {
    useEffect,
    useState
} from "react";

import axios from "axios";
import { jsPDF } from "jspdf";

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

            setError(
                "Please select both dates."
            );

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
    return `RS:  ${Number(
        value || 0
    ).toFixed(2)}`;
};


    // ======================================================
    // DOWNLOAD REPORT AS PDF
    // ======================================================

    const downloadPDF = () => {

        if (!report) {

            setError(
                "Please generate the report first."
            );

            return;
        }

        const doc = new jsPDF();

        let y = 20;


        // ==================================================
        // HEADER
        // ==================================================

        doc.setFontSize(20);

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.text(
            "AK SUPER MARKET",
            105,
            y,
            {
                align: "center"
            }
        );

        y += 10;

        doc.setFontSize(15);

        doc.text(
            "Sales Report",
            105,
            y,
            {
                align: "center"
            }
        );

        y += 10;

        doc.setFontSize(10);

        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.text(
            `Report Period: ${fromDate} to ${toDate}`,
            105,
            y,
            {
                align: "center"
            }
        );

        y += 15;


        // ==================================================
        // LINE
        // ==================================================

        doc.line(
            15,
            y,
            195,
            y
        );

        y += 10;


        // ==================================================
        // SALES SUMMARY
        // ==================================================

        doc.setFontSize(14);

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.text(
            "Sales Summary",
            15,
            y
        );

        y += 9;

        doc.setFontSize(11);

        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.text(
            `Total Sales: ${money(
                report.summary?.totalSales
            )}`,
            20,
            y
        );

        y += 7;

        doc.text(
            `Net Sales: ${money(
                report.netSales
            )}`,
            20,
            y
        );

        y += 7;

        doc.text(
            `Total Refunds: ${money(
                report.refunds?.totalRefunds
            )}`,
            20,
            y
        );

        y += 7;

        doc.text(
            `Total Orders: ${Number(
                report.summary?.totalOrders || 0
            )}`,
            20,
            y
        );

        y += 7;

        doc.text(
            `Cash Sales: ${money(
                report.summary?.cashSales
            )}`,
            20,
            y
        );

        y += 7;

        doc.text(
            `Online Sales: ${money(
                report.summary?.onlineSales
            )}`,
            20,
            y
        );

        y += 7;

        doc.text(
            `Items Sold: ${Number(
                report.totalItemsSold || 0
            )}`,
            20,
            y
        );

        y += 7;

        doc.text(
            `Items Returned: ${Number(
                report.refunds?.returnedQuantity || 0
            )}`,
            20,
            y
        );

        y += 12;


        // ==================================================
        // DAILY SALES
        // ==================================================

        doc.setFontSize(14);

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.text(
            "Daily Sales",
            15,
            y
        );

        y += 8;

        doc.setFontSize(10);

        doc.text(
            "Date",
            20,
            y
        );

        doc.text(
            "Orders",
            90,
            y
        );

        doc.text(
            "Sales",
            145,
            y
        );

        y += 6;

        doc.line(
            15,
            y,
            195,
            y
        );

        y += 7;

        if (
            report.dailySales &&
            report.dailySales.length > 0
        ) {

            report.dailySales.forEach(
                (day) => {

                    if (y > 270) {

                        doc.addPage();

                        y = 20;

                        doc.setFontSize(14);

                        doc.setFont(
                            "helvetica",
                            "bold"
                        );

                        doc.text(
                            "Daily Sales - Continued",
                            15,
                            y
                        );

                        y += 10;

                        doc.setFontSize(10);

                    }

                    const date =
                        new Date(
                            day.saleDate
                        ).toLocaleDateString(
                            "en-GB"
                        );

                    doc.setFont(
                        "helvetica",
                        "normal"
                    );

                    doc.text(
                        date,
                        20,
                        y
                    );

                    doc.text(
                        String(
                            day.orders
                        ),
                        90,
                        y
                    );

                    doc.text(
                        money(
                            day.sales
                        ),
                        145,
                        y
                    );

                    y += 7;

                }
            );

        } else {

            doc.text(
                "No sales found for this period.",
                20,
                y
            );

            y += 7;
        }


        y += 8;


        // ==================================================
        // TOP PRODUCTS
        // ==================================================

        if (y > 250) {

            doc.addPage();

            y = 20;
        }

        doc.setFontSize(14);

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.text(
            "Top Selling Products",
            15,
            y
        );

        y += 8;

        doc.setFontSize(10);

        doc.text(
            "#",
            20,
            y
        );

        doc.text(
            "Product",
            35,
            y
        );

        doc.text(
            "Quantity",
            120,
            y
        );

        doc.text(
            "Sales",
            160,
            y
        );

        y += 6;

        doc.line(
            15,
            y,
            195,
            y
        );

        y += 7;

        if (
            report.products &&
            report.products.length > 0
        ) {

            report.products.forEach(
                (product, index) => {

                    if (y > 270) {

                        doc.addPage();

                        y = 20;
                    }

                    doc.setFont(
                        "helvetica",
                        "normal"
                    );

                    doc.text(
                        String(
                            index + 1
                        ),
                        20,
                        y
                    );

                    doc.text(
                        String(
                            product.productName
                        ),
                        35,
                        y
                    );

                    doc.text(
                        String(
                            product.quantitySold
                        ),
                        120,
                        y
                    );

                    doc.text(
                        money(
                            product.sales
                        ),
                        160,
                        y
                    );

                    y += 7;

                }
            );

        } else {

            doc.text(
                "No products sold during this period.",
                20,
                y
            );

            y += 7;
        }


        y += 8;


        // ==================================================
        // CASHIER PERFORMANCE
        // ==================================================

        if (y > 245) {

            doc.addPage();

            y = 20;
        }

        doc.setFontSize(14);

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.text(
            "Cashier Performance",
            15,
            y
        );

        y += 8;

        doc.setFontSize(10);

        doc.text(
            "Cashier",
            20,
            y
        );

        doc.text(
            "Orders",
            110,
            y
        );

        doc.text(
            "Sales",
            155,
            y
        );

        y += 6;

        doc.line(
            15,
            y,
            195,
            y
        );

        y += 7;

        if (
            report.cashiers &&
            report.cashiers.length > 0
        ) {

            report.cashiers.forEach(
                (cashier) => {

                    if (y > 270) {

                        doc.addPage();

                        y = 20;
                    }

                    doc.setFont(
                        "helvetica",
                        "normal"
                    );

                    doc.text(
                        String(
                            cashier.cashierName ||
                            "Unknown"
                        ),
                        20,
                        y
                    );

                    doc.text(
                        String(
                            cashier.orders
                        ),
                        110,
                        y
                    );

                    doc.text(
                        money(
                            cashier.sales
                        ),
                        155,
                        y
                    );

                    y += 7;

                }
            );

        } else {

            doc.text(
                "No cashier sales found.",
                20,
                y
            );

            y += 7;
        }


        // ==================================================
        // FOOTER
        // ==================================================

        const pageCount =
            doc.internal.getNumberOfPages();

        for (
            let i = 1;
            i <= pageCount;
            i++
        ) {

            doc.setPage(i);

            doc.setFontSize(8);

            doc.setFont(
                "helvetica",
                "normal"
            );

            doc.text(
                `AK SUPER MARKET - Report | Page ${i} of ${pageCount}`,
                105,
                290,
                {
                    align: "center"
                }
            );
        }


        // ==================================================
        // DOWNLOAD
        // ==================================================

        doc.save(
            `AK_Super_Market_Report_${fromDate}_to_${toDate}.pdf`
        );
    };


    // ======================================================
    // RENDER
    // ======================================================

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

                    <div className="flex gap-3">

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
                    {/* DOWNLOAD PDF */}
                    {/* ================================================== */}

                    <div className="flex justify-end mb-6">

                        <button
                            type="button"
                            onClick={downloadPDF}
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-lg transition shadow"
                        >
                            📄 Download PDF
                        </button>

                    </div>


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

                                        <th className="border p-3 text-center">
                                            Date
                                        </th>

                                        <th className="border p-3 text-center">
                                            Orders
                                        </th>

                                        <th className="border p-3 text-center">
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

                                                    <td className="border p-3 text-center">
                                                        {new Date(
                                                            day.saleDate
                                                        ).toLocaleDateString(
                                                            "en-GB"
                                                        )}
                                                    </td>

                                                    <td className="border p-3 text-center">
                                                        {day.orders}
                                                    </td>

                                                    <td className="border p-3 text-center font-semibold">
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

                                        <th className="border p-3 text-center">
                                            #
                                        </th>

                                        <th className="border p-3 text-center">
                                            Product
                                        </th>

                                        <th className="border p-3 text-center">
                                            Quantity Sold
                                        </th>

                                        <th className="border p-3 text-center">
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

                                                    <td className="border p-3 text-center">
                                                        {index + 1}
                                                    </td>

                                                    <td className="border p-3 text-center font-semibold">
                                                        {product.productName}
                                                    </td>

                                                    <td className="border p-3 text-center">
                                                        {product.quantitySold}
                                                    </td>

                                                    <td className="border p-3 text-center font-semibold">
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

                                        <th className="border p-3 text-center">
                                            Cashier
                                        </th>

                                        <th className="border p-3 text-center">
                                            Orders
                                        </th>

                                        <th className="border p-3 text-center">
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

                                                    <td className="border p-3 font-semibold text-center">
                                                        {cashier.cashierName || "Unknown"}
                                                    </td>

                                                    <td className="border p-3 text-center">
                                                        {cashier.orders}
                                                    </td>

                                                    <td className="border p-3 text-center font-semibold">
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
