import React, {
    useEffect,
    useState,
} from "react";

import axios from "axios";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from "recharts";


const API_URL =
    "https://invoice-backend-78hd.onrender.com";


const Dashboard = () => {

    // ==========================================
    // DASHBOARD STATE
    // ==========================================

    const [dashboard, setDashboard] = useState({

        totalSales: 0,

        todaySales: 0,
        todayOrders: 0,

        cashSales: 0,
        onlineSales: 0,

        topProduct: null,
        topCustomer: null,
        topCashier: null,

        totalProducts: 0,
        totalCustomers: 0,

        monthlySales: 0,
        monthlyOrders: 0,

    });


    // ==========================================
    // DAILY SALES / ORDERS
    // ==========================================

    const [dailySales, setDailySales] =
        useState([]);


    // ==========================================
    // REFRESH STATE
    // ==========================================

    const [refreshing, setRefreshing] =
        useState(false);


    // ==========================================
    // FETCH DASHBOARD
    // ==========================================

    const fetchDashboard = async () => {

        try {

            const res =
                await axios.get(
                    `${API_URL}/api/dashboard`
                );


            if (
                res.data.success
            ) {

                setDashboard(
                    res.data.dashboard
                );

            }

        }

        catch (err) {

            console.log(
                "Dashboard Error:",
                err
            );

        }

    };


    // ==========================================
    // FETCH DAILY SALES
    // ==========================================

    const fetchDailySales = async () => {

        try {

            const res =
                await axios.get(
                    `${API_URL}/api/dashboard/daily-sales`
                );


            if (
                res.data.success
            ) {

                const formattedData =
                    res.data.dailySales.map(
                        (item) => {

                            return {

                                date:
                                    new Date(
                                        item.saleDate
                                    ).toLocaleDateString(
                                        "en-GB",
                                        {
                                            day: "2-digit",
                                            month: "short",
                                        }
                                    ),

                                sales:
                                    Number(
                                        item.sales
                                    ),

                                orders:
                                    Number(
                                        item.orders
                                    ),

                            };

                        }
                    );


                setDailySales(
                    formattedData
                );

            }

        }

        catch (err) {

            console.log(
                "Daily Sales Error:",
                err
            );

        }

    };


    // ==========================================
    // LOAD DASHBOARD
    // ==========================================

    useEffect(() => {

        fetchDashboard();

        fetchDailySales();

    }, []);


    // ==========================================
    // FORMAT MONEY
    // ==========================================

    const formatMoney = (
        value
    ) => {

        return `₹${Number(
            value || 0
        ).toFixed(2)}`;

    };


    // ==========================================
    // REFRESH DASHBOARD
    // ==========================================

    const refreshDashboard = async () => {

        if (
            refreshing
        ) {

            return;

        }


        setRefreshing(true);


        try {

            await Promise.all([
                fetchDashboard(),
                fetchDailySales(),
            ]);

        }

        finally {

            setTimeout(() => {

                setRefreshing(false);

            }, 500);

        }

    };


    // ==========================================
    // AVERAGE ORDER VALUE
    // ==========================================

    const averageOrderValue =
        dashboard.todayOrders > 0

            ? Number(
                dashboard.todaySales
            ) /
            Number(
                dashboard.todayOrders
            )

            : 0;


    // ==========================================
    // STAT CARD
    // ==========================================

    const StatCard = ({
        label,
        value,
        description,
        icon,
    }) => {

        return (

            <div className="border border-slate-200 rounded-xl p-5 bg-white hover:shadow-md transition">

                <div className="flex items-start justify-between gap-3">

                    <div>

                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">

                            {label}

                        </p>


                        <h3 className="text-2xl font-bold text-slate-800 mt-2">

                            {value}

                        </h3>


                        <p className="text-xs text-slate-400 mt-2">

                            {description}

                        </p>

                    </div>


                    {icon && (

                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">

                            {icon}

                        </div>

                    )}

                </div>

            </div>

        );

    };


    // ==========================================
    // SECTION HEADER
    // ==========================================

    const SectionHeader = ({
        title,
        description,
    }) => {

        return (

            <div className="mb-5">

                <h2 className="text-base font-semibold text-slate-800">

                    {title}

                </h2>


                <p className="text-xs text-slate-500 mt-1">

                    {description}

                </p>

            </div>

        );

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


                {/* TITLE */}

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
                                    d="M3 13h4v8H3v-8zm7-9h4v17h-4V4zm7 5h4v12h-4V9z"
                                />

                            </svg>

                        </div>


                        <div>

                            <h1 className="text-2xl font-bold text-slate-800">

                                Dashboard

                            </h1>


                            <p className="text-sm text-slate-500 mt-0.5">

                                Overview of your supermarket sales and activity

                            </p>

                        </div>

                    </div>

                </div>


                {/* REFRESH */}

                <button
                    type="button"
                    onClick={refreshDashboard}
                    disabled={refreshing}
                    className="inline-flex items-center justify-center gap-2 self-start sm:self-auto h-10 px-4 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-500 text-white rounded-lg text-sm font-semibold transition shadow-sm"
                >

                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`w-4 h-4 ${
                            refreshing
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
                            d="M4 4v5h5M20 20v-5h-5M5.5 9A7 7 0 0118.5 6.5M18.5 15A7 7 0 015.5 17.5"
                        />

                    </svg>


                    {refreshing
                        ? "Refreshing..."
                        : "Refresh"}

                </button>

            </div>


            {/* ==========================================
                MAIN CARD
            ========================================== */}

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">


                {/* ==========================================
                    DASHBOARD CONTENT
                ========================================== */}

                <div className="p-5 sm:p-6">


                    {/* ==========================================
                        1. SALES OVERVIEW
                    ========================================== */}

                    <div className="mb-8">

                        <SectionHeader
                            title="Sales Overview"
                            description="Current sales and order performance."
                        />


                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">


                            <StatCard
                                label="Total Sales"
                                value={formatMoney(
                                    dashboard.totalSales
                                )}
                                description="All-time sales"
                                icon={
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
                                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />

                                    </svg>
                                }
                            />


                            <StatCard
                                label="Today's Sales"
                                value={formatMoney(
                                    dashboard.todaySales
                                )}
                                description="Sales generated today"
                                icon={
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
                                            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                        />

                                    </svg>
                                }
                            />


                            <StatCard
                                label="Today's Orders"
                                value={
                                    dashboard.todayOrders
                                }
                                description="Invoices created today"
                                icon={
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
                                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a3 3 0 006 0M9 5h6"
                                        />

                                    </svg>
                                }
                            />


                            <StatCard
                                label="This Month's Sales"
                                value={formatMoney(
                                    dashboard.monthlySales
                                )}
                                description="Current month"
                                icon={
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
                                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                        />

                                    </svg>
                                }
                            />

                        </div>

                    </div>


                    {/* ==========================================
                        2. BUSINESS SUMMARY
                    ========================================== */}

                    <div className="mb-8">

                        <SectionHeader
                            title="Business Summary"
                            description="Payment methods, products and business activity."
                        />


                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">


                            <StatCard
                                label="Today's Cash Sales"
                                value={formatMoney(
                                    dashboard.cashSales
                                )}
                                description="Cash payments today"
                                icon={
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
                                            d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2m4-4h-6m6 0l-2-2m2 2l-2 2"
                                        />

                                    </svg>
                                }
                            />


                            <StatCard
                                label="Today's Online Sales"
                                value={formatMoney(
                                    dashboard.onlineSales
                                )}
                                description="Online payments today"
                                icon={
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
                                            d="M3 10h18M7 15h1m3 0h2m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                        />

                                    </svg>
                                }
                            />


                            <StatCard
                                label="This Month's Orders"
                                value={
                                    dashboard.monthlyOrders
                                }
                                description="Orders this month"
                                icon={
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
                                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a3 3 0 006 0M9 5h6"
                                        />

                                    </svg>
                                }
                            />


                            <StatCard
                                label="Total Products"
                                value={
                                    dashboard.totalProducts
                                }
                                description="Products in inventory"
                                icon={
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
                                }
                            />

                        </div>

                    </div>


                    {/* ==========================================
                        3. CUSTOMER OVERVIEW
                    ========================================== */}

                    <div className="mb-8">

                        <SectionHeader
                            title="Customer Overview"
                            description="Customer activity and average transaction value."
                        />


                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">


                            <StatCard
                                label="Total Customers"
                                value={
                                    dashboard.totalCustomers
                                }
                                description="Registered customers"
                                icon={
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
                                            d="M17 20h5v-1a4 4 0 00-4-4h-1m-4 5H6a4 4 0 01-4-4v-1a4 4 0 014-4h8a4 4 0 014 4v1a4 4 0 01-4 4zM8 7a4 4 0 100-8 4 4 0 000 8zm8 0a3 3 0 100-6 3 3 0 000 6z"
                                        />

                                    </svg>
                                }
                            />


                            <StatCard
                                label="Average Order Value"
                                value={
                                    `₹${averageOrderValue.toFixed(2)}`
                                }
                                description="Based on today's orders"
                                icon={
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
                                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                        />

                                    </svg>
                                }
                            />

                        </div>

                    </div>


                    {/* ==========================================
                        4. TOP PERFORMERS
                    ========================================== */}

                    <div className="mb-8">

                        <SectionHeader
                            title="Top Performers"
                            description="Best performing products, customers and cashiers."
                        />


                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">


                            {/* TOP PRODUCT */}

                            <div className="border border-slate-200 rounded-xl p-5 bg-white hover:shadow-md transition">

                                <div className="flex items-center gap-3 mb-5">

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
                                                d="M8 21h8M12 17v4M7 4h10l1 4a6 6 0 01-12 0l1-4zM5 4h14"
                                            />

                                        </svg>

                                    </div>


                                    <div>

                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">

                                            Top Selling Product

                                        </p>

                                    </div>

                                </div>


                                {dashboard.topProduct ? (

                                    <>

                                        <p className="text-base font-semibold text-slate-800">

                                            {
                                                dashboard
                                                    .topProduct
                                                    .item_name
                                            }

                                        </p>


                                        <p className="text-xs text-slate-500 mt-2">

                                            {
                                                dashboard
                                                    .topProduct
                                                    .total_quantity_sold
                                            }{" "}

                                            units sold

                                        </p>

                                    </>

                                ) : (

                                    <div className="py-2">

                                        <p className="text-sm text-slate-400">

                                            No sales data yet.

                                        </p>

                                    </div>

                                )}

                            </div>


                            {/* TOP CUSTOMER */}

                            <div className="border border-slate-200 rounded-xl p-5 bg-white hover:shadow-md transition">

                                <div className="flex items-center gap-3 mb-5">

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
                                                d="M15 19a3 3 0 00-6 0m9-8a3 3 0 11-6 0 3 3 0 016 0zm-9 0a3 3 0 11-6 0 3 3 0 016 0zm12 8a3 3 0 00-3-3m-9 3a3 3 0 00-3-3"
                                            />

                                        </svg>

                                    </div>


                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">

                                        Top Customer

                                    </p>

                                </div>


                                {dashboard.topCustomer ? (

                                    <>

                                        <p className="text-base font-semibold text-slate-800">

                                            {
                                                dashboard
                                                    .topCustomer
                                                    .customer_name
                                            }

                                        </p>


                                        <p className="text-xs text-slate-500 mt-2">

                                            {
                                                dashboard
                                                    .topCustomer
                                                    .total_orders
                                            }{" "}

                                            orders

                                        </p>


                                        <p className="text-sm font-semibold text-slate-700 mt-1">

                                            {formatMoney(
                                                dashboard
                                                    .topCustomer
                                                    .total_spent
                                            )}

                                            {" "}spent

                                        </p>

                                    </>

                                ) : (

                                    <div className="py-2">

                                        <p className="text-sm text-slate-400">

                                            No customer data yet.

                                        </p>

                                    </div>

                                )}

                            </div>


                            {/* TOP CASHIER */}

                            <div className="border border-slate-200 rounded-xl p-5 bg-white hover:shadow-md transition">

                                <div className="flex items-center gap-3 mb-5">

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
                                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM4 21a8 8 0 0116 0"
                                            />

                                        </svg>

                                    </div>


                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">

                                        Top Cashier

                                    </p>

                                </div>


                                {dashboard.topCashier ? (

                                    <>

                                        <p className="text-base font-semibold text-slate-800">

                                            {
                                                dashboard
                                                    .topCashier
                                                    .cashier_name
                                            }

                                        </p>


                                        <p className="text-xs text-slate-500 mt-2">

                                            {
                                                dashboard
                                                    .topCashier
                                                    .total_orders
                                            }{" "}

                                            orders

                                        </p>


                                        <p className="text-sm font-semibold text-slate-700 mt-1">

                                            {formatMoney(
                                                dashboard
                                                    .topCashier
                                                    .total_sales
                                            )}

                                            {" "}sales

                                        </p>

                                    </>

                                ) : (

                                    <div className="py-2">

                                        <p className="text-sm text-slate-400">

                                            No cashier data yet.

                                        </p>

                                    </div>

                                )}

                            </div>

                        </div>

                    </div>


                    {/* ==========================================
                        5. DAILY SALES
                    ========================================== */}

                    <div className="border border-slate-200 rounded-xl p-5 sm:p-6 mb-8 bg-white">


                        <SectionHeader
                            title="Daily Sales"
                            description="Sales performance by day."
                        />


                        {dailySales.length > 0 ? (

                            <div className="w-full h-80">

                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >

                                    <LineChart
                                        data={dailySales}
                                        margin={{
                                            top: 10,
                                            right: 20,
                                            left: 0,
                                            bottom: 10,
                                        }}
                                    >

                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#e2e8f0"
                                        />


                                        <XAxis
                                            dataKey="date"
                                            tick={{
                                                fill: "#64748b",
                                                fontSize: 11,
                                            }}
                                            axisLine={{
                                                stroke: "#cbd5e1",
                                            }}
                                            tickLine={{
                                                stroke: "#cbd5e1",
                                            }}
                                        />


                                        <YAxis
                                            tick={{
                                                fill: "#64748b",
                                                fontSize: 11,
                                            }}
                                            axisLine={{
                                                stroke: "#cbd5e1",
                                            }}
                                            tickLine={{
                                                stroke: "#cbd5e1",
                                            }}
                                        />


                                        <Tooltip
                                            contentStyle={{
                                                borderRadius:
                                                    "10px",
                                                border:
                                                    "1px solid #e2e8f0",
                                                boxShadow:
                                                    "0 4px 12px rgba(15,23,42,0.08)",
                                                fontSize:
                                                    "12px",
                                            }}
                                            formatter={(
                                                value
                                            ) => [

                                                `₹${Number(
                                                    value
                                                ).toFixed(2)}`,

                                                "Sales",

                                            ]}
                                        />


                                        <Line
                                            type="monotone"
                                            dataKey="sales"
                                            stroke="#334155"
                                            strokeWidth={2.5}
                                            dot={{
                                                r: 3,
                                                fill: "#334155",
                                            }}
                                            activeDot={{
                                                r: 6,
                                            }}
                                        />

                                    </LineChart>

                                </ResponsiveContainer>

                            </div>

                        ) : (

                            <div className="border border-slate-200 rounded-xl bg-slate-50 py-16 text-center">

                                <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 flex items-center justify-center mb-3">

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
                                            d="M3 3v18h18M7 15l3-3 3 2 5-6"
                                        />

                                    </svg>

                                </div>


                                <p className="text-sm font-semibold text-slate-600">

                                    No sales data available.

                                </p>


                                <p className="text-xs text-slate-400 mt-1">

                                    Sales information will appear here.

                                </p>

                            </div>

                        )}

                    </div>


                    {/* ==========================================
                        6. DAILY ORDERS
                    ========================================== */}

                    <div className="border border-slate-200 rounded-xl p-5 sm:p-6 bg-white">


                        <SectionHeader
                            title="Daily Orders"
                            description="Number of invoices created each day."
                        />


                        {dailySales.length > 0 ? (

                            <div className="w-full h-80">

                                <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                >

                                    <BarChart
                                        data={dailySales}
                                        margin={{
                                            top: 10,
                                            right: 20,
                                            left: 0,
                                            bottom: 10,
                                        }}
                                    >

                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#e2e8f0"
                                        />


                                        <XAxis
                                            dataKey="date"
                                            tick={{
                                                fill: "#64748b",
                                                fontSize: 11,
                                            }}
                                            axisLine={{
                                                stroke: "#cbd5e1",
                                            }}
                                            tickLine={{
                                                stroke: "#cbd5e1",
                                            }}
                                        />


                                        <YAxis
                                            allowDecimals={false}
                                            tick={{
                                                fill: "#64748b",
                                                fontSize: 11,
                                            }}
                                            axisLine={{
                                                stroke: "#cbd5e1",
                                            }}
                                            tickLine={{
                                                stroke: "#cbd5e1",
                                            }}
                                        />


                                        <Tooltip
                                            contentStyle={{
                                                borderRadius:
                                                    "10px",
                                                border:
                                                    "1px solid #e2e8f0",
                                                boxShadow:
                                                    "0 4px 12px rgba(15,23,42,0.08)",
                                                fontSize:
                                                    "12px",
                                            }}
                                            formatter={(
                                                value
                                            ) => [

                                                value,

                                                "Orders",

                                            ]}
                                        />


                                        <Bar
                                            dataKey="orders"
                                            fill="#334155"
                                            radius={[
                                                5,
                                                5,
                                                0,
                                                0,
                                            ]}
                                        />

                                    </BarChart>

                                </ResponsiveContainer>

                            </div>

                        ) : (

                            <div className="border border-slate-200 rounded-xl bg-slate-50 py-16 text-center">

                                <div className="w-12 h-12 mx-auto rounded-xl bg-slate-100 flex items-center justify-center mb-3">

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
                                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a3 3 0 006 0M9 5h6"
                                        />

                                    </svg>

                                </div>


                                <p className="text-sm font-semibold text-slate-600">

                                    No order data available.

                                </p>


                                <p className="text-xs text-slate-400 mt-1">

                                    Order information will appear here.

                                </p>

                            </div>

                        )}

                    </div>

                </div>

            </div>

        </div>

    );

};


export default Dashboard;