
import React, { useEffect, useState } from "react";
import axios from "axios";

const Customers = () => {

    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    // ==========================================
    // SEARCH STATE
    // ==========================================

    const [searchTerm, setSearchTerm] = useState("");

    // ==========================================
    // FETCH CUSTOMERS
    // ==========================================

    const fetchCustomers = async () => {

        try {

            setLoading(true);

            const res = await axios.get(
                "https://invoice-backend-78hd.onrender.com/api/customers",
                {
                    headers: {
                        Authorization: `Bearer ${sessionStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            );

            if (res.data.success) {

                setCustomers(
                    res.data.customers
                );

            }

        } catch (err) {

            console.error(
                "Customers Error:",
                err
            );

            alert(
                err.response?.data?.message ||
                "Failed to load customers."
            );

        } finally {

            setLoading(false);

        }

    };

    // ==========================================
    // LOAD CUSTOMERS
    // ==========================================

    useEffect(() => {

        fetchCustomers();

    }, []);

    // ==========================================
    // FILTER CUSTOMERS
    // ==========================================

    const filteredCustomers = customers.filter(
        (customer) => {

            const name =
                customer.customer_name
                    ?.toLowerCase() || "";

            const phone =
                customer.phone_number
                    ?.toString() || "";

            const search =
                searchTerm
                    .toLowerCase()
                    .trim();

            return (
                name.includes(search) ||
                phone.includes(search)
            );

        }
    );

    // ==========================================
    // RETURN
    // ==========================================

    return (

        <div className="max-w-7xl mx-auto p-4 md:p-6">

            {/* HEADER */}

            <div className="mb-8">

                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                    Customer Management
                </h1>

                <p className="text-gray-500 mt-1">
                    Manage customers and their purchase history
                </p>

            </div>


            {/* ========================================== */}
            {/* SEARCH */}
            {/* ========================================== */}

            <div className="mb-6">

                <div className="relative max-w-md">

                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">
                        🔍
                    </span>

                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) =>
                            setSearchTerm(
                                e.target.value
                            )
                        }
                        placeholder="Search customer or phone number..."
                        className="w-full border border-gray-300 rounded-lg pl-10 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {/* CLEAR SEARCH */}

                    {searchTerm && (

                        <button
                            onClick={() =>
                                setSearchTerm("")
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 text-lg"
                        >
                            ×
                        </button>

                    )}

                </div>

            </div>


            {/* LOADING */}

            {loading ? (

                <div className="text-center py-10 text-gray-500">
                    Loading customers...
                </div>

            ) : (

                <div className="bg-white rounded-xl shadow-md overflow-hidden">

                    <div className="overflow-x-auto">

                        <table className="w-full border-collapse">

                            <thead className="bg-gray-100">

                                <tr>

                                    <th className="border p-3">
                                        #
                                    </th>

                                    <th className="border p-3">
                                        Customer
                                    </th>

                                    <th className="border p-3">
                                        Phone
                                    </th>

                                    <th className="border p-3">
                                        Loyalty Points
                                    </th>

                                    <th className="border p-3">
                                        Orders
                                    </th>

                                    <th className="border p-3">
                                        Total Spent
                                    </th>

                                    <th className="border p-3">
                                        Last Purchase
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {filteredCustomers.length > 0 ? (

                                    filteredCustomers.map(
                                        (customer, index) => (

                                            <tr
                                                key={customer.id}
                                                className="hover:bg-gray-50"
                                            >

                                                <td className="border p-3 text-center">
                                                    {index + 1}
                                                </td>

                                                <td className="border p-3 font-semibold">
                                                    {
                                                        customer.customer_name
                                                    }
                                                </td>

                                                <td className="border p-3 text-center">
                                                    {
                                                        customer.phone_number
                                                    }
                                                </td>

                                                <td className="border p-3 text-center">
                                                    ⭐{" "}
                                                    {
                                                        customer.loyalty_points
                                                    }
                                                </td>

                                                <td className="border p-3 text-center">
                                                    {
                                                        customer.total_orders
                                                    }
                                                </td>

                                                <td className="border p-3 text-center font-semibold">
                                                    ₹
                                                    {Number(
                                                        customer.total_spent
                                                    ).toFixed(2)}
                                                </td>

                                                <td className="border p-3 text-center">

                                                    {customer.last_purchase
                                                        ? new Date(
                                                            customer.last_purchase
                                                        ).toLocaleDateString(
                                                            "en-IN"
                                                        )
                                                        : "No purchase"}

                                                </td>

                                            </tr>

                                        )
                                    )

                                ) : (

                                    <tr>

                                        <td
                                            colSpan="7"
                                            className="border p-8 text-center text-gray-500"
                                        >
                                            {searchTerm
                                                ? "No customers found."
                                                : "No customers available."}
                                        </td>

                                    </tr>

                                )}

                            </tbody>

                        </table>

                    </div>

                </div>

            )}

        </div>

    );

};

export default Customers;
