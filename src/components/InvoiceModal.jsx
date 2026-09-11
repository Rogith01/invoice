import React, {
    Fragment,
    useRef,
    useState,
    useEffect,
} from "react";

import {
    useReactToPrint,
} from "react-to-print";

import {
    Dialog,
    Transition,
} from "@headlessui/react";

import "../index.css";

const InvoiceModal = ({
    isOpen,
    setIsOpen,
    invoiceInfo,
    items,
    onAddNextInvoice,
}) => {
    // ==========================================
    // STORE DETAILS
    // ==========================================

    const store = JSON.parse(
        sessionStorage.getItem("store") || "null"
    );
    const [today, setToday] = useState("");
    const [currentTime, setCurrentTime] = useState("");

    // ==========================================
    // PRINT REF
    // ==========================================

    const printRef = useRef(null);

    // ==========================================
    // DATE & TIME
    // ==========================================

    useEffect(() => {

        if (isOpen) {

            const now = new Date();

            setToday(
                now.toLocaleDateString(
                    "en-GB",
                    {
                        month: "numeric",
                        day: "numeric",
                        year: "numeric",
                    }
                )
            );

            setCurrentTime(
                now.toLocaleTimeString(
                    "en-GB",
                    {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                    }
                )
            );
        }

    }, [isOpen]);

    // ==========================================
    // CLOSE MODAL
    // ==========================================

    function closeModal() {

        setIsOpen(false);

    }

    // ==========================================
    // NEXT INVOICE
    // ==========================================

    const addNextInvoiceHandler = () => {

        setIsOpen(false);

        onAddNextInvoice();

    };

    // ==========================================
    // PRINT
    // ==========================================

    const printInvoiceHandler =
        useReactToPrint({

            contentRef:
                printRef,

            documentTitle:
                `Invoice-${invoiceInfo.invoiceNumber}`,

        });

    // ==========================================
    // WHATSAPP SEND BILL
    // ==========================================

    const sendWhatsAppHandler = () => {
        const currentStore = JSON.parse(sessionStorage.getItem("store")) || {};
        const storeName = currentStore.storeName || currentStore.store_name || "Supermarket";
        
        const customerPhone = invoiceInfo.phoneNumber || "";
        const invoiceNo = invoiceInfo.invoiceNumber;
        const totalAmount = Number(invoiceInfo.total || 0).toFixed(2);

        const messageText = encodeURIComponent(
            `Hello! Thank you for shopping at *${storeName}*.\n\n` +
            `Your bill *${invoiceNo}* amounting to *₹${totalAmount}* has been successfully generated.\n\n` +
            `We look forward to seeing you again! ❤️`
        );

        const cleanPhone = customerPhone.replace(/\D/g, "");
        const targetNumber = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

        window.open(`https://wa.me/${targetNumber}?text=${messageText}`, "_blank");
    };

    // ==========================================
    // KEYBOARD SHORTCUTS
    // ==========================================

    useEffect(() => {

        if (!isOpen) {
            return;
        }

        const handleShortcut = (event) => {

            // ==========================================
            // F6 → PRINT BILL
            // ==========================================

            if (event.key === "F6") {

                event.preventDefault();

                printInvoiceHandler();

                return;

            }

            // ==========================================
            // F7 → NEXT INVOICE
            // ==========================================

            if (event.key === "F7") {

                event.preventDefault();

                addNextInvoiceHandler();

                return;

            }

            // ==========================================
            // ESC → CLOSE MODAL
            // ==========================================

            if (event.key === "Escape") {

                event.preventDefault();

                closeModal();

                return;

            }

        };

        window.addEventListener(
            "keydown",
            handleShortcut
        );

        return () => {

            window.removeEventListener(
                "keydown",
                handleShortcut
            );

        };

    }, [
        isOpen,
        printInvoiceHandler,
        onAddNextInvoice,
        setIsOpen,
        invoiceInfo.invoiceNumber,
    ]);

    // ==========================================
    // RETURN
    // ==========================================

    return (

        <Transition
            show={isOpen}
            as={Fragment}
        >

            <Dialog
                as="div"
                className="relative z-50"
                onClose={closeModal}
            >

                {/* ========================================== */}
                {/* BACKDROP */}
                {/* ========================================== */}

                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >

                    <Dialog.Overlay
                        className="fixed inset-0 bg-black/50"
                    />

                </Transition.Child>

                {/* ========================================== */}
                {/* CENTER */}
                {/* ========================================== */}

                <div className="fixed inset-0 overflow-y-auto">

                    <div className="min-h-full text-center">

                        <span
                            className="inline-block h-screen align-middle"
                            aria-hidden="true"
                        >
                            &#8203;
                        </span>

                        {/* ========================================== */}
                        {/* MODAL */}
                        {/* ========================================== */}

                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >

                            <div className="my-8 inline-block w-full max-w-md transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl transition-all">

                                {/* ========================================== */}
                                {/* PRINT AREA */}
                                {/* ========================================== */}

                                <div
                                    ref={printRef}
                                    id="print"
                                    style={{
                                        width: "80mm",
                                        margin: "0 auto",
                                        background: "#fff",
                                        padding: "8px",
                                    }}
                                >

                                    {/* ========================================== */}
                                    {/* STORE DETAILS */}
                                    {/* ========================================== */}

                                    <div className="text-center text-gray-900">

                                        {/* STORE NAME */}

                                        <h1 className="text-lg font-bold">

                                            {store?.storeName || "Supermarket"}

                                        </h1>

                                        {/* ADDRESS */}

                                        {store?.address && (

                                            <p className="mt-1 text-[11px] leading-4">

                                                {store.address}

                                            </p>

                                        )}

                                        {/* GSTIN */}

                                        {store?.gstin && (

                                            <p className="mt-1 text-[11px] font-semibold">

                                                GSTIN: {store.gstin}

                                            </p>

                                        )}

                                    </div>

                                    {/* ========================================== */}
                                    {/* INVOICE INFO */}
                                    {/* ========================================== */}

                                    <div className="mt-6">

                                        <div className="mb-4 grid grid-cols-2 text-xs">

                                            <span className="font-bold">
                                                Date:
                                            </span>

                                            <span>
                                                {today}
                                            </span>

                                            <span className="font-bold">
                                                Time:
                                            </span>

                                            <span>
                                                {currentTime}
                                            </span>

                                            <span className="font-bold">
                                                Invoice Number:
                                            </span>

                                            <span>
                                                {invoiceInfo.invoiceNumber}
                                            </span>

                                            <span className="font-bold">
                                                Cashier:
                                            </span>

                                            <span>
                                                {invoiceInfo.cashierName}
                                            </span>

                                            {/* COUNTER */}
                                            <span className="font-bold">
                                                Counter:
                                            </span>

                                            <span>
                                                {invoiceInfo.counterName || "Counter 1"}
                                            </span>

                                            <span className="font-bold">
                                                Customer:
                                            </span>

                                            <span>
                                                {invoiceInfo.customerName}
                                            </span>

                                            <span className="font-bold">
                                                Phone:
                                            </span>

                                            <span>
                                                {invoiceInfo.phoneNumber}
                                            </span>

                                            <span className="font-bold">
                                                Payment:
                                            </span>

                                            <span>
                                                {invoiceInfo.paymentMethod === "Split"
                                                    ? "Split (Cash + Online)"
                                                    : invoiceInfo.paymentMethod}
                                            </span>

                                            {/* SPLIT BREAKDOWN IN HEADER IF APPLICABLE */}
                                            {invoiceInfo.paymentMethod === "Split" && (
                                                <>
                                                    <span className="font-bold pl-2 text-gray-600">
                                                        ↳ Cash:
                                                    </span>
                                                    <span className="text-gray-700">
                                                        ₹{Number(invoiceInfo.cashAmount || 0).toFixed(2)}
                                                    </span>

                                                    <span className="font-bold pl-2 text-gray-600">
                                                        ↳ Online:
                                                    </span>
                                                    <span className="text-gray-700">
                                                        ₹{Number(invoiceInfo.onlineAmount || 0).toFixed(2)}
                                                    </span>
                                                </>
                                            )}

                                        </div>

                                        {/* ========================================== */}
                                        {/* ITEMS TABLE */}
                                        {/* ========================================== */}

                                        <table className="w-full text-left">

                                            <thead>

                                                <tr className="border-y border-black/10 text-sm">

                                                    <th className="py-2">
                                                        ITEM
                                                    </th>

                                                    <th className="py-2 text-center">
                                                        QTY
                                                    </th>

                                                    <th className="py-2 text-right">
                                                        PRICE
                                                    </th>

                                                    <th className="py-2 text-right">
                                                        AMOUNT
                                                    </th>

                                                </tr>

                                            </thead>

                                            <tbody>

                                                {items.map(
                                                    (item) => {

                                                        const itemAmount =
                                                            item.amount !==
                                                            undefined
                                                                ? Number(
                                                                      item.amount
                                                                  )
                                                                : Number(
                                                                      item.price ||
                                                                          0
                                                                  ) *
                                                                  Math.floor(
                                                                      Number(
                                                                          item.qty ||
                                                                              0
                                                                      )
                                                                  );

                                                        return (

                                                            <tr
                                                                key={
                                                                    item.id
                                                                }
                                                                className="border-b border-black/10 text-xs"
                                                            >

                                                                {/* ITEM */}

                                                                <td className="w-full py-2 pr-1">

                                                                    {item.name}

                                                                </td>

                                                                {/* QTY */}

                                                                <td className="min-w-[35px] py-2 text-center">

                                                                    {item.qty}

                                                                </td>

                                                                {/* PRICE */}

                                                                <td className="min-w-[65px] py-2 text-right">

                                                                    {Number(
                                                                        item.price ||
                                                                            0
                                                                    ).toFixed(
                                                                        2
                                                                    )}

                                                                </td>

                                                                {/* AMOUNT */}

                                                                <td className="min-w-[75px] py-2 text-right">

                                                                    {itemAmount.toFixed(
                                                                        2
                                                                    )}

                                                                </td>

                                                            </tr>

                                                        );
                                                    }
                                                )}

                                            </tbody>

                                        </table>

                                        {/* ========================================== */}
                                        {/* TOTALS */}
                                        {/* ========================================== */}

                                        <div className="mt-4 flex flex-col items-end space-y-1.5 text-xs">

                                            {/* SUBTOTAL */}

                                            <div className="flex w-full justify-between border-t border-black/10 pt-2">

                                                <span className="font-bold">
                                                    Subtotal:
                                                </span>

                                                <span>
                                                    ₹{Number(
                                                        invoiceInfo.subtotal ||
                                                            0
                                                    ).toFixed(
                                                        2
                                                    )}
                                                </span>

                                            </div>

                                            {/* DISCOUNT */}

                                            <div className="flex w-full justify-between">

                                                <span className="font-bold">
                                                    Discount:
                                                </span>

                                                <span>
                                                    - ₹{Number(
                                                        invoiceInfo.discountRate ||
                                                            0
                                                    ).toFixed(
                                                        2
                                                    )}
                                                </span>

                                            </div>

                                            {/* LOYALTY DISCOUNT */}

                                            <div className="flex w-full justify-between">

                                                <span className="font-bold">
                                                    Loyalty Discount:
                                                </span>

                                                <span>
                                                    - ₹{Number(
                                                        invoiceInfo.loyaltyDiscount ||
                                                            0
                                                    ).toFixed(
                                                        2
                                                    )}
                                                </span>

                                            </div>

                                            {/* TAX */}

                                            <div className="flex w-full justify-between">

                                                <span className="font-bold">
                                                    Tax:
                                                </span>

                                                <span>
                                                    + ₹{Number(
                                                        invoiceInfo.taxRate ||
                                                            0
                                                    ).toFixed(
                                                        2
                                                    )}
                                                </span>

                                            </div>

                                            {/* GRAND TOTAL */}

                                            <div className="flex w-full justify-between border-t border-black/10 py-2 text-[16px] font-bold">

                                                <span>
                                                    Grand Total:
                                                </span>

                                                <span>
                                                    ₹{Number(
                                                        invoiceInfo.total || 0
                                                    ).toFixed(2)}
                                                </span>

                                            </div>


                                            {/* TOTAL PRODUCTS & QUANTITY */}

                                            <div className="w-full text-left text-[10px] text-gray-400 mt-1">

                                                Total Products:{" "}
                                                {items.filter(
                                                    (item) => item.name
                                                ).length}

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

                                        {/* ========================================== */}
                                        {/* THANK YOU */}
                                        {/* ========================================== */}

                                        <div className="w-full text-center mt-4">

                                            <h4 className="font-semibold text-[14px]">

                                                Thank you for shopping!

                                                <p className="text-xs mt-0.5">
                                                    Visit us again!❤️
                                                </p>

                                            </h4>

                                        </div>

                                    </div>

                                </div>

                                {/* ========================================== */}
                                {/* BUTTONS */}
                                {/* ========================================== */}

                                <div className="p-4 bg-gray-50 border-t border-gray-100 flex flex-col gap-2">

                                    <div className="flex gap-2">

                                        {/* PRINT */}

                                        <button
                                            type="button"
                                            onClick={
                                                printInvoiceHandler
                                            }
                                            className="flex flex-1 items-center justify-center space-x-1 rounded-md border border-red-500 py-2 text-sm text-red-500 shadow-sm transition hover:bg-green-500 hover:text-white"
                                        >

                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-4 w-4"
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

                                            <span>
                                                Print Bill
                                            </span>

                                            <span className="ml-1 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                                                F6
                                            </span>

                                        </button>

                                        {/* NEXT */}

                                        <button
                                            type="button"
                                            onClick={
                                                addNextInvoiceHandler
                                            }
                                            className="flex flex-1 items-center justify-center space-x-1 rounded-md bg-red-500 py-2 text-sm text-white shadow-sm hover:bg-green-600"
                                        >

                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-4 w-4"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >

                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M13 5l7 7-7 7M5 5l7 7-7 7"
                                                />

                                            </svg>

                                            <span>
                                                Next
                                            </span>

                                            <span className="ml-1 rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-bold text-white">
                                                F7
                                            </span>

                                        </button>

                                    </div>

                                    {/* WHATSAPP SEND BUTTON */}
                                    <button
                                        type="button"
                                        onClick={sendWhatsAppHandler}
                                        className="w-full flex items-center justify-center space-x-1 rounded-md bg-emerald-600 py-2 text-sm text-white shadow-sm hover:bg-emerald-700 transition"
                                    >
                                        <span>📲 Send Bill via WhatsApp</span>
                                    </button>

                                </div>

                            </div>

                        </Transition.Child>

                    </div>

                </div>

            </Dialog>

        </Transition>
    );
};

export default InvoiceModal;