import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const InvoiceHistory = () => {

    const navigate = useNavigate();

    const [invoices, setInvoices] = useState([]);

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

    useEffect(() => {

        fetchInvoices();

    }, []);

    return (

        <div className="max-w-7xl mx-auto mt-8 bg-white shadow-lg rounded-lg p-6">

            <div className="flex justify-between items-center mb-8">

                <h1 className="text-3xl font-bold">
                    Invoice History
                </h1>

                <button
                    onClick={() => navigate("/")}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 rounded-lg"
                >
                    🧾 Billing
                </button>

            </div>

            <table className="w-full border">

                <thead className="bg-gray-100">

                    <tr>

                        <th className="border p-2">Invoice</th>

                        <th className="border p-2">Customer</th>

                        <th className="border p-2">Cashier</th>

                        <th className="border p-2">Date</th>

                        <th className="border p-2">Payment</th>

                        <th className="border p-2">Total</th>

                    </tr>

                </thead>

                <tbody>

                    {invoices.map((invoice) => (

                        <tr key={invoice.id}>

                            <td className="border p-2 text-center">
                                {invoice.invoice_number}
                            </td>

                            <td className="border p-2 text-center">
                                {invoice.customer_name}
                            </td>

                            <td className="border p-2 text-center">
                                {invoice.cashier_name}
                            </td>

                            <td className="border p-2 text-center">
                                {new Date(invoice.invoice_date).toLocaleDateString("en-GB")}
                            </td>

                            <td className="border p-2 text-center">
                                {invoice.payment_Method}
                            </td>

                            <td className="border p-2 text-center">
                                ₹{Number(invoice.total).toFixed(2)}
                            </td>

                        </tr>

                    ))}

                </tbody>

            </table>

        </div>

    );

};

export default InvoiceHistory;