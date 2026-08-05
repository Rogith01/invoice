import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {

    const navigate = useNavigate();

    const [dashboard, setDashboard] = useState({
        todaySales: 0,
        todayOrders: 0,
        cashSales: 0,
        onlineSales: 0
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

        <div className="max-w-7xl mx-auto p-6">

            <div className="flex justify-between items-center mb-8">

                <h1 className="text-3xl font-bold">
                    Dashboard
                </h1>

                <button
                    onClick={() => navigate("/")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
                >
                    Billing
                </button>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                <div className="bg-white rounded-lg shadow p-6">

                    <p className="text-gray-500">
                        Today's Sales
                    </p>

                    <h2 className="text-3xl font-bold mt-3 text-green-600">
                        ₹{Number(dashboard.todaySales).toFixed(2)}
                    </h2>

                </div>

                <div className="bg-white rounded-lg shadow p-6">

                    <p className="text-gray-500">
                        Today's Orders
                    </p>

                    <h2 className="text-3xl font-bold mt-3 text-blue-600">
                        {dashboard.todayOrders}
                    </h2>

                </div>

                <div className="bg-white rounded-lg shadow p-6">

                    <p className="text-gray-500">
                        Cash Sales
                    </p>

                    <h2 className="text-3xl font-bold mt-3 text-purple-600">
                        ₹{Number(dashboard.cashSales).toFixed(2)}
                    </h2>

                </div>

                <div className="bg-white rounded-lg shadow p-6">

                    <p className="text-gray-500">
                        Online Sales
                    </p>

                    <h2 className="text-3xl font-bold mt-3 text-orange-600">
                        ₹{Number(dashboard.onlineSales).toFixed(2)}
                    </h2>

                </div>

            </div>

        </div>

    );

};

export default Dashboard;