
import React, {
    useEffect,
    useState,
    useCallback,
} from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Toast from "./Toast";

const RefundHistory = () => {

    const navigate = useNavigate();

    const [refunds, setRefunds] = useState([]);

    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);

    // ===============================
    // Toast
    // ===============================

    const [toast, setToast] = useState({
        message: "",
        type: "success",
    });

    // ===============================
    // Show Toast
    // ===============================

    const showToast = (
        message,
        type = "success"
    ) => {
        setToast({
            message,
            type,
        });
    };

    // ===============================
    // Hide Toast
    // ===============================

    const hideToast = () => {
        setToast({
            message: "",
            type: "success",
        });
    };

    // ===============================
    // Fetch Refund History
    // ===============================

    const fetchRefundHistory = useCallback(
        async () => {

            try {

                setLoading(true);

                const token =
                    sessionStorage.getItem("token");

                const res = await axios.get(
                    "https://invoice-backend-78hd.onrender.com/api/refund-history",
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );

                if (res.data.success) {

                    setRefunds(
                        res.data.refunds || []
                    );

                } else {

                    showToast(
                        res.data.message ||
                            "Failed to load refund history.",
                        "error"
                    );
                }

            } catch (err) {

                console.log(
                    "Refund History Error:",
                    err
                );

                if (
                    err.response?.status === 401
                ) {

                    showToast(
                        "Please login again.",
                        "warning"
                    );

                } else {

                    showToast(
                        "Failed to load refund history.",
                        "error"
                    );
                }

            } finally {

                setLoading(false);
            }

        },
        []
    );

    // ===============================
    // Load Refund History
    // ===============================

    useEffect(() => {

        fetchRefundHistory();

    }, [fetchRefundHistory]);

    // ===============================
    // Filter Refunds
    // ===============================

    const filteredRefunds =
        refunds.filter((refund) => {

            const searchText =
                search.toLowerCase();

            return (

                String(
                    refund.invoice_number || ""
                )
                    .toLowerCase()
                    .includes(searchText)

                ||

                String(
                    refund.product_name || ""
                )
                    .toLowerCase()
                    .includes(searchText)

                ||

                String(
                    refund.reason || ""
                )
                    .toLowerCase()
                    .includes(searchText)

                ||

                String(
                    refund.returned_by || ""
                )
                    .toLowerCase()
                    .includes(searchText)

            );

        });

    // ===============================
    // Total Refund Amount
    // ===============================

    const totalRefundAmount =
        filteredRefunds.reduce(
            (sum, refund) =>
                sum +
                Number(
                    refund.refund_amount || 0
                ),
            0
        );

    // ===============================
    // Total Returned Quantity
    // ===============================

    const totalReturnedQuantity =
        filteredRefunds.reduce(
            (sum, refund) =>
                sum +
                Number(
                    refund.return_qty || 0
                ),
            0
        );

    // ===============================
    // Render
    // ===============================

    return (
        <>

            {/* =============================== */}
            {/* TOAST */}
            {/* =============================== */}

            <Toast
                message={toast.message}
                type={toast.type}
                onClose={hideToast}
            />

            {/* =============================== */}
            {/* MAIN CONTAINER */}
            {/* =============================== */}

            <div className="max-w-7xl mx-auto mt-8 bg-white shadow-lg rounded-lg p-6">

                {/* =============================== */}
                {/* HEADER */}
                {/* =============================== */}

                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">

                    {/* LEFT */}

                    <div>

                        <h1 className="text-3xl font-bold text-gray-800">
                            Refund History
                        </h1>

                        <p className="text-gray-500 mt-1">
                            View all returned products and refunded amounts.
                        </p>

                    </div>

                    {/* BACK BUTTON */}

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/invoices")
                        }
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-lg transition"
                    >
                        ← Invoice History
                    </button>

                </div>

                {/* =============================== */}
                {/* SUMMARY CARDS */}
                {/* =============================== */}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

                    {/* TOTAL REFUNDS */}

                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">

                        <p className="text-sm text-gray-500">
                            Total Refund Records
                        </p>

                        <p className="text-2xl font-bold text-orange-600 mt-1">
                            {filteredRefunds.length}
                        </p>

                    </div>

                    {/* TOTAL RETURNED QTY */}

                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">

                        <p className="text-sm text-gray-500">
                            Total Items Returned
                        </p>

                        <p className="text-2xl font-bold text-blue-600 mt-1">
                            {totalReturnedQuantity}
                        </p>

                    </div>

                    {/* TOTAL REFUND */}

                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">

                        <p className="text-sm text-gray-500">
                            Total Refunded Amount
                        </p>

                        <p className="text-2xl font-bold text-red-600 mt-1">
                            ₹{totalRefundAmount.toFixed(2)}
                        </p>

                    </div>

                </div>

                {/* =============================== */}
                {/* SEARCH */}
                {/* =============================== */}

                <div className="mb-6">

                    <input
                        type="text"
                        placeholder="🔍 Search Invoice / Product / Reason / Staff..."
                        value={search}
                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }
                        className="w-full md:w-[500px] border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />

                </div>

                {/* =============================== */}
                {/* TABLE */}
                {/* =============================== */}

                <div className="overflow-x-auto">

                    <table className="w-full border">

                        <thead className="bg-gray-100">

                            <tr>

                                <th className="border p-3">
                                    Invoice
                                </th>

                                <th className="border p-3">
                                    Product
                                </th>

                                <th className="border p-3">
                                    Original Qty
                                </th>

                                <th className="border p-3">
                                    Returned Qty
                                </th>

                                <th className="border p-3">
                                    Refund Amount
                                </th>

                                <th className="border p-3">
                                    Reason
                                </th>

                                <th className="border p-3">
                                    Returned By
                                </th>

                                <th className="border p-3">
                                    Date
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {loading ? (

                                <tr>

                                    <td
                                        colSpan="8"
                                        className="border p-8 text-center text-gray-500"
                                    >
                                        Loading refund history...
                                    </td>

                                </tr>

                            ) : filteredRefunds.length > 0 ? (

                                filteredRefunds.map(
                                    (refund) => (

                                        <tr
                                            key={refund.id}
                                            className="hover:bg-gray-50"
                                        >

                                            {/* INVOICE */}

                                            <td className="border p-3 text-center font-semibold text-indigo-600">

                                                {refund.invoice_number}

                                            </td>

                                            {/* PRODUCT */}

                                            <td className="border p-3 text-center">

                                                {refund.product_name}

                                            </td>

                                            {/* ORIGINAL QTY */}

                                            <td className="border p-3 text-center">

                                                {refund.original_qty}

                                            </td>

                                            {/* RETURNED QTY */}

                                            <td className="border p-3 text-center font-semibold text-orange-600">

                                                {refund.return_qty}

                                            </td>

                                            {/* REFUND */}

                                            <td className="border p-3 text-center font-semibold text-red-600">

                                                ₹
                                                {Number(
                                                    refund.refund_amount
                                                ).toFixed(2)}

                                            </td>

                                            {/* REASON */}

                                            <td className="border p-3 text-center">

                                                {refund.reason ||
                                                    "—"}

                                            </td>

                                            {/* RETURNED BY */}

                                            <td className="border p-3 text-center">

                                                {refund.returned_by ||
                                                    "—"}

                                            </td>

                                            {/* DATE */}

                                            <td className="border p-3 text-center">

                                                {refund.created_at
                                                    ? new Date(
                                                        refund.created_at
                                                    ).toLocaleString(
                                                        "en-GB"
                                                    )
                                                    : "—"}

                                            </td>

                                        </tr>

                                    )

                                )

                            ) : (

                                <tr>

                                    <td
                                        colSpan="8"
                                        className="border p-8 text-center text-gray-500"
                                    >

                                        {search
                                            ? "No refund records found matching your search."
                                            : "No refunds available."
                                        }

                                    </td>

                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>

            </div>

        </>
    );
};

export default RefundHistory;
