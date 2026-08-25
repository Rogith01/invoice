
import React, {
    useEffect,
    useRef,
    useState,
    useCallback
} from "react";

import {
    useNavigate,
    useParams
} from "react-router-dom";

import { useReactToPrint } from "react-to-print";

import Toast from "./Toast";

import api from "../api";


// ======================================================
// INVOICE DETAILS
// ======================================================

const InvoiceDetails = () => {

    const navigate = useNavigate();

    const { id } = useParams();

const store = JSON.parse(
    sessionStorage.getItem("store")
);



    const [invoice, setInvoice] = useState(null);

    const [items, setItems] = useState([]);

    const printRef = useRef();


    // ======================================================
    // RETURN MODAL STATE
    // ======================================================

    const [returnModal, setReturnModal] = useState({
        show: false,
        item: null
    });

    const [returnQty, setReturnQty] = useState("");

    const [returnReason, setReturnReason] = useState(
        "Customer Return"
    );

    const [returnLoading, setReturnLoading] = useState(false);


    // ======================================================
    // TOAST STATE
    // ======================================================

    const [toast, setToast] = useState({
        message: "",
        type: "success"
    });


    // ======================================================
    // TOAST SOUND
    // ======================================================

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


    // ======================================================
    // SHOW TOAST
    // ======================================================

    const showToast = (
        message,
        type = "success"
    ) => {

        // ==================================================
        // SUCCESS SOUND
        // ==================================================

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

        }

        // ==================================================
        // ERROR / WARNING SOUND
        // ==================================================

        else if (
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


        // ==================================================
        // SET TOAST
        // ==================================================

        setToast({
            message,
            type
        });

    };


    // ======================================================
    // HIDE TOAST
    // ======================================================

    const hideToast = () => {

        setToast({
            message: "",
            type: "success"
        });

    };


    // ======================================================
    // FETCH INVOICE
    // ======================================================

    const fetchInvoice = useCallback(async () => {

        try {

            // ==================================================
            // CENTRALIZED API
            // JWT TOKEN IS AUTOMATICALLY ATTACHED
            // BY api.js INTERCEPTOR
            // ==================================================

            const res = await api.get(
                `/api/invoices/${id}`
            );


            // ==================================================
            // SUCCESS
            // ==================================================

            if (res.data.success) {

                setInvoice(
                    res.data.invoice
                );

                setItems(
                    res.data.items || []
                );

            }

            // ==================================================
            // FAILED
            // ==================================================

            else {

                showToast(
                    "Invoice not found.",
                    "error"
                );

            }

        }

        // ==================================================
        // ERROR
        // ==================================================

        catch (err) {

            console.log(
                "Fetch Invoice Error:",
                err
            );


            if (
                err.response?.status === 401
            ) {

                showToast(
                    "Please login again.",
                    "warning"
                );

            }

            else if (
                err.response?.status === 403
            ) {

                showToast(
                    "You are not authorized to view this invoice.",
                    "error"
                );

            }

            else {

                showToast(
                    "Failed to load invoice.",
                    "error"
                );

            }

        }

    }, [id]);


    // ======================================================
    // LOAD INVOICE
    // ======================================================

    useEffect(() => {

        fetchInvoice();

    }, [fetchInvoice]);


    // ======================================================
    // PRINT
    // ======================================================

    const printInvoiceHandler = useReactToPrint({

        contentRef: printRef,

        documentTitle:
            invoice?.invoice_number ||
            "Invoice"

    });


    // ======================================================
    // OPEN RETURN MODAL
    // ======================================================

    const openReturnModal = (item) => {

        // ==================================================
        // FULLY RETURNED
        // ==================================================

        if (
            Number(item.remaining_qty) <= 0
        ) {

            showToast(
                "This product has already been fully returned.",
                "warning"
            );

            return;

        }


        // ==================================================
        // OPEN MODAL
        // ==================================================

        setReturnModal({
            show: true,
            item: item
        });


        setReturnQty("");


        setReturnReason(
            "Customer Return"
        );

    };


    // ======================================================
    // CLOSE RETURN MODAL
    // ======================================================

    const closeReturnModal = () => {

        if (returnLoading) {

            return;

        }


        setReturnModal({
            show: false,
            item: null
        });


        setReturnQty("");


        setReturnReason(
            "Customer Return"
        );

    };


    // ======================================================
    // RETURN QUANTITY CHANGE
    // ======================================================

    const handleReturnQtyChange = (e) => {

        const value = e.target.value;


        // ==================================================
        // EMPTY
        // ==================================================

        if (value === "") {

            setReturnQty("");

            return;

        }


        const number =
            Number(value);


        // ==================================================
        // ONLY POSITIVE INTEGER
        // ==================================================

        if (
            Number.isInteger(number) &&
            number > 0
        ) {

            setReturnQty(value);

        }

    };


    // ======================================================
    // CALCULATE REFUND
    // ======================================================

    const refundAmount =
        returnModal.item && returnQty
            ? Number(returnQty) *
              Number(returnModal.item.price)
            : 0;


    // ======================================================
    // PROCESS RETURN
    // ======================================================

    const handleReturn = async () => {

        // ==================================================
        // NO ITEM
        // ==================================================

        if (!returnModal.item) {

            return;

        }


        const quantity =
            Number(returnQty);


        const remainingQty =
            Number(
                returnModal.item.remaining_qty
            ) || 0;


        // ==================================================
        // VALIDATE QUANTITY
        // ==================================================

        if (
            !Number.isInteger(quantity) ||
            quantity <= 0
        ) {

            showToast(
                "Please enter a valid return quantity.",
                "error"
            );

            return;

        }


        // ==================================================
        // COMPARE WITH REMAINING QUANTITY
        // ==================================================

        if (quantity > remainingQty) {

            showToast(
                `You cannot return more than ${remainingQty} item(s).`,
                "error"
            );

            return;

        }


        // ==================================================
        // VALIDATE REASON
        // ==================================================

        if (
            !returnReason ||
            !returnReason.trim()
        ) {

            showToast(
                "Please enter a return reason.",
                "error"
            );

            return;

        }


        // ==================================================
        // JWT TOKEN CHECK
        // ==================================================

        const token =
            sessionStorage.getItem("token");


        if (!token) {

            showToast(
                "Please login again.",
                "warning"
            );

            return;

        }


        try {

            setReturnLoading(true);


            // ==================================================
            // RETURN API
            //
            // api.js AUTOMATICALLY ATTACHES:
            // Authorization: Bearer TOKEN
            // ==================================================

            const res = await api.post(

                `/api/invoices/${id}/return`,

                {
                    productName:
                        returnModal.item.item_name,

                    returnQty:
                        quantity,

                    reason:
                        returnReason.trim()
                }

            );


            // ==================================================
            // SUCCESS
            // ==================================================

            if (res.data.success) {

                showToast(
                    `Product returned successfully. Refund: ₹${Number(
                        res.data.refundAmount
                    ).toFixed(2)}`,
                    "success"
                );


                // ==================================================
                // CLOSE MODAL
                // ==================================================

                setReturnModal({
                    show: false,
                    item: null
                });


                setReturnQty("");


                setReturnReason(
                    "Customer Return"
                );


                // ==================================================
                // REFRESH INVOICE
                // ==================================================

                await fetchInvoice();

            }

            // ==================================================
            // API FAILED
            // ==================================================

            else {

                showToast(
                    res.data.message ||
                        "Failed to process return.",
                    "error"
                );

            }

        }

        // ==================================================
        // ERROR
        // ==================================================

        catch (err) {

            console.log(
                "Return Error:",
                err
            );


            if (
                err.response?.status === 401
            ) {

                showToast(
                    "Please login again.",
                    "warning"
                );

            }

            else if (
                err.response?.status === 403
            ) {

                showToast(
                    "You are not authorized to process returns.",
                    "error"
                );

            }

            else {

                showToast(
                    err.response?.data?.message ||
                        "Failed to process return.",
                    "error"
                );

            }

        }

        finally {

            setReturnLoading(false);

        }

    };


    // ======================================================
    // LOADING
    // ======================================================

    if (!invoice) {

        return (

            <>

                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={hideToast}
                />


                <h2 className="text-center mt-10">
                    Loading...
                </h2>

            </>

        );

    }


    // ======================================================
    // RENDER
    // ======================================================

    return (

        <>

            {/* ==================================================
                TOAST
            ================================================== */}

            <Toast
                message={toast.message}
                type={toast.type}
                onClose={hideToast}
            />


            {/* ==================================================
                RETURN MODAL
            ================================================== */}

            {returnModal.show && (

                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">

                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">

                        {/* HEADER */}

                        <div className="flex items-center justify-between mb-5">

                            <h2 className="text-xl font-bold text-gray-800">
                                Return Product
                            </h2>


                            <button
                                type="button"
                                onClick={closeReturnModal}
                                disabled={returnLoading}
                                className="text-gray-500 hover:text-gray-800 text-2xl disabled:opacity-50"
                            >
                                ×
                            </button>

                        </div>


                        {/* PRODUCT */}

                        <div className="bg-gray-50 rounded-lg p-4 mb-5">

                            <div className="flex justify-between">

                                <span className="font-semibold text-gray-700">
                                    Product
                                </span>

                                <span className="text-gray-900">
                                    {returnModal.item?.item_name}
                                </span>

                            </div>


                            <div className="flex justify-between mt-2">

                                <span className="font-semibold text-gray-700">
                                    Purchased Quantity
                                </span>

                                <span>
                                    {returnModal.item?.qty}
                                </span>

                            </div>


                            <div className="flex justify-between mt-2">

                                <span className="font-semibold text-gray-700">
                                    Already Returned
                                </span>

                                <span className="text-red-600 font-semibold">
                                    {returnModal.item?.returned_qty || 0}
                                </span>

                            </div>


                            <div className="flex justify-between mt-2">

                                <span className="font-semibold text-gray-700">
                                    Remaining
                                </span>

                                <span className="text-green-600 font-semibold">
                                    {returnModal.item?.remaining_qty || 0}
                                </span>

                            </div>


                            <div className="flex justify-between mt-2">

                                <span className="font-semibold text-gray-700">
                                    Price
                                </span>

                                <span>
                                    ₹
                                    {Number(
                                        returnModal.item?.price
                                    ).toFixed(2)}
                                </span>

                            </div>

                        </div>


                        {/* RETURN QUANTITY */}

                        <div className="mb-4">

                            <label className="block text-sm font-semibold text-gray-700 mb-1">

                                Return Quantity

                            </label>


                            <input
                                type="number"
                                min="1"
                                max={returnModal.item?.remaining_qty}
                                value={returnQty}
                                onChange={handleReturnQtyChange}
                                placeholder="Enter quantity"
                                disabled={returnLoading}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                            />


                            <p className="text-xs text-gray-500 mt-1">

                                Maximum:
                                {" "}
                                {returnModal.item?.remaining_qty}
                                {" "}item(s)

                            </p>

                        </div>


                        {/* REASON */}

                        <div className="mb-4">

                            <label className="block text-sm font-semibold text-gray-700 mb-1">

                                Reason

                            </label>


                            <select
                                value={returnReason}
                                onChange={(e) =>
                                    setReturnReason(
                                        e.target.value
                                    )
                                }
                                disabled={returnLoading}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
                            >

                                <option value="Customer Return">
                                    Customer Return
                                </option>

                                <option value="Damaged Product">
                                    Damaged Product
                                </option>

                                <option value="Wrong Product">
                                    Wrong Product
                                </option>

                                <option value="Defective Product">
                                    Defective Product
                                </option>

                                <option value="Expired Product">
                                    Expired Product
                                </option>

                                <option value="Other">
                                    Other
                                </option>

                            </select>

                        </div>


                        {/* REFUND */}

                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">

                            <div className="flex justify-between items-center">

                                <span className="font-semibold text-gray-700">
                                    Refund Amount
                                </span>

                                <span className="text-xl font-bold text-green-600">

                                    ₹
                                    {refundAmount.toFixed(2)}

                                </span>

                            </div>

                        </div>


                        {/* BUTTONS */}

                        <div className="flex gap-3">

                            <button
                                type="button"
                                onClick={closeReturnModal}
                                disabled={returnLoading}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
                            >
                                Cancel
                            </button>


                            <button
                                type="button"
                                onClick={handleReturn}
                                disabled={
                                    returnLoading ||
                                    !returnQty
                                }
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50"
                            >

                                {returnLoading
                                    ? "Processing..."
                                    : "Confirm Return"
                                }

                            </button>

                        </div>

                    </div>

                </div>

            )}


            {/* ==================================================
                PAGE
            ================================================== */}

            <div className="min-h-screen bg-gray-100 flex justify-center items-start py-10">


                {/* ==================================================
                    INVOICE
                ================================================== */}

                <div
                    ref={printRef}
                    id="print"
                    className="rounded-lg shadow-lg border border-gray-200"
                    style={{
                        width: "100mm",
                        margin: "0 auto",
                        background: "#fff",
                        padding: "18px"
                    }}
                >


{/* ==================================================
    STORE DETAILS
================================================== */}

<div className="text-center text-gray-900 mb-3">

    {/* STORE NAME */}

    <h1 className="text-xl font-bold tracking-wide">

        {store?.storeName || "Supermarket"}

    </h1>


    {/* ADDRESS */}

    {store?.address && (

        <p className="mt-1 text-[12px] leading-4">

            {store.address}

        </p>

    )}


    {/* GSTIN */}

    {store?.gstin && (

        <p className="mt-1 text-[12px] font-semibold">

            GSTIN: {store.gstin}

        </p>

    )}

</div>


                    <hr className="border-gray-300 mb-4" />


                    {/* ==================================================
                        INVOICE INFORMATION
                    ================================================== */}

                    <div className="mt-8">

                        <div className="mb-4 grid grid-cols-2 gap-y-1 text-base">

                            <span className="font-bold text-[15px]">
                                Date:
                            </span>

                            <span className="text-[15px]">
                                {new Date(
                                    invoice.invoice_date
                                ).toLocaleDateString(
                                    "en-GB"
                                )}
                            </span>


                            <span className="font-bold text-[15px]">
                                Time:
                            </span>

                            <span className="text-[15px]">
                                {invoice.invoice_time}
                            </span>


                            <span className="font-bold text-[15px]">
                                Invoice Number:
                            </span>

                            <span className="text-[15px]">
                                {invoice.invoice_number}
                            </span>


                            <span className="font-bold text-[15px]">
                                Cashier:
                            </span>

                            <span className="text-[15px]">
                                {invoice.cashier_name}
                            </span>


                            <span className="font-bold text-[15px]">
                                Customer:
                            </span>

                            <span className="text-[15px]">
                                {invoice.customer_name}
                            </span>


                            <span className="font-bold text-[15px]">
                                Phone:
                            </span>

                            <span className="text-[15px]">
                                {invoice.phone_number}
                            </span>


                            <span className="font-bold text-[15px]">
                                Payment:
                            </span>

                            <span className="text-[15px]">
                                {invoice.payment_method}
                            </span>

                        </div>

                    </div>


                    {/* ==================================================
                        ITEMS
                    ================================================== */}

                    <table className="w-full text-left mt-2">

                        <thead>

                            <tr className="border-y border-black/10 text-[15px]">

                                <th className="text-left py-2">
                                    ITEM
                                </th>

                                <th className="text-center py-2">
                                    QTY
                                </th>

                                <th className="text-right py-2">
                                    PRICE
                                </th>

                                <th className="text-right py-2">
                                    AMOUNT
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {items.map((item) => {

                                const originalQty =
                                    Number(item.qty) || 0;

                                const returnedQty =
                                    Number(item.returned_qty) || 0;

                                const remainingQty =
                                    Number(item.remaining_qty) ||
                                    Math.max(
                                        originalQty -
                                        returnedQty,
                                        0
                                    );


                                return (

                                    <React.Fragment
                                        key={item.id}
                                    >

                                        {/* ORIGINAL ITEM */}

                                        <tr className="border-b border-black/10">

                                            <td className="w-full py-2">
                                                {item.item_name}
                                            </td>


                                            <td className="min-w-[50px] text-center py-2">
                                                {item.qty}
                                            </td>


                                            <td className="min-w-[80px] text-right py-2">
                                                {Number(
                                                    item.price
                                                ).toFixed(2)}
                                            </td>


                                            <td className="min-w-[90px] text-right py-2">
                                                {Number(
                                                    item.amount
                                                ).toFixed(2)}
                                            </td>

                                        </tr>


                                        {/* RETURN INFORMATION */}

                                        <tr className="print:hidden">

                                            <td
                                                colSpan="4"
                                                className="py-2"
                                            >

                                                <div className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2">

                                                    <div className="text-xs leading-5">

                                                        <div className="font-semibold">
                                                            {item.item_name} — Qty {originalQty}
                                                        </div>


                                                        <div className="text-red-600">
                                                            Returned: {returnedQty}
                                                        </div>


                                                        <div className="text-green-600">
                                                            Remaining: {remainingQty}
                                                        </div>

                                                    </div>


                                                    {/* RETURN BUTTON */}

                                                    {remainingQty > 0 ? (

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                openReturnModal(item)
                                                            }
                                                            className="ml-2 text-sm text-red-600 hover:text-red-800 font-semibold whitespace-nowrap"
                                                        >
                                                            ↩ Return
                                                        </button>

                                                    ) : (

                                                        <span className="ml-2 text-sm text-gray-500 font-semibold whitespace-nowrap">
                                                            Fully Returned
                                                        </span>

                                                    )}

                                                </div>

                                            </td>

                                        </tr>

                                    </React.Fragment>

                                );

                            })}

                        </tbody>

                    </table>


                    {/* ==================================================
                        TOTALS
                    ================================================== */}

                    <div className="mt-4 flex flex-col items-end space-y-2">

                        <div className="flex w-full justify-between border-black/10 pt-2 text-[15px]">

                            <span className="font-bold">
                                Subtotal:
                            </span>

                            <span>
                                {Number(
                                    invoice.subtotal
                                ).toFixed(2)}
                            </span>

                        </div>


                        <div className="flex w-full justify-between text-[15px]">

                            <span className="font-bold">
                                Discount:
                            </span>

                            <span>
                                {Number(
                                    invoice.discount
                                ).toFixed(2)}
                            </span>

                        </div>


                        <div className="flex w-full justify-between text-[15px]">

                            <span className="font-bold">
                                Loyalty Discount:
                            </span>

                            <span>
                                {Number(
                                    invoice.loyalty_discount
                                ).toFixed(2)}
                            </span>

                        </div>


                        <div className="flex w-full justify-between text-[15px]">

                            <span className="font-bold">
                                Tax:
                            </span>

                            <span>
                                {Number(
                                    invoice.tax
                                ).toFixed(2)}
                            </span>

                        </div>


                     <div className="flex w-full justify-between border-t border-black/10 py-2 text-[17px] font-bold">

    <span>
        Grand Total:
    </span>

    <span className="text-[18px]">

        Rs:
        {Number(
            invoice.total
        ).toFixed(2)}

    </span>

</div>


{/* TOTAL PRODUCTS & QUANTITY */}

<div className="w-full text-left text-[10px] text-gray-400 mt-1">

    Total Products:{" "}
    {items.length}

    {"  |  "}

    Total Quantity:{" "}
    {items.reduce(
        (total, item) =>
            total +
            Math.floor(
                Number(item.qty || 0)
            ),
        0
    )}

</div>
                    </div>


                    {/* ==================================================
                        THANK YOU
                    ================================================== */}

                    <div className="w-full text-center mt-4">

                        <h4 className="font-semibold text-[15px]">

                            <p>
                                Thank you for shopping!
                            </p>

                            <p>
                                Visit us again! ❤️
                            </p>

                        </h4>

                    </div>


                    {/* ==================================================
                        BUTTONS
                    ================================================== */}

                    <div className="mt-6 flex gap-2 w-full print:hidden">

                        {/* PRINT */}

                        <button
                            onClick={
                                printInvoiceHandler
                            }
                            className="flex-1 flex items-center justify-center gap-2 rounded-md border border-red-500 py-2 text-sm text-red-500 shadow-sm hover:bg-green-500 hover:text-white transition"
                        >

                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 flex-shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >

                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />

                            </svg>


                            <span className="whitespace-nowrap">
                                Print Bill
                            </span>

                        </button>


                        {/* BACK */}

                        <button
                            onClick={() =>
                                navigate(
                                    "/invoices"
                                )
                            }
                            className="flex-1 flex items-center justify-center gap-2 rounded-md bg-red-500 py-2 text-sm text-white shadow-sm hover:bg-green-600 transition"
                        >

                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 flex-shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >

                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />

                            </svg>


                            <span className="whitespace-nowrap">
                                Back
                            </span>

                        </button>

                    </div>


                    <hr className="mt-5 border-gray-300" />

                </div>

            </div>

        </>

    );

};


export default InvoiceDetails;
