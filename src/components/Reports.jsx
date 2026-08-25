import React, {
    useEffect,
    useState
} from "react";

import api from "../api";
import { jsPDF } from "jspdf";


const Reports = () => {

const user = JSON.parse(
    sessionStorage.getItem("user") || "{}"
);

const storeName =
    user?.storeName ||
    user?.store_name ||
    user?.store ||
    user?.name ||
    sessionStorage.getItem("storeName") ||
    sessionStorage.getItem("store_name") ||
    localStorage.getItem("storeName") ||
    localStorage.getItem("store_name") ||
    "Supermarket";

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

            const res = await api.get(
                "/api/reports",
                {
                    params: {
                        fromDate,
                        toDate
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


    // ======================================================
    // FORMAT DATE
    // ======================================================

    const formatDate = (date) => {

        if (!date) {
            return "—";
        }

        return new Date(
            date
        ).toLocaleDateString(
            "en-GB"
        );

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
            storeName,
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
                `${storeName} - Report | Page ${i} of ${pageCount}`,
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
    // SUMMARY CARD
    // ======================================================

    const SummaryCard = ({
        icon,
        title,
        value,
        valueClass = "text-slate-800",
        iconBg = "bg-slate-100",
        iconColor = "text-slate-600"
    }) => {

        return (

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">

                <div className="flex items-start justify-between gap-3">

                    <div>

                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">

                            {title}

                        </p>

                        <p
                            className={`text-xl sm:text-2xl font-bold mt-2 ${valueClass}`}
                        >

                            {value}

                        </p>

                    </div>


                    <div
                        className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}
                    >

                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`w-5 h-5 ${iconColor}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >

                            {icon}

                        </svg>

                    </div>

                </div>

            </div>

        );

    };


    // ======================================================
    // TABLE EMPTY STATE
    // ======================================================

    const EmptyState = ({
        icon,
        message,
        description,
        colSpan
    }) => {

        return (

            <tr>

                <td
                    colSpan={colSpan}
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

                                {icon}

                            </svg>

                        </div>


                        <p className="text-sm font-semibold text-slate-600">

                            {message}

                        </p>


                        <p className="text-xs text-slate-400 mt-1">

                            {description}

                        </p>

                    </div>

                </td>

            </tr>

        );

    };


    // ======================================================
    // RENDER
    // ======================================================

    return (

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

            {/* ==================================================
                PAGE HEADER
            ================================================== */}

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
                                    d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 0h8m-8 0H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4m-6 0v2m0 0h6m-6 0H7"
                                />

                            </svg>

                        </div>


                        <div>

                            <h1 className="text-2xl font-bold text-slate-800">

                                Reports

                            </h1>


                            <p className="text-sm text-slate-500 mt-0.5">

                                Analyze sales, refunds, products and cashier performance

                            </p>

                        </div>

                    </div>

                </div>


                {report && (

                    <div className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm">

                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>

                        <span className="text-sm font-semibold text-slate-700">

                            Report Generated

                        </span>

                    </div>

                )}

            </div>


            {/* ==================================================
                REPORT FILTER CARD
            ================================================== */}

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">

                <div className="px-5 sm:px-6 py-5 border-b border-slate-200">

                    <div className="flex items-center gap-3">

                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">

                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-5 h-5 text-slate-600"
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


                        <div>

                            <h2 className="text-base font-semibold text-slate-800">

                                Report Period

                            </h2>

                            <p className="text-xs text-slate-500 mt-1">

                                Select a date range to generate your sales report

                            </p>

                        </div>

                    </div>

                </div>


                <div className="p-5 sm:p-6 bg-slate-50/70">

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                        {/* FROM DATE */}

                        <div>

                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">

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
                                className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white text-sm text-slate-800 focus:outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition"
                            />

                        </div>


                        {/* TO DATE */}

                        <div>

                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">

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
                                className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white text-sm text-slate-800 focus:outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition"
                            />

                        </div>


                        {/* ACTION */}

                        <div>

                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">

                                Action

                            </label>

                            <button
                                type="button"
                                onClick={generateReport}
                                disabled={loading}
                                className="w-full h-10 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white rounded-lg text-sm font-semibold transition shadow-sm flex items-center justify-center gap-2"
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
                                        d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 0h8m-8 0H5a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4m-6 0v2m0 0h6m-6 0H7"
                                    />

                                </svg>


                                {loading
                                    ? "Generating..."
                                    : "Generate Report"}

                            </button>

                        </div>

                    </div>


                    {/* ERROR */}

                    {error && (

                        <div className="mt-4 flex items-start gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-200">

                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-4 h-4 text-red-600 mt-0.5 shrink-0"
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


                            <p className="text-xs font-medium text-red-700">

                                {error}

                            </p>

                        </div>

                    )}

                </div>

            </div>


            {/* ==================================================
                REPORT CONTENT
            ================================================== */}

            {report && (

                <>

                    {/* ==================================================
                        REPORT ACTION
                    ================================================== */}

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">

                        <div>

                            <h2 className="text-base font-semibold text-slate-800">

                                Sales Report

                            </h2>

                            <p className="text-xs text-slate-500 mt-1">

                                {formatDate(fromDate)}
                                {" "}—{" "}
                                {formatDate(toDate)}

                            </p>

                        </div>


                        <button
                            type="button"
                            onClick={downloadPDF}
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
                                    d="M12 3v12m0 0l4-4m-4 4l-4-4M5 21h14a2 2 0 002-2v-1H3v1a2 2 0 002 2z"
                                />

                            </svg>

                            Download PDF

                        </button>

                    </div>


                    {/* ==================================================
                        PRIMARY SUMMARY
                    ================================================== */}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">

                        <SummaryCard
                            title="Total Sales"
                            value={money(
                                report.summary?.totalSales
                            )}
                            valueClass="text-slate-800"
                            iconBg="bg-emerald-50"
                            iconColor="text-emerald-600"
                            icon={
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm0 0v8m0 0c-1.105 0-2 .895-2 2s.895 2 2 2 2-.895 2-2-.895-2-2-2z"
                                />
                            }
                        />


                        <SummaryCard
                            title="Net Sales"
                            value={money(
                                report.netSales
                            )}
                            valueClass="text-emerald-600"
                            iconBg="bg-emerald-50"
                            iconColor="text-emerald-600"
                            icon={
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                />
                            }
                        />


                        <SummaryCard
                            title="Total Refunds"
                            value={money(
                                report.refunds?.totalRefunds
                            )}
                            valueClass="text-red-600"
                            iconBg="bg-red-50"
                            iconColor="text-red-600"
                            icon={
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 14l6-6m-5.5-4h5A2.5 2.5 0 0117 6.5v11a2.5 2.5 0 01-2.5 2.5h-5A2.5 2.5 0 017 17.5v-11A2.5 2.5 0 019.5 4z"
                                />
                            }
                        />


                        <SummaryCard
                            title="Total Orders"
                            value={Number(
                                report.summary?.totalOrders || 0
                            )}
                            valueClass="text-blue-600"
                            iconBg="bg-blue-50"
                            iconColor="text-blue-600"
                            icon={
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2m-6 0a2 2 0 002 2h4a2 2 0 002-2m-6 0a2 2 0 012-2h2a2 2 0 012 2m-5 6h6m-6 4h6"
                                />
                            }
                        />

                    </div>


                    {/* ==================================================
                        SECONDARY SUMMARY
                    ================================================== */}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">

                        <SummaryCard
                            title="Cash Sales"
                            value={money(
                                report.summary?.cashSales
                            )}
                            iconBg="bg-slate-100"
                            iconColor="text-slate-600"
                            icon={
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h10a2 2 0 002-2v-2m2-4h.01M21 12a2 2 0 100 4 2 2 0 000-4z"
                                />
                            }
                        />


                        <SummaryCard
                            title="Online Sales"
                            value={money(
                                report.summary?.onlineSales
                            )}
                            iconBg="bg-slate-100"
                            iconColor="text-slate-600"
                            icon={
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 7h18M5 7v10a2 2 0 002 2h10a2 2 0 002-2V7M8 11h8m-6 4h4"
                                />
                            }
                        />


                        <SummaryCard
                            title="Items Sold"
                            value={Number(
                                report.totalItemsSold || 0
                            )}
                            iconBg="bg-slate-100"
                            iconColor="text-slate-600"
                            icon={
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M20 7l-8-4-8 4m16 0v10l-8 4-8-4V7m16 0l-8 4m-8-4l8 4m0 0v10"
                                />
                            }
                        />


                        <SummaryCard
                            title="Items Returned"
                            value={Number(
                                report.refunds?.returnedQuantity || 0
                            )}
                            valueClass="text-red-600"
                            iconBg="bg-red-50"
                            iconColor="text-red-600"
                            icon={
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 10h11m0 0l-4-4m4 4l-4 4m7-8h2a2 2 0 012 2v8a2 2 0 01-2 2h-2"
                                />
                            }
                        />

                    </div>


                    {/* ==================================================
                        DAILY SALES
                    ================================================== */}

                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">

                        <div className="px-5 sm:px-6 py-5 border-b border-slate-200">

                            <div className="flex items-center gap-3">

                                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">

                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-5 h-5 text-slate-600"
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


                                <div>

                                    <h2 className="text-base font-semibold text-slate-800">

                                        Daily Sales

                                    </h2>

                                    <p className="text-xs text-slate-500 mt-1">

                                        Sales and order performance by day

                                    </p>

                                </div>

                            </div>

                        </div>


                        <div className="overflow-x-auto">

                            <table className="w-full min-w-[600px]">

                                <thead>

                                    <tr className="bg-slate-50 border-b border-slate-200">

                                        <th className="px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                            Date

                                        </th>

                                        <th className="px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                            Orders

                                        </th>

                                        <th className="px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                            Sales

                                        </th>

                                    </tr>

                                </thead>


                                <tbody className="divide-y divide-slate-100">

                                    {report.dailySales?.length > 0 ? (

                                        report.dailySales.map(
                                            (day) => (

                                                <tr
                                                    key={day.saleDate}
                                                    className="hover:bg-slate-50/80 transition"
                                                >

                                                    {/* ================================
                                                        DATE
                                                    ================================= */}

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
                                                                        d="M8 7V3m8 4V3m-9 8h10M5 5h14a2 2 0 012 2v12a2 2 0 01-2-2V7a2 2 0 012-2z"
                                                                    />

                                                                </svg>

                                                            </div>


                                                            <span className="text-sm font-semibold text-slate-800">

                                                                {formatDate(
                                                                    day.saleDate
                                                                )}

                                                            </span>

                                                        </div>

                                                    </td>


                                                    {/* ================================
                                                        ORDERS
                                                    ================================= */}

                                                    <td className="px-5 py-4 text-center">

                                                        <div className="flex items-center justify-center">

                                                            <span className="inline-flex items-center justify-center min-w-8 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">

                                                                {day.orders}

                                                            </span>

                                                        </div>

                                                    </td>


                                                    {/* ================================
                                                        SALES
                                                    ================================= */}

                                                    <td className="px-5 py-4 text-center">

                                                        <span className="text-sm font-semibold text-slate-800">

                                                            {money(
                                                                day.sales
                                                            )}

                                                        </span>

                                                    </td>

                                                </tr>

                                            )
                                        )

                                    ) : (

                                        <EmptyState
                                            colSpan="3"
                                            message="No sales found for this period."
                                            description="Try selecting a different date range."
                                            icon={
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M3 3v18h18M7 16l4-4 3 3 5-6"
                                                />
                                            }
                                        />

                                    )}

                                </tbody>

                            </table>

                        </div>

                    </div>


                    {/* ==================================================
                        TOP PRODUCTS
                    ================================================== */}

                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">

                        <div className="px-5 sm:px-6 py-5 border-b border-slate-200">

                            <div className="flex items-center gap-3">

                                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">

                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-5 h-5 text-slate-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >

                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                        />

                                    </svg>

                                </div>


                                <div>

                                    <h2 className="text-base font-semibold text-slate-800">

                                        Top Selling Products

                                    </h2>

                                    <p className="text-xs text-slate-500 mt-1">

                                        Products with the highest sales during this period

                                    </p>

                                </div>

                            </div>

                        </div>


                        <div className="overflow-x-auto">

                            <table className="w-full min-w-[700px]">

                                <thead>

                                    <tr className="bg-slate-50 border-b border-slate-200">

                                        <th className="px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                            #

                                        </th>

                                        <th className="px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                            Product

                                        </th>

                                        <th className="px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                            Quantity Sold

                                        </th>

                                        <th className="px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                            Sales

                                        </th>

                                    </tr>

                                </thead>


                                <tbody className="divide-y divide-slate-100">

                                    {report.products?.length > 0 ? (

                                        report.products.map((product, index) => (

                                            <tr
                                                key={product.productName}
                                                className="hover:bg-slate-50/80 transition"
                                            >

                                                {/* NUMBER */}

                                                <td className="px-5 py-4 text-center">

                                                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold">

                                                        {index + 1}

                                                    </span>

                                                </td>


                                                {/* PRODUCT */}

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
                                                                    d="M20 7l-8-4-8 4m16 0v10l-8 4-8-4V7m16 0l-8 4m-8-4l8 4m0 0v10"
                                                                />

                                                            </svg>

                                                        </div>


                                                        <span className="text-sm font-semibold text-slate-800">

                                                            {product.productName}

                                                        </span>

                                                    </div>

                                                </td>


                                                {/* QUANTITY */}

                                                <td className="px-5 py-4 text-center">

                                                    <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-semibold">

                                                        {product.quantitySold}

                                                    </span>

                                                </td>


                                                {/* SALES */}

                                                <td className="px-5 py-4 text-center">

                                                    <span className="text-sm font-semibold text-slate-800">

                                                        {money(product.sales)}

                                                    </span>

                                                </td>

                                            </tr>

                                        ))

                                    ) : (

                                        <EmptyState
                                            colSpan="4"
                                            message="No products sold during this period."
                                            description="Product sales will appear here once available."
                                            icon={
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M20 7l-8-4-8 4m16 0v10l-8 4-8-4V7m16 0l-8 4m-8-4l8 4m0 0v10"
                                                />
                                            }
                                        />

                                    )}

                                </tbody>

                            </table>

                        </div>

                    </div>


                    {/* ==================================================
                        CASHIER PERFORMANCE
                    ================================================== */}

                    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

                        <div className="px-5 sm:px-6 py-5 border-b border-slate-200">

                            <div className="flex items-center gap-3">

                                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">

                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-5 h-5 text-slate-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >

                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                        />

                                    </svg>

                                </div>


                                <div>

                                    <h2 className="text-base font-semibold text-slate-800">

                                        Cashier Performance

                                    </h2>

                                    <p className="text-xs text-slate-500 mt-1">

                                        Sales and order performance by cashier

                                    </p>

                                </div>

                            </div>

                        </div>


                        <div className="overflow-x-auto">

                            <table className="w-full min-w-[600px]">

                                <thead>

                                    <tr className="bg-slate-50 border-b border-slate-200">

                                        <th className="px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                            Cashier

                                        </th>

                                        <th className="px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                            Orders

                                        </th>

                                        <th className="px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                            Sales

                                        </th>

                                    </tr>

                                </thead>


                                <tbody className="divide-y divide-slate-100">

                                    {report.cashiers?.length > 0 ? (

                                        report.cashiers.map((cashier) => (

                                            <tr
                                                key={cashier.cashierName}
                                                className="hover:bg-slate-50/80 transition"
                                            >

                                                {/* CASHIER */}

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
                                                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                                />

                                                            </svg>

                                                        </div>


                                                        <span className="text-sm font-semibold text-slate-800">

                                                            {cashier.cashierName || "Unknown"}

                                                        </span>

                                                    </div>

                                                </td>


                                                {/* ORDERS */}

                                                <td className="px-5 py-4 text-center">

                                                    <div className="flex items-center justify-center">

                                                        <span className="inline-flex items-center justify-center min-w-8 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">

                                                            {cashier.orders}

                                                        </span>

                                                    </div>

                                                </td>


                                                {/* SALES */}

                                                <td className="px-5 py-4 text-center">

                                                    <span className="text-sm font-semibold text-slate-800">

                                                        {money(cashier.sales)}

                                                    </span>

                                                </td>

                                            </tr>

                                        ))

                                    ) : (

                                        <EmptyState
                                            colSpan="3"
                                            message="No cashier sales found."
                                            description="Cashier performance will appear here once sales are available."
                                            icon={
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                                />
                                            }
                                        />

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