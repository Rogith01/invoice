
import React, {
    useEffect,
    useState,
    useCallback,
    useRef,
} from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Toast from "./Toast";

const InvoiceHistory = () => {

    const [search, setSearch] = useState("");

    const navigate = useNavigate();

    const [invoices, setInvoices] = useState([]);

    // ===============================
    // Delete Confirmation
    // ===============================

    const [deleteConfirm, setDeleteConfirm] = useState({
        show: false,
        id: null,
    });

    // ===============================
    // Toast State
    // ===============================

    const [toast, setToast] = useState({
        message: "",
        type: "success",
    });
// ===============================
// Toast Sound
// ===============================

const successSoundRef = useRef(null);
const errorSoundRef = useRef(null);

useEffect(() => {

    successSoundRef.current =
        new Audio("/success-tone.mp3");

    successSoundRef.current.volume = 1.0;

    errorSoundRef.current =
        new Audio("/error-tone.mp3");

    errorSoundRef.current.volume = 1.0;

    return () => {

        successSoundRef.current = null;
        errorSoundRef.current = null;

    };

}, []);
    // ===============================
    // Logged-in User
    // ===============================

    const user = JSON.parse(
        sessionStorage.getItem("user")
    );

// ===============================
// Show Toast
// ===============================

const showToast = (
    message,
    type = "success"
) => {

    // ===============================
    // PLAY TOAST SOUND
    // ===============================

    if (type === "success") {

        if (successSoundRef.current) {

            successSoundRef.current.currentTime = 0;

            successSoundRef.current
                .play()
                .catch((error) => {

                    console.log(
                        "Success sound could not play:",
                        error
                    );

                });

        }

    } else if (
        type === "error" ||
        type === "warning"
    ) {

        if (errorSoundRef.current) {

            errorSoundRef.current.currentTime = 0;

            errorSoundRef.current
                .play()
                .catch((error) => {

                    console.log(
                        "Error sound could not play:",
                        error
                    );

                });

        }

    }

    // ===============================
    // SHOW TOAST
    // ===============================

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
    // Fetch Invoices
    // ===============================

    const fetchInvoices = useCallback(
        async () => {

            try {

                const res = await axios.get(
                    "https://invoice-backend-78hd.onrender.com/api/invoices"
                );

                if (res.data.success) {

                    setInvoices(
                        res.data.invoices || []
                    );

                } else {

                    showToast(
                        res.data.message ||
                            "Failed to load invoice history.",
                        "error"
                    );
                }

            } catch (err) {

                console.log(err);

                showToast(
                    "Failed to load invoice history.",
                    "error"
                );
            }

        },
        []
    );

    // ===============================
    // Load Invoices
    // ===============================

    useEffect(() => {

        fetchInvoices();

    }, [fetchInvoices]);

    // ===============================
    // Open Delete Confirmation
    // ===============================

    const confirmDeleteInvoice = (id) => {

        setDeleteConfirm({
            show: true,
            id: id,
        });
    };

    // ===============================
    // Cancel Delete
    // ===============================

    const cancelDelete = () => {

        setDeleteConfirm({
            show: false,
            id: null,
        });
    };

    // ===============================
    // Delete Invoice
    // ===============================

    const handleDelete = async () => {

        const { id } = deleteConfirm;

        if (!id) {
            return;
        }

        try {

            const token =
                sessionStorage.getItem("token");

            await axios.delete(
                `https://invoice-backend-78hd.onrender.com/api/invoices/${id}`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`,
                    },
                }
            );

            setDeleteConfirm({
                show: false,
                id: null,
            });

            showToast(
                "Invoice deleted successfully.",
                "success"
            );

            await fetchInvoices();

        } catch (err) {

            console.log(err);

            setDeleteConfirm({
                show: false,
                id: null,
            });

            if (
                err.response?.status === 401
            ) {

                showToast(
                    "Please login again.",
                    "warning"
                );

            } else if (
                err.response?.status === 403
            ) {

                showToast(
                    "Only Admin can delete invoices.",
                    "error"
                );

            } else {

                showToast(
                    "Failed to delete invoice.",
                    "error"
                );
            }
        }
    };

    // ===============================
    // Filter Invoices
    // ===============================

    const filteredInvoices =
        invoices.filter((invoice) =>

            String(
                invoice.invoice_number || ""
            )
                .toLowerCase()
                .includes(
                    search.toLowerCase()
                )

            ||

            String(
                invoice.customer_name || ""
            )
                .toLowerCase()
                .includes(
                    search.toLowerCase()
                )
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
            {/* DELETE CONFIRMATION MODAL */}
            {/* =============================== */}

            {deleteConfirm.show && (

                <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">

                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">

                        {/* ICON */}

                        <div className="flex justify-center mb-4">

                            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-red-100">

                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-8 w-8 text-red-600"
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

                            </div>

                        </div>

                        {/* TITLE */}

                        <h2 className="text-xl font-bold text-gray-800 text-center">
                            Delete Invoice?
                        </h2>

                        {/* MESSAGE */}

                        <p className="text-gray-500 text-center mt-2">
                            Are you sure you want to delete this invoice?
                        </p>

                        <p className="text-sm text-red-500 text-center mt-2">
                            This action cannot be undone.
                        </p>

                        {/* BUTTONS */}

                        <div className="flex gap-3 mt-6">

                            {/* CANCEL */}

                            <button
                                type="button"
                                onClick={cancelDelete}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg transition"
                            >
                                Cancel
                            </button>

                            {/* DELETE */}

                            <button
                                type="button"
                                onClick={handleDelete}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg transition"
                            >
                                Delete
                            </button>

                        </div>

                    </div>

                </div>
            )}

            {/* =============================== */}
            {/* MAIN CONTAINER */}
            {/* =============================== */}

            <div className="max-w-7xl mx-auto mt-8 bg-white shadow-lg rounded-lg p-6">

                {/* =============================== */}
                {/* HEADER */}
                {/* =============================== */}

                <div className="flex justify-between items-center mb-8">

                    {/* TITLE */}

                    <h1 className="text-3xl font-bold">
                        Invoice History
                    </h1>

                    {/* =============================== */}
                    {/* REFUND HISTORY BUTTON */}
                    {/* =============================== */}

                    <button
                        type="button"
                        onClick={() =>
                            navigate("/refund-history")
                        }
                        className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm transition duration-200 hover:scale-105"
                    >

                        {/* REFUND ICON */}

                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >

                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 14l-4-4 4-4"
                            />

                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 10h9a5 5 0 015 5v1"
                            />

                        </svg>

                        Refund History

                    </button>

                </div>

                {/* =============================== */}
                {/* SEARCH */}
                {/* =============================== */}

                <div className="mb-6">

                    <input
                        type="text"
                        placeholder="🔍 Search Invoice / Customer..."
                        value={search}
                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }
                        className="w-full md:w-96 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />

                </div>

                {/* =============================== */}
                {/* INVOICE TABLE */}
                {/* =============================== */}

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

                            {filteredInvoices.length > 0 ? (

                                filteredInvoices.map(
                                    (invoice) => (

                                        <tr
                                            key={invoice.id}
                                            className="hover:bg-gray-50"
                                        >

                                            {/* INVOICE */}

                                            <td className="border p-2 text-center">
                                                {
                                                    invoice.invoice_number
                                                }
                                            </td>

                                            {/* CASHIER */}

                                            <td className="border p-2 text-center">
                                                {
                                                    invoice.cashier_name
                                                }
                                            </td>

                                            {/* CUSTOMER */}

                                            <td className="border p-2 text-center">
                                                {
                                                    invoice.customer_name
                                                }
                                            </td>

                                            {/* PHONE */}

                                            <td className="border p-2 text-center">
                                                {
                                                    invoice.phone_number
                                                }
                                            </td>

                                            {/* DATE */}

                                            <td className="border p-2 text-center">

                                                {new Date(
                                                    invoice.invoice_date
                                                ).toLocaleDateString(
                                                    "en-GB"
                                                )}

                                            </td>

                                            {/* PAYMENT */}

                                            <td className="border p-2 text-center">
                                                {
                                                    invoice.payment_Method
                                                }
                                            </td>

                                            {/* TOTAL */}

                                            <td className="border p-2 text-center font-semibold">

                                                ₹
                                                {Number(
                                                    invoice.total
                                                ).toFixed(2)}

                                            </td>

                                            {/* ACTION */}

                                            <td className="border p-2 text-center">

                                                {/* VIEW INVOICE */}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        navigate(
                                                            `/invoice/${invoice.id}`
                                                        )
                                                    }
                                                    className="text-blue-600 hover:text-blue-800 font-semibold transition-transform hover:scale-110"
                                                    title="View Invoice"
                                                    aria-label="View Invoice"
                                                >
                                                    👁
                                                </button>

                                                {/* DELETE - ADMIN ONLY */}

                                                {user?.role ===
                                                    "Admin" && (

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            confirmDeleteInvoice(
                                                                invoice.id
                                                            )
                                                        }
                                                        className="text-red-600 hover:text-red-800 ml-3 text-xl transition-transform hover:scale-110"
                                                        title="Delete Invoice"
                                                        aria-label="Delete Invoice"
                                                    >
                                                        🗑️
                                                    </button>

                                                )}

                                            </td>

                                        </tr>

                                    )

                                )

                            ) : (

                                <tr>

                                    <td
                                        colSpan="8"
                                        className="border p-6 text-center text-gray-500"
                                    >

                                        {search
                                            ? "No invoices found matching your search."
                                            : "No invoices available."
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

export default InvoiceHistory;
