import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import axios from "axios";
import { BrowserMultiFormatReader } from "@zxing/browser";
import Toast from "./Toast";

const ProductManagement = () => {

    // ==========================================
    // PRODUCTS
    // ==========================================

    const [products, setProducts] = useState([]);

    const [productName, setProductName] =
        useState("");

    const [price, setPrice] =
        useState("");

    const [barcode, setBarcode] =
        useState("");

    const [editingId, setEditingId] =
        useState(null);

    // ==========================================
    // SEARCH
    // ==========================================

    const [search, setSearch] =
        useState("");

    // ==========================================
    // DELETE CONFIRMATION
    // ==========================================

    const [deleteConfirm, setDeleteConfirm] =
        useState({
            show: false,
            id: null,
            productName: "",
        });

    // ==========================================
    // TOAST
    // ==========================================

    const [toast, setToast] =
        useState({
            message: "",
            type: "success",
        });

    // ==========================================
    // SOUND
    // ==========================================

    // Barcode-specific sounds
    const barcodeBeepSoundRef =
        useRef(null);

    const barcodeErrorSoundRef =
        useRef(null);

    // Normal application toast sounds
    const successToneRef =
        useRef(null);

    const errorToneRef =
        useRef(null);

    // ==========================================
    // CAMERA SCANNER
    // ==========================================

    const [showScanner, setShowScanner] =
        useState(false);

    const videoRef =
        useRef(null);

    const codeReaderRef =
        useRef(null);

    const scannerControlsRef =
        useRef(null);

    const scannerTimeoutRef =
        useRef(null);

    const scannerSessionRef =
        useRef(0);

    const scannerStartingRef =
        useRef(false);

    const barcodeScanLockRef =
        useRef(true);

    // ==========================================
    // BARCODE INPUT
    // ==========================================

    const barcodeInputRef =
        useRef(null);

    // ==========================================
    // INITIALIZE SOUNDS
    // ==========================================

    useEffect(() => {

        // ------------------------------------------
        // BARCODE SUCCESS SOUND
        // ------------------------------------------

        barcodeBeepSoundRef.current =
            new Audio("/barcode-beep.mp3");

        barcodeBeepSoundRef.current.volume = 1.0;

        // ------------------------------------------
        // BARCODE ERROR SOUND
        // ------------------------------------------

        barcodeErrorSoundRef.current =
            new Audio("/barcode-error.mp3");

        barcodeErrorSoundRef.current.volume = 1.0;

        // ------------------------------------------
        // NORMAL SUCCESS TOAST SOUND
        // ------------------------------------------

        successToneRef.current =
            new Audio("/success-tone.mp3");

        successToneRef.current.volume = 1.0;

        // ------------------------------------------
        // NORMAL ERROR / WARNING TOAST SOUND
        // ------------------------------------------

        errorToneRef.current =
            new Audio("/error-tone.mp3");

        errorToneRef.current.volume = 1.0;

        // ------------------------------------------
        // CLEANUP
        // ------------------------------------------

        return () => {

            if (barcodeBeepSoundRef.current) {
                barcodeBeepSoundRef.current.pause();
                barcodeBeepSoundRef.current = null;
            }

            if (barcodeErrorSoundRef.current) {
                barcodeErrorSoundRef.current.pause();
                barcodeErrorSoundRef.current = null;
            }

            if (successToneRef.current) {
                successToneRef.current.pause();
                successToneRef.current = null;
            }

            if (errorToneRef.current) {
                errorToneRef.current.pause();
                errorToneRef.current = null;
            }

        };

    }, []);

    // ==========================================
    // PLAY BARCODE SUCCESS SOUND
    // ==========================================

    const playBarcodeSuccessSound = () => {

        if (
            barcodeBeepSoundRef.current
        ) {

            barcodeBeepSoundRef.current.currentTime =
                0;

            barcodeBeepSoundRef.current
                .play()
                .catch((error) => {

                    console.log(
                        "Barcode beep could not play:",
                        error
                    );

                });

        }

    };

    // ==========================================
    // PLAY BARCODE ERROR SOUND
    // ==========================================

    const playBarcodeErrorSound = () => {

        if (
            barcodeErrorSoundRef.current
        ) {

            barcodeErrorSoundRef.current.currentTime =
                0;

            barcodeErrorSoundRef.current
                .play()
                .catch((error) => {

                    console.log(
                        "Barcode error sound could not play:",
                        error
                    );

                });

        }

    };

    // ==========================================
    // PLAY NORMAL SUCCESS TONE
    // ==========================================

    const playSuccessTone = () => {

        if (
            successToneRef.current
        ) {

            successToneRef.current.currentTime =
                0;

            successToneRef.current
                .play()
                .catch((error) => {

                    console.log(
                        "Success tone could not play:",
                        error
                    );

                });

        }

    };

    // ==========================================
    // PLAY NORMAL ERROR / WARNING TONE
    // ==========================================

    const playErrorTone = () => {

        if (
            errorToneRef.current
        ) {

            errorToneRef.current.currentTime =
                0;

            errorToneRef.current
                .play()
                .catch((error) => {

                    console.log(
                        "Error tone could not play:",
                        error
                    );

                });

        }

    };

    // ==========================================
    // SHOW TOAST
    // ==========================================

    const showToast = (
        message,
        type = "success"
    ) => {

        setToast({
            message,
            type,
        });

        // ------------------------------------------
        // SUCCESS
        // ------------------------------------------

        if (type === "success") {

            playSuccessTone();

        }

        // ------------------------------------------
        // ERROR
        // ------------------------------------------

        else if (type === "error") {

            playErrorTone();

        }

        // ------------------------------------------
        // WARNING
        // ------------------------------------------

        else if (type === "warning") {

            playErrorTone();

        }

        // ------------------------------------------
        // INFO
        // ------------------------------------------
        // No sound for info.

    };

    // ==========================================
    // CLOSE TOAST
    // ==========================================

    const closeToast = () => {

        setToast({
            message: "",
            type: "success",
        });

    };

    // ==========================================
    // FETCH PRODUCTS
    // ==========================================

    const fetchProducts =
        useCallback(async () => {

            try {

                const res =
                    await axios.get(
                        "https://invoice-backend-78hd.onrender.com/api/products"
                    );

                if (res.data.success) {

                    setProducts(
                        res.data.products
                    );

                } else {

                    showToast(
                        res.data.message ||
                            "Failed to load products.",
                        "error"
                    );

                }

            } catch (err) {

                console.log(err);

                showToast(
                    "Unable to load products. Please try again.",
                    "error"
                );

            }

        }, []);

    // ==========================================
    // LOAD PRODUCTS
    // ==========================================

    useEffect(() => {

        fetchProducts();

    }, [fetchProducts]);

    // ==========================================
    // EDIT PRODUCT
    // ==========================================

    const editProduct = (product) => {

        setEditingId(product.id);

        setProductName(
            product.product_name
        );

        setPrice(product.price);

        setBarcode(
            product.barcode || ""
        );

        showToast(
            `"${product.product_name}" selected for editing.`,
            "info"
        );

    };

    // ==========================================
    // CANCEL EDIT
    // ==========================================

    const cancelEdit = () => {

        setEditingId(null);

        setProductName("");

        setPrice("");

        setBarcode("");

        showToast(
            "Edit cancelled.",
            "info"
        );

    };

    // ==========================================
    // DELETE CONFIRMATION
    // ==========================================

    const confirmDeleteProduct = (
        id,
        productName
    ) => {

        setDeleteConfirm({
            show: true,
            id,
            productName,
        });

    };

    // ==========================================
    // CANCEL DELETE
    // ==========================================

    const cancelDelete = () => {

        setDeleteConfirm({
            show: false,
            id: null,
            productName: "",
        });

    };

    // ==========================================
    // DELETE PRODUCT
    // ==========================================

    const deleteProduct = async () => {

        const {
            id,
            productName,
        } = deleteConfirm;

        if (!id) return;

        try {

            const res =
                await axios.delete(
                    `https://invoice-backend-78hd.onrender.com/api/products/${id}`
                );

            if (res.data.success) {

                await fetchProducts();

                showToast(
                    `"${productName}" deleted successfully.`,
                    "success"
                );

            } else {

                showToast(
                    res.data.message ||
                        "Failed to delete product.",
                    "error"
                );

            }

        } catch (err) {

            console.log(err);

            showToast(
                "Failed to delete product. Please try again.",
                "error"
            );

        }

        setDeleteConfirm({
            show: false,
            id: null,
            productName: "",
        });

    };

    // ==========================================
    // CHECK DUPLICATE BARCODE
    // ==========================================

    const isDuplicateBarcode = (
        barcodeValue
    ) => {

        const cleanBarcode =
            String(
                barcodeValue || ""
            ).trim();

        if (!cleanBarcode) {
            return null;
        }

        const existingProduct =
            products.find(
                (product) => {

                    const existingBarcode =
                        String(
                            product.barcode || ""
                        ).trim();

                    return (
                        existingBarcode ===
                            cleanBarcode &&
                        product.id !== editingId
                    );

                }
            );

        return existingProduct || null;

    };

    // ==========================================
    // HANDLE BARCODE VALUE
    // ==========================================

    const handleBarcodeValue = (
        value
    ) => {

        const cleanBarcode =
            String(value || "")
                .replace(/[\r\n]/g, "")
                .trim();

        if (!cleanBarcode) {

            setBarcode("");

            return;

        }

        const existingProduct =
            isDuplicateBarcode(
                cleanBarcode
            );

        if (existingProduct) {

            // Barcode-specific error sound
            playBarcodeErrorSound();

            showToast(
                `Barcode already exists for "${existingProduct.product_name}".`,
                "warning"
            );

            setBarcode("");

            setTimeout(() => {

                barcodeInputRef.current?.focus();

            }, 100);

            return;

        }

        setBarcode(
            cleanBarcode
        );

    };

    // ==========================================
    // ADD / UPDATE PRODUCT
    // ==========================================

    const addProduct = async () => {

        // ==========================================
        // VALIDATION
        // ==========================================

        if (
            !productName.trim() ||
            Number(price) <= 0
        ) {

            // Normal warning tone
            showToast(
                "Enter a valid Product Name and Price.",
                "warning"
            );

            return;

        }

        // ==========================================
        // BARCODE VALIDATION
        // ==========================================

        const cleanBarcode =
            barcode.trim();

        if (!cleanBarcode) {

            // This is a normal validation warning,
            // not a barcode scan event.
            showToast(
                "Please enter or scan a barcode.",
                "warning"
            );

            return;

        }

        // ==========================================
        // DUPLICATE BARCODE CHECK
        // ==========================================

        const existingProduct =
            isDuplicateBarcode(
                cleanBarcode
            );

        if (existingProduct) {

            // Barcode-specific error sound
            playBarcodeErrorSound();

            showToast(
                `Barcode already exists for "${existingProduct.product_name}".`,
                "warning"
            );

            return;

        }

        // ==========================================
        // UPDATE PRODUCT
        // ==========================================

        if (editingId) {

            try {

                const res =
                    await axios.put(
                        `https://invoice-backend-78hd.onrender.com/api/products/${editingId}`,
                        {
                            productName:
                                productName.trim(),

                            price,

                            barcode:
                                cleanBarcode,
                        }
                    );

                if (res.data.success) {

                    await fetchProducts();

                    setEditingId(null);

                    setProductName("");

                    setPrice("");

                    setBarcode("");

                    // Normal success tone
                    showToast(
                        "Product updated successfully!",
                        "success"
                    );

                } else {

                    // Normal error tone
                    showToast(
                        res.data.message ||
                            "Failed to update product.",
                        "error"
                    );

                }

            } catch (err) {

                console.log(err);

                // Normal error tone
                showToast(
                    err.response?.data?.message ||
                        "Failed to update product. Please try again.",
                    "error"
                );

            }

            return;

        }

        // ==========================================
        // ADD NEW PRODUCT
        // ==========================================

        try {

            const res =
                await axios.post(
                    "https://invoice-backend-78hd.onrender.com/api/products",
                    {
                        productName:
                            productName.trim(),

                        price,

                        barcode:
                            cleanBarcode,
                    }
                );

            if (res.data.success) {

                await fetchProducts();

                setProductName("");

                setPrice("");

                setBarcode("");

                // Normal success tone
                showToast(
                    "Product added successfully!",
                    "success"
                );

                setTimeout(() => {

                    barcodeInputRef.current?.focus();

                }, 100);

            } else {

                // Normal error tone
                showToast(
                    res.data.message ||
                        "Failed to add product.",
                    "error"
                );

            }

        } catch (err) {

            console.log(err);

            // ==========================================
            // BACKEND DUPLICATE BARCODE ERROR
            // ==========================================

            if (
                err.response?.data?.message
            ) {

                // Barcode-related backend error
                playBarcodeErrorSound();

                showToast(
                    err.response.data.message,
                    "warning"
                );

            } else {

                // Normal error
                showToast(
                    "Failed to add product. Please try again.",
                    "error"
                );

            }

        }

    };

    // ==========================================
    // STOP CAMERA SCANNER
    // ==========================================

    const stopBarcodeScanner =
        useCallback(() => {

            console.log(
                "Stopping product barcode scanner..."
            );

            // ==========================================
            // INVALIDATE SESSION
            // ==========================================

            scannerSessionRef.current += 1;

            barcodeScanLockRef.current =
                true;

            scannerStartingRef.current =
                false;

            // ==========================================
            // CLEAR TIMEOUT
            // ==========================================

            if (
                scannerTimeoutRef.current
            ) {

                clearTimeout(
                    scannerTimeoutRef.current
                );

                scannerTimeoutRef.current =
                    null;

            }

            // ==========================================
            // STOP CONTROLS
            // ==========================================

            if (
                scannerControlsRef.current
            ) {

                try {

                    scannerControlsRef.current.stop();

                } catch (error) {

                    console.log(
                        "Scanner controls stop error:",
                        error
                    );

                }

                scannerControlsRef.current =
                    null;

            }

            // ==========================================
            // RESET READER
            // ==========================================

            if (
                codeReaderRef.current
            ) {

                try {

                    codeReaderRef.current.reset();

                } catch (error) {

                    console.log(
                        "Scanner reset error:",
                        error
                    );

                }

                codeReaderRef.current =
                    null;

            }

            // ==========================================
            // STOP CAMERA STREAM
            // ==========================================

            if (videoRef.current) {

                const stream =
                    videoRef.current.srcObject;

                if (stream) {

                    stream
                        .getTracks()
                        .forEach(
                            (track) => {

                                try {

                                    track.stop();

                                } catch (error) {

                                    console.log(
                                        error
                                    );

                                }

                            }
                        );

                }

                videoRef.current.srcObject =
                    null;

            }

            setShowScanner(false);

        }, []);

    // ==========================================
    // START CAMERA SCANNER
    // ==========================================

    const startBarcodeScanner =
        async () => {

            // ==========================================
            // PREVENT DOUBLE CLICK
            // ==========================================

            if (
                scannerStartingRef.current
            ) {

                return;

            }

            // ==========================================
            // CLEAN OLD SCANNER
            // ==========================================

            if (
                codeReaderRef.current ||
                scannerControlsRef.current ||
                scannerTimeoutRef.current
            ) {

                stopBarcodeScanner();

                await new Promise(
                    (resolve) =>
                        setTimeout(
                            resolve,
                            100
                        )
                );

            }

            // ==========================================
            // NEW SESSION
            // ==========================================

            const sessionId =
                scannerSessionRef.current +
                1;

            scannerSessionRef.current =
                sessionId;

            scannerStartingRef.current =
                true;

            barcodeScanLockRef.current =
                false;

            setShowScanner(true);

            // ==========================================
            // WAIT FOR VIDEO
            // ==========================================

            scannerTimeoutRef.current =
                setTimeout(
                    async () => {

                        scannerTimeoutRef.current =
                            null;

                        if (
                            sessionId !==
                            scannerSessionRef.current
                        ) {

                            scannerStartingRef.current =
                                false;

                            return;

                        }

                        if (
                            !videoRef.current
                        ) {

                            scannerStartingRef.current =
                                false;

                            barcodeScanLockRef.current =
                                true;

                            setShowScanner(false);

                            playBarcodeErrorSound();

                            showToast(
                                "Camera could not be started.",
                                "error"
                            );

                            return;

                        }

                        try {

                            // ==========================================
                            // NEW ZXING READER
                            // ==========================================

                            const codeReader =
                                new BrowserMultiFormatReader();

                            codeReaderRef.current =
                                codeReader;

                            // ==========================================
                            // START CAMERA
                            // ==========================================

                            const controls =
                                await codeReader.decodeFromVideoDevice(
                                    undefined,
                                    videoRef.current,
                                    (
                                        result,
                                        error
                                    ) => {

                                        // ==========================================
                                        // IGNORE OLD SESSION
                                        // ==========================================

                                        if (
                                            sessionId !==
                                            scannerSessionRef.current
                                        ) {

                                            return;

                                        }

                                        // ==========================================
                                        // IGNORE AFTER SCAN
                                        // ==========================================

                                        if (
                                            barcodeScanLockRef.current
                                        ) {

                                            return;

                                        }

                                        // ==========================================
                                        // NO RESULT
                                        // ==========================================

                                        if (
                                            !result
                                        ) {

                                            return;

                                        }

                                        // ==========================================
                                        // LOCK
                                        // ==========================================

                                        barcodeScanLockRef.current =
                                            true;

                                        const scannedBarcode =
                                            result
                                                .getText()
                                                .trim();

                                        console.log(
                                            "Product barcode scanned:",
                                            scannedBarcode
                                        );

                                        // ==========================================
                                        // CHECK DUPLICATE
                                        // ==========================================

                                        const existingProduct =
                                            isDuplicateBarcode(
                                                scannedBarcode
                                            );

                                        if (
                                            existingProduct
                                        ) {

                                            // Barcode-specific error
                                            playBarcodeErrorSound();

                                            showToast(
                                                `Barcode already exists for "${existingProduct.product_name}".`,
                                                "warning"
                                            );

                                            setBarcode("");

                                        } else {

                                            setBarcode(
                                                scannedBarcode
                                            );

                                            // Barcode-specific success
                                            playBarcodeSuccessSound();

                                            showToast(
                                                "Barcode scanned successfully.",
                                                "info"
                                            );

                                        }

                                        // ==========================================
                                        // STOP CAMERA
                                        // ==========================================

                                        stopBarcodeScanner();

                                        setTimeout(
                                            () => {

                                                barcodeInputRef.current?.focus();

                                            },
                                            100
                                        );

                                    }
                                );

                            // ==========================================
                            // CHECK SESSION
                            // ==========================================

                            if (
                                sessionId !==
                                scannerSessionRef.current
                            ) {

                                try {

                                    controls.stop();

                                } catch (error) {

                                    console.log(
                                        error
                                    );

                                }

                                scannerStartingRef.current =
                                    false;

                                return;

                            }

                            scannerControlsRef.current =
                                controls;

                            scannerStartingRef.current =
                                false;

                        } catch (error) {

                            console.error(
                                "ZXing Scanner Error:",
                                error
                            );

                            if (
                                sessionId ===
                                scannerSessionRef.current
                            ) {

                                barcodeScanLockRef.current =
                                    true;

                                scannerStartingRef.current =
                                    false;

                                playBarcodeErrorSound();

                                showToast(
                                    "Unable to start camera. Please allow camera permission and try again.",
                                    "error"
                                );

                                stopBarcodeScanner();

                            }

                        }

                    },
                    300
                );

        };

    // ==========================================
    // CLEAN CAMERA ON UNMOUNT
    // ==========================================

    useEffect(() => {

        const videoElement =
            videoRef.current;

        return () => {

            scannerSessionRef.current += 1;

            barcodeScanLockRef.current =
                true;

            scannerStartingRef.current =
                false;

            if (
                scannerTimeoutRef.current
            ) {

                clearTimeout(
                    scannerTimeoutRef.current
                );

                scannerTimeoutRef.current =
                    null;

            }

            if (
                scannerControlsRef.current
            ) {

                try {

                    scannerControlsRef.current.stop();

                } catch (error) {

                    console.log(
                        error
                    );

                }

                scannerControlsRef.current =
                    null;

            }

            if (
                codeReaderRef.current
            ) {

                try {

                    codeReaderRef.current.reset();

                } catch (error) {

                    console.log(
                        error
                    );

                }

                codeReaderRef.current =
                    null;

            }

            if (videoElement) {

                const stream =
                    videoElement.srcObject;

                if (stream) {

                    stream
                        .getTracks()
                        .forEach(
                            (track) => {

                                try {

                                    track.stop();

                                } catch (error) {

                                    console.log(
                                        error
                                    );

                                }

                            }
                        );

                }

                videoElement.srcObject =
                    null;

            }

        };

    }, []);

    // ==========================================
    // FILTER PRODUCTS
    // ==========================================

    const filteredProducts =
        products.filter(
            (product) =>
                String(
                    product.product_name || ""
                )
                    .toLowerCase()
                    .includes(
                        search.toLowerCase()
                    )
        );

    // ==========================================
    // RENDER
    // ==========================================

    return (

        <div className="max-w-6xl mx-auto mt-8 bg-white shadow-lg rounded-xl p-6">

            {/* ==========================================
                TOAST
            ========================================== */}

            <Toast
                message={toast.message}
                type={toast.type}
                onClose={closeToast}
            />

            {/* ==========================================
                DELETE CONFIRMATION
            ========================================== */}

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

                            Delete Product?

                        </h2>

                        {/* MESSAGE */}

                        <p className="text-gray-500 text-center mt-2">

                            Are you sure you want to delete

                            <span className="font-bold text-gray-800">

                                {" "}
                                "{deleteConfirm.productName}"

                            </span>

                            ?

                        </p>

                        <p className="text-sm text-red-500 text-center mt-2">

                            This action cannot be undone.

                        </p>

                        {/* BUTTONS */}

                        <div className="flex gap-3 mt-6">

                            <button
                                type="button"
                                onClick={cancelDelete}
                                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg transition"
                            >

                                Cancel

                            </button>

                            <button
                                type="button"
                                onClick={deleteProduct}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg transition"
                            >

                                Delete

                            </button>

                        </div>

                    </div>

                </div>

            )}

            {/* ==========================================
                HEADER
            ========================================== */}

            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">

                <div>

                    <h1 className="text-3xl font-bold text-gray-800">

                        Product Management

                    </h1>

                    <p className="text-gray-500 mt-1">

                        Manage supermarket products and prices

                    </p>

                </div>

                {/* PRODUCT COUNT */}

                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg font-semibold">

                    {filteredProducts.length} Products

                </div>

            </div>

            {/* ==========================================
                SEARCH
            ========================================== */}

            <div className="mb-6">

                <div className="relative w-full md:w-96">

                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg">

                        🔍

                    </span>

                    <input
                        type="text"
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }
                        className="w-full border border-gray-300 rounded-lg pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {search && (

                        <button
                            type="button"
                            onClick={() =>
                                setSearch("")
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                            title="Clear Search"
                        >

                            ×

                        </button>

                    )}

                </div>

            </div>

            {/* ==========================================
                ADD / UPDATE PRODUCT
            ========================================== */}

            <div className="bg-gray-50 border rounded-xl p-5 mb-8">

                <h2 className="text-lg font-semibold text-gray-700 mb-4">

                    {editingId
                        ? "Edit Product"
                        : "Add New Product"}

                </h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                    {/* BARCODE */}

                    <div className="flex gap-2">

                        <input
                            type="text"
                            placeholder="Barcode"
                            value={barcode}
                            ref={barcodeInputRef}
                            onChange={(e) =>
                                handleBarcodeValue(
                                    e.target.value
                                )
                            }
                            onKeyDown={(e) => {

                                // USB barcode scanners
                                // commonly send Enter
                                // after the barcode.

                                if (
                                    e.key === "Enter"
                                ) {

                                    e.preventDefault();

                                    handleBarcodeValue(
                                        barcode
                                    );

                                }

                            }}
                            className="border rounded-lg px-3 py-2.5 flex-1 min-w-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        {/* CAMERA BUTTON */}

                        <button
                            type="button"
                            onClick={
                                startBarcodeScanner
                            }
                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg font-semibold transition"
                            title="Scan Barcode using Camera"
                        >

                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="21"
                                height="21"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >

                                <path d="M7 3H5a2 2 0 0 0-2 2v2" />

                                <path d="M17 3h2a2 2 0 0 1 2 2v2" />

                                <path d="M7 21H5a2 2 0 0 1-2-2v-2" />

                                <path d="M17 21h2a2 2 0 0 0 2-2v-2" />

                                <line
                                    x1="5"
                                    y1="12"
                                    x2="19"
                                    y2="12"
                                />

                            </svg>

                        </button>

                    </div>

                    {/* PRODUCT NAME */}

                    <input
                        type="text"
                        placeholder="Product Name"
                        value={productName}
                        onChange={(e) =>
                            setProductName(
                                e.target.value
                            )
                        }
                        className="border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {/* PRICE */}

                    <input
                        type="number"
                        placeholder="Price"
                        min="0.01"
                        step="0.01"
                        value={price}
                        onChange={(e) =>
                            setPrice(
                                e.target.value
                            )
                        }
                        className="border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {/* ADD / UPDATE BUTTON */}

                    <div className="flex gap-2">

                        <button
                            type="button"
                            onClick={addProduct}
                            className={`flex-1 text-white rounded-lg px-4 py-2.5 font-semibold transition ${
                                editingId
                                    ? "bg-blue-600 hover:bg-blue-700"
                                    : "bg-green-600 hover:bg-green-700"
                            }`}
                        >

                            {editingId
                                ? "Update Product"
                                : "Add Product"}

                        </button>

                        {editingId && (

                            <button
                                type="button"
                                onClick={cancelEdit}
                                className="bg-gray-500 hover:bg-gray-600 text-white rounded-lg px-4 py-2.5 font-semibold"
                            >

                                Cancel

                            </button>

                        )}

                    </div>

                </div>

                {/* HELPER TEXT */}

                <p className="text-xs text-gray-500 mt-3">

                    📷 Use the camera scanner, or connect a
                    USB barcode scanner and scan directly
                    into the Barcode field.

                </p>

            </div>

            {/* ==========================================
                PRODUCT TABLE
            ========================================== */}

            <div className="overflow-x-auto border border-gray-200 rounded-lg overflow-hidden">

                <table className="w-full border-collapse">

                    <thead className="bg-gray-100">

                        <tr>

                            <th className="border p-3 text-center">
                                Product
                            </th>

                            <th className="border p-3 text-center">
                                Price
                            </th>

                            <th className="border p-3 text-center">
                                Barcode
                            </th>

                            <th className="border p-3 text-center">
                                Action
                            </th>

                        </tr>

                    </thead>

                    <tbody>

                        {filteredProducts.length > 0 ? (

                            filteredProducts.map(
                                (product) => (

                                    <tr
                                        key={product.id}
                                        className="hover:bg-gray-50 transition"
                                    >

                                        <td className="border p-3 text-center font-medium">

                                            {product.product_name}

                                        </td>

                                        <td className="border p-3 text-center font-medium">

                                            ₹
                                            {Number(
                                                product.price
                                            ).toFixed(2)}

                                        </td>

                                        <td className="border p-3 text-center font-medium">

                                            {product.barcode ||
                                                "-"}

                                        </td>

                                        <td className="border p-3">

                                            <div className="flex justify-center gap-4">

                                                {/* EDIT */}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        editProduct(
                                                            product
                                                        )
                                                    }
                                                    className="text-blue-600 hover:text-blue-800 transition transform hover:scale-110"
                                                    title="Edit Product"
                                                    aria-label="Edit Product"
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
                                                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L12 15l-4 1 1-4 8.586-8.586z"
                                                        />

                                                    </svg>

                                                </button>

                                                {/* DELETE */}

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        confirmDeleteProduct(
                                                            product.id,
                                                            product.product_name
                                                        )
                                                    }
                                                    className="text-red-600 hover:text-red-800 transition transform hover:scale-110"
                                                    title="Delete Product"
                                                    aria-label="Delete Product"
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

                                )
                            )

                        ) : (

                            <tr>

                                <td
                                    colSpan="4"
                                    className="border p-8 text-center text-gray-500"
                                >

                                    {search
                                        ? `No products found for "${search}".`
                                        : "No products found."}

                                </td>

                            </tr>

                        )}

                    </tbody>

                </table>

            </div>

            {/* ==========================================
                CAMERA SCANNER MODAL
            ========================================== */}

            {showScanner && (

                <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">

                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

                        {/* HEADER */}

                        <div className="flex items-center justify-between p-4 border-b">

                            <div>

                                <h2 className="text-lg font-bold text-gray-800">

                                    Scan Product Barcode

                                </h2>

                                <p className="text-sm text-gray-500">

                                    Point your camera at the barcode

                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={
                                    stopBarcodeScanner
                                }
                                className="text-gray-500 hover:text-red-600 text-2xl"
                                title="Close Scanner"
                            >

                                ×

                            </button>

                        </div>

                        {/* CAMERA */}

                        <div className="relative bg-black">

                            <video
                                ref={videoRef}
                                className="w-full aspect-video object-cover bg-black"
                                autoPlay
                                muted
                                playsInline
                            />

                            {/* SCANNER FRAME */}

                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">

                                <div className="w-64 h-32 border-2 border-white rounded-lg relative">

                                    <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-red-500" />

                                </div>

                            </div>

                        </div>

                        {/* FOOTER */}

                        <div className="p-4">

                            <button
                                type="button"
                                onClick={
                                    stopBarcodeScanner
                                }
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition"
                            >

                                Cancel

                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

};

export default ProductManagement;