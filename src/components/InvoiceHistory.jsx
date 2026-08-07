
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const InvoiceHistory = () => {

    const [search, setSearch] = useState("");
    const navigate = useNavigate();

    const [invoices, setInvoices] = useState([]);

    // Logged-in user
    const user = JSON.parse(sessionStorage.getItem("user"));

    // ===============================
    // Fetch Invoices
    // ===============================
    const fetchInvoices = async () => {

        try {

            const res = await axios.get(
                "https://invoice-backend-78hd.onrender.com/api/invoices"
            );

            if (res.data.success) {
                setInvoices(res.data.invoices);
            }

        } catch (err) {

            console.log(err);

        }

    };

    // ===============================
    // Load Invoices
    // ===============================
    useEffect(() => {

        fetchInvoices();

    }, []);

    // ===============================
    // Delete Invoice - Admin Only
    // ===============================
    const handleDelete = async (id) => {

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this invoice?"
        );

        if (!confirmDelete) return;

        try {

            await axios.delete(
                `https://invoice-backend-78hd.onrender.com/api/invoices/${id}`
            );

            alert("Invoice deleted successfully.");

            fetchInvoices();

        } catch (err) {

            console.log(err);

            alert("Failed to delete invoice.");

        }

    };

    // ===============================
    // Filter Invoices
    // ===============================
const filteredInvoices = invoices.filter((invoice) =>

    String(invoice.invoice_number || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||

    String(invoice.customer_name || "")
        .toLowerCase()
        .includes(search.toLowerCase())

);

    return (

        <div className="max-w-7xl mx-auto mt-8 bg-white shadow-lg rounded-lg p-6">

            {/* Header */}

            <div className="flex justify-between items-center mb-8">

                <h1 className="text-3xl font-bold">
                    Invoice History
                </h1>

            </div>


            {/* Search */}

            <div className="mb-6">

                <input
                    type="text"
                    placeholder="🔍 Search Invoice / Customer..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full md:w-96 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

            </div>


            {/* Invoice Table */}

            <div className="overflow-x-auto">

                <table className="w-full border">

                    <thead className="bg-gray-100">

                        <tr>

                            <th className="border p-2">
                                Invoice
                            </th>

                            <th className="border p-2">
                                Cashier
                            </th>

                            <th className="border p-2">
                                Customer
                            </th>

                            <th className="border p-2">
                                Phone
                            </th>

                            <th className="border p-2">
                                Date
                            </th>

                            <th className="border p-2">
                                Payment
                            </th>

                            <th className="border p-2">
                                Total
                            </th>

                            <th className="border p-2">
                                Action
                            </th>

                        </tr>

                    </thead>


                    <tbody>

                        {filteredInvoices.map((invoice) => (

                            <tr key={invoice.id}>

                                <td className="border p-2 text-center">
                                    {invoice.invoice_number}
                                </td>

                                <td className="border p-2 text-center">
                                    {invoice.cashier_name}
                                </td>

                                <td className="border p-2 text-center">
                                    {invoice.customer_name}
                                </td>

                                <td className="border p-2 text-center">
                                    {invoice.phone_number}
                                </td>

                                <td className="border p-2 text-center">
                                    {new Date(
                                        invoice.invoice_date
                                    ).toLocaleDateString("en-GB")}
                                </td>

                                <td className="border p-2 text-center">
                                    {invoice.payment_Method}
                                </td>

                                <td className="border p-2 text-center">
                                    ₹{Number(invoice.total).toFixed(2)}
                                </td>


                                {/* =============================== */}
                                {/* ACTION */}
                                {/* =============================== */}

                                <td className="border p-2 text-center">

                                    {/* View Invoice - Everyone */}

                                    <button
                                        onClick={() =>
                                            navigate(`/invoice/${invoice.id}`)
                                        }
                                        className="text-blue-600 hover:text-blue-800 font-semibold"
                                        title="View Invoice"
                                    >
                                        👁
                                    </button>


                                    {/* Delete - Admin Only */}

                                    {user?.role === "Admin" && (

                                        <button
                                            onClick={() =>
                                                handleDelete(invoice.id)
                                            }
                                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded ml-2"
                                            title="Delete Invoice"
                                        >
                                            Delete
                                        </button>

                                    )}

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

        </div>

    );

};

export default InvoiceHistory;

