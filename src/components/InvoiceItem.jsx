import React, {
    useEffect,
    useState,
    useCallback,
    useRef,
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

    // =====================================================
    // TOAST
    // =====================================================

    const [toast, setToast] = useState({
        message: "",
        type: "warning",
    });

    // =====================================================
    // SOUND REFS
    // =====================================================

    const successSoundRef = useRef(null);

    const errorSoundRef = useRef(null);

    // =====================================================
    // INITIALIZE SOUNDS
    // =====================================================

    useEffect(() => {

        successSoundRef.current =
            new Audio("/success-tone.mp3");

        successSoundRef.current.volume = 1.0;

        errorSoundRef.current =
            new Audio("/error-tone.mp3");

        errorSoundRef.current.volume = 1.0;

    }, []);

    // =====================================================
    // PLAY SUCCESS SOUND
    // =====================================================

    const playSuccessSound = useCallback(() => {

        if (!successSoundRef.current) {
            return;
        }

        successSoundRef.current.currentTime = 0;

        successSoundRef.current
            .play()
            .catch((error) => {

                console.log(
                    "Success sound could not play:",
                    error
                );

            });

    }, []);

    // =====================================================
    // PLAY ERROR SOUND
    // =====================================================

    const playErrorSound = useCallback(() => {

        if (!errorSoundRef.current) {
            return;
        }

        errorSoundRef.current.currentTime = 0;

        errorSoundRef.current
            .play()
            .catch((error) => {

                console.log(
                    "Error sound could not play:",
                    error
                );

            });

    }, []);

    // =====================================================
    // SHOW TOAST
    // =====================================================

    const showToast = useCallback(
        (message, type = "warning") => {

            setToast({
                message,
                type,
            });

            // =================================================
            // SUCCESS → SUCCESS TONE
            // ERROR → ERROR TONE
            // WARNING → ERROR TONE
            // =================================================

            if (type === "success") {

                playSuccessSound();

            } else if (
                type === "error" ||
                type === "warning"
            ) {

                playErrorSound();

            }

        },
        [
            playSuccessSound,
            playErrorSound,
        ]
    );

    // =====================================================
    // HIDE TOAST
    // =====================================================

    const hideToast = useCallback(() => {

        setToast({
            message: "",
            type: "warning",
        });

    }, []);

    // =====================================================
    // REFS
    // =====================================================

    const itemRef = useRef(null);

    const qtyRef = useRef(null);

    const priceRef = useRef(null);

    // =====================================================
    // AUTO FOCUS
    // =====================================================

    useEffect(() => {

        if (
            autoFocus &&
            itemRef.current
        ) {

            itemRef.current.focus();

        }

    }, [autoFocus]);

    // =====================================================
    // DELETE ITEM
    // =====================================================

    const deleteItemHandler = (event) => {

        event.preventDefault();

        onDeleteItem(id);

    };

    // =====================================================
    // KEYBOARD NAVIGATION
    // =====================================================

    const handleKeyDown = (event) => {

        // =================================================
        // DELETE CURRENT ROW
        // =================================================

        if (
            event.key === "Delete"
        ) {

            event.preventDefault();

            onDeleteItem(id);

            return;

        }

        // =================================================
        // ONLY HANDLE ENTER
        // =================================================

        if (
            event.key !== "Enter"
        ) {

            return;

        }

        event.preventDefault();

        // =================================================
        // PRODUCT → QUANTITY
        // =================================================

        if (
            event.target.name === "name"
        ) {

            qtyRef.current?.focus();

            return;

        }

        // =================================================
        // QUANTITY → NEXT ITEM
        // =================================================

        if (
            event.target.name === "qty"
        ) {

            onAddItem();

            return;

        }

    };

    // =====================================================
    // CALCULATE AMOUNT
    // =====================================================

    const calculatedAmount =
        Number(price || 0) *
        Math.floor(
            Number(qty || 0)
        );

    // =====================================================
    // RETURN
    // =====================================================

    return (

        <>

            {/* =================================================
                TOAST
            ================================================= */}

            <Toast
                message={toast.message}
                type={toast.type}
                onClose={hideToast}
            />

            {/* =================================================
                ITEM ROW
            ================================================= */}

          <tr>

    {/* =================================================
        PRODUCT NAME
    ================================================= */}

    <td className="w-[220px] min-w-[220px] p-2">

        <select
            ref={itemRef}
            className="w-full rounded border px-3 py-2"
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


    {/* =================================================
        QUANTITY
    ================================================= */}

    <td className="w-[90px] min-w-[90px] p-2">

        <input
            ref={qtyRef}
            className="w-full rounded border px-3 py-2 text-center"
            type="number"
            min="1"
            max={
                itemOptions.find(
                    (opt) =>
                        opt.name === name
                )?.stock || 1
            }
            name="qty"
            id={id}
            value={qty}
            onChange={(e) => {

                const selectedProduct =
                    itemOptions.find(
                        (opt) =>
                            opt.name === name
                    );

                const stock =
                    selectedProduct?.stock || 0;

                const enteredQty =
                    Number(e.target.value);

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


    {/* =================================================
        PRICE
    ================================================= */}

    <td className="w-[90px] min-w-[90px] p-2">

        <input
            ref={priceRef}
            className="w-full rounded border px-3 py-2 text-center"
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


    {/* =================================================
        AMOUNT
    ================================================= */}

    <td className="w-[90px] min-w-[90px] p-2">

        <div className="w-full rounded bg-gray-100 px-3 py-2 text-center">

            {Number(
                amount !== undefined
                    ? amount
                    : calculatedAmount
            ).toFixed(2)}

        </div>

    </td>


    {/* =================================================
        ACTION
    ================================================= */}

    <td className="w-[90px] min-w-[90px] p-2">

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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 01-1 1v3M4 7h16"
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