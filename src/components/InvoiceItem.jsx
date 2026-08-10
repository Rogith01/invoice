import React, {
    useEffect,
    useState,
    useCallback,
} from "react";

import "../index.css";

import Toast from "./Toast";

const InvoiceItem = ({
    id,
    name,
    qty,
    price,
    amount,
    onDeleteItem,
    onEdtiItem,
    itemOptions,
    onAddItem,
    autoFocus,
}) => {

    const [toast, setToast] = useState({
        message: "",
        type: "warning",
    });

    // ===============================
    // Show Toast
    // ===============================

    const showToast = useCallback(
        (message, type = "warning") => {

            setToast({
                message,
                type,
            });

        },
        []
    );

    // ===============================
    // Hide Toast
    // ===============================

    const hideToast = useCallback(() => {

        setToast({
            message: "",
            type: "warning",
        });

    }, []);

    // ===============================
    // Refs
    // ===============================

    const itemRef = React.useRef(null);

    const qtyRef = React.useRef(null);

    const priceRef = React.useRef(null);

    // ===============================
    // Auto Focus
    // ===============================

    useEffect(() => {

        if (
            autoFocus &&
            itemRef.current
        ) {

            itemRef.current.focus();
        }

    }, [autoFocus]);

    // ===============================
    // Delete Item
    // ===============================

    const deleteItemHandler = (event) => {

        event.preventDefault();

        onDeleteItem(id);
    };

    // ===============================
    // Keyboard Navigation
    // ===============================

    const handleKeyDown = (event) => {

        // Delete current row

        if (
            event.key === "Delete"
        ) {

            event.preventDefault();

            onDeleteItem(id);

            return;
        }

        // Only handle Enter

        if (
            event.key !== "Enter"
        ) {
            return;
        }

        event.preventDefault();

        // Product → Quantity

        if (
            event.target.name === "name"
        ) {

            qtyRef.current?.focus();

            return;
        }

        // Quantity → Next Item

        if (
            event.target.name === "qty"
        ) {

            onAddItem();

            return;
        }

    };

    // ===============================
    // Calculate Amount
    // ===============================

    const calculatedAmount =
        Number(price || 0) *
        Math.floor(
            Number(qty || 0)
        );

    // ===============================
    // RETURN
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
            {/* ITEM ROW */}
            {/* =============================== */}

            <tr>

                {/* =============================== */}
                {/* PRODUCT NAME */}
                {/* =============================== */}

                <td className="w-full p-1">

                    <select
                        ref={itemRef}
                        className="w-full rounded border px-4 py-1"
                        name="name"
                        id={id}
                        value={name}
                        onChange={onEdtiItem}
                        onKeyDown={handleKeyDown}
                    >

                        <option value="">
                            Select Product
                        </option>

                        {itemOptions
                            .filter(
                                (opt) =>
                                    opt.stock > 0
                            )
                            .map(
                                (opt) => (

                                    <option
                                        key={opt.id}
                                        value={opt.name}
                                    >
                                        {opt.name}
                                    </option>

                                )
                            )}

                    </select>

                </td>

                {/* =============================== */}
                {/* QUANTITY */}
                {/* =============================== */}

                <td className="min-w-[65px] md:min-w-[80px] p-1">

                    <input
                        ref={qtyRef}
                        className="w-full rounded border px-2 py-1"
                        type="number"
                        min="1"
                        max={
                            itemOptions.find(
                                (opt) =>
                                    opt.name ===
                                    name
                            )?.stock || 1
                        }
                        name="qty"
                        id={id}
                        value={qty}
                        onChange={(e) => {

                            const selectedProduct =
                                itemOptions.find(
                                    (opt) =>
                                        opt.name ===
                                        name
                                );

                            const stock =
                                selectedProduct?.stock ||
                                0;

                            const enteredQty =
                                Number(
                                    e.target.value
                                );

                            // ===============================
                            // STOCK VALIDATION
                            // ===============================

                            if (
                                enteredQty >
                                stock
                            ) {

                                showToast(
                                    `Only ${stock} stock available for ${name}.`,
                                    "warning"
                                );

                                return;
                            }

                            // Prevent quantity below 1

                            if (
                                enteredQty < 1
                            ) {

                                return;
                            }

                            onEdtiItem(e);

                        }}
                        onKeyDown={handleKeyDown}
                        onFocus={(e) =>
                            e.target.select()
                        }
                    />

                </td>

                {/* =============================== */}
                {/* PRICE */}
                {/* =============================== */}

                <td className="relative min-w-[100px] md:min-w-[150px] p-1">

                    <input
                        ref={priceRef}
                        className="w-full text-center rounded border px-2 py-1"
                        type="number"
                        min="0.01"
                        step="0.01"
                        name="price"
                        id={id}
                        value={price}
                        onChange={onEdtiItem}
                        onKeyDown={handleKeyDown}
                        onFocus={(e) =>
                            e.target.select()
                        }
                    />

                </td>

                {/* =============================== */}
                {/* AMOUNT */}
                {/* =============================== */}

                <td className="relative min-w-[100px] md:min-w-[150px] p-1">

                    <div className="w-full text-center rounded bg-gray-100 p-1">
                    {Number(
                        amount !== undefined
                            ? amount
                            : calculatedAmount
                    ).toFixed(2)}
                    </div>
                </td>

                {/* =============================== */}
                {/* DELETE */}
                {/* =============================== */}

                <td className="p-1">

                    <div className="flex items-center justify-center">

                        <button
                            type="button"
                            className="rounded-md bg-red-500 p-2 text-white shadow-sm transition hover:bg-red-600 hover:scale-105"
                            onClick={
                                deleteItemHandler
                            }
                            title="Delete Item"
                            aria-label="Delete Item"
                        >

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
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />

                            </svg>

                        </button>

                    </div>

                </td>

            </tr>

        </>

    );
};

export default InvoiceItem;