import React from "react";

const Dashboard = () => {

    return (

        <div className="max-w-7xl mx-auto mt-8">

            <h1 className="text-3xl font-bold text-center mb-8">
                Dashboard
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                <div className="bg-white shadow rounded-lg p-6 text-center">

                    <h2 className="text-gray-500 font-semibold">
                        Today's Sales
                    </h2>

                    <p className="text-3xl font-bold mt-3">
                        ₹0
                    </p>

                </div>

                <div className="bg-white shadow rounded-lg p-6 text-center">

                    <h2 className="text-gray-500 font-semibold">
                        Today's Orders
                    </h2>

                    <p className="text-3xl font-bold mt-3">
                        0
                    </p>

                </div>

                <div className="bg-white shadow rounded-lg p-6 text-center">

                    <h2 className="text-gray-500 font-semibold">
                        Cash Sales
                    </h2>

                    <p className="text-3xl font-bold mt-3">
                        ₹0
                    </p>

                </div>

                <div className="bg-white shadow rounded-lg p-6 text-center">

                    <h2 className="text-gray-500 font-semibold">
                        Online Sales
                    </h2>

                    <p className="text-3xl font-bold mt-3">
                        ₹0
                    </p>

                </div>

            </div>

        </div>

    );

};

export default Dashboard;