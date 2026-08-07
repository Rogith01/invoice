import React, { useEffect, useState } from "react";
import axios from "axios";

const Dashboard = () => {

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
        monthlyOrders: 0
    });

    useEffect(() => {

        fetchDashboard();

    }, []);

    const fetchDashboard = async () => {

        try {

            const res = await axios.get(
                "https://invoice-backend-78hd.onrender.com/api/dashboard"
            );

            if (res.data.success) {

                setDashboard(res.data.dashboard);

            }

        } catch (err) {

            console.log(err);

        }

    };

    return (

        <div className="max-w-7xl mx-auto p-4 md:p-6">

            {/* ============================= */}
            {/* HEADER */}
            {/* ============================= */}

            <div className="mb-8">

                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                    Dashboard
                </h1>

                <p className="text-gray-500 mt-1">
                    Overview of your supermarket sales and activity
                </p>

            </div>


            {/* ============================= */}
            {/* SALES CARDS */}
            {/* ============================= */}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">


                {/* Total Sales */}

                <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-green-500">

                    <p className="text-gray-500 text-sm">
                        Total Sales
                    </p>

                    <h2 className="text-2xl md:text-3xl font-bold mt-2 text-green-600">
                        ₹{Number(dashboard.totalSales).toFixed(2)}
                    </h2>

                </div>


                {/* Today's Sales */}

                <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-blue-500">

                    <p className="text-gray-500 text-sm">
                        Today's Sales
                    </p>

                    <h2 className="text-2xl md:text-3xl font-bold mt-2 text-blue-600">
                        ₹{Number(dashboard.todaySales).toFixed(2)}
                    </h2>

                </div>


                {/* Today's Orders */}

                <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-orange-500">

                    <p className="text-gray-500 text-sm">
                        Today's Orders
                    </p>

                    <h2 className="text-2xl md:text-3xl font-bold mt-2 text-orange-600">
                        {dashboard.todayOrders}
                    </h2>

                </div>


                {/* Monthly Sales */}

                <div className="bg-white rounded-xl shadow-md p-5 border-l-4 border-purple-500">

                    <p className="text-gray-500 text-sm">
                        This Month's Sales
                    </p>

                    <h2 className="text-2xl md:text-3xl font-bold mt-2 text-purple-600">
                        ₹{Number(dashboard.monthlySales).toFixed(2)}
                    </h2>

                </div>

            </div>


            {/* ============================= */}
            {/* PAYMENT + COUNTS */}
            {/* ============================= */}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">


                {/* Cash Sales */}

                <div className="bg-white rounded-xl shadow-md p-5">

                    <p className="text-gray-500 text-sm">
                        Today's Cash Sales
                    </p>

                    <h2 className="text-2xl font-bold mt-2 text-green-600">
                        ₹{Number(dashboard.cashSales).toFixed(2)}
                    </h2>

                </div>


                {/* Online Sales */}

                <div className="bg-white rounded-xl shadow-md p-5">

                    <p className="text-gray-500 text-sm">
                        Today's Online Sales
                    </p>

                    <h2 className="text-2xl font-bold mt-2 text-pink-600">
                        ₹{Number(dashboard.onlineSales).toFixed(2)}
                    </h2>

                </div>


                {/* Monthly Orders */}

                <div className="bg-white rounded-xl shadow-md p-5">

                    <p className="text-gray-500 text-sm">
                        This Month's Orders
                    </p>

                    <h2 className="text-2xl font-bold mt-2 text-indigo-600">
                        {dashboard.monthlyOrders}
                    </h2>

                </div>


                {/* Total Products */}

                <div className="bg-white rounded-xl shadow-md p-5">

                    <p className="text-gray-500 text-sm">
                        Total Products
                    </p>

                    <h2 className="text-2xl font-bold mt-2 text-yellow-600">
                        {dashboard.totalProducts}
                    </h2>

                </div>

            </div>


            {/* ============================= */}
            {/* CUSTOMER / PRODUCT COUNTS */}
            {/* ============================= */}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5 mt-6">


                {/* Total Customers */}

                <div className="bg-white rounded-xl shadow-md p-5">

                    <p className="text-gray-500 text-sm">
                        Total Customers
                    </p>

                    <h2 className="text-2xl font-bold mt-2 text-cyan-600">
                        {dashboard.totalCustomers}
                    </h2>

                </div>


                {/* Monthly Sales */}

                <div className="bg-white rounded-xl shadow-md p-5">

                    <p className="text-gray-500 text-sm">
                        Monthly Sales
                    </p>

                    <h2 className="text-2xl font-bold mt-2 text-purple-600">
                        ₹{Number(dashboard.monthlySales).toFixed(2)}
                    </h2>

                </div>

            </div>


            {/* ============================= */}
            {/* TOP PERFORMERS */}
            {/* ============================= */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">


                {/* Top Product */}

                <div className="bg-white rounded-xl shadow-md p-6">

                    <div className="flex items-center gap-3 mb-4">

                        <span className="text-3xl">
                            🏆
                        </span>

                        <h2 className="text-xl font-bold text-gray-800">
                            Top Selling Product
                        </h2>

                    </div>

                    {dashboard.topProduct ? (

                        <>
                            <p className="text-lg font-semibold text-indigo-600">
                                {dashboard.topProduct.item_name}
                            </p>

                            <p className="text-gray-500 mt-1">
                                {dashboard.topProduct.total_quantity_sold} units sold
                            </p>
                        </>

                    ) : (

                        <p className="text-gray-400">
                            No sales yet
                        </p>

                    )}

                </div>


                {/* Top Customer */}

                <div className="bg-white rounded-xl shadow-md p-6">

                    <div className="flex items-center gap-3 mb-4">

                        <span className="text-3xl">
                            👤
                        </span>

                        <h2 className="text-xl font-bold text-gray-800">
                            Top Customer
                        </h2>

                    </div>

                    {dashboard.topCustomer ? (

                        <>
                            <p className="text-lg font-semibold text-blue-600">
                                {dashboard.topCustomer.customer_name}
                            </p>

                            <p className="text-gray-500 mt-1">
                                {dashboard.topCustomer.total_orders} orders
                            </p>

                            <p className="text-green-600 font-semibold mt-1">
                                ₹{Number(
                                    dashboard.topCustomer.total_spent
                                ).toFixed(2)} spent
                            </p>
                        </>

                    ) : (

                        <p className="text-gray-400">
                            No customer data yet
                        </p>

                    )}

                </div>


                {/* Top Cashier */}

                <div className="bg-white rounded-xl shadow-md p-6">

                    <div className="flex items-center gap-3 mb-4">

                        <span className="text-3xl">
                            👨‍💼
                        </span>

                        <h2 className="text-xl font-bold text-gray-800">
                            Top Cashier
                        </h2>

                    </div>

                    {dashboard.topCashier ? (

                        <>
                            <p className="text-lg font-semibold text-orange-600">
                                {dashboard.topCashier.cashier_name}
                            </p>

                            <p className="text-gray-500 mt-1">
                                {dashboard.topCashier.total_orders} orders
                            </p>

                            <p className="text-green-600 font-semibold mt-1">
                                ₹{Number(
                                    dashboard.topCashier.total_sales
                                ).toFixed(2)} sales
                            </p>
                        </>

                    ) : (

                        <p className="text-gray-400">
                            No cashier data yet
                        </p>

                    )}

                </div>

            </div>

        </div>

    );

};

export default Dashboard;
