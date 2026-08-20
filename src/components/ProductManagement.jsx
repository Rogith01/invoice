import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import axios from "axios";

import {
    BrowserMultiFormatReader
} from "@zxing/browser";

import Toast from "./Toast";


const API_URL =
    "https://invoice-backend-78hd.onrender.com";


const ProductManagement = () => {

    // ==========================================
    // PRODUCTS
    // ==========================================

    const [products, setProducts] =
        useState([]);

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

    const barcodeBeepSoundRef =
        useRef(null);

    const barcodeErrorSoundRef =
        useRef(null);

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

        barcodeBeepSoundRef.current =
            new Audio("/barcode-beep.mp3");

        barcodeBeepSoundRef.current.volume =
            1.0;


        barcodeErrorSoundRef.current =
            new Audio("/barcode-error.mp3");

        barcodeErrorSoundRef.current.volume =
            1.0;


        successToneRef.current =
            new Audio("/success-tone.mp3");

        successToneRef.current.volume =
            1.0;


        errorToneRef.current =
            new Audio("/error-tone.mp3");

        errorToneRef.current.volume =
            1.0;


        return () => {

            if (
                barcodeBeepSoundRef.current
            ) {

                barcodeBeepSoundRef.current.pause();

                barcodeBeepSoundRef.current =
                    null;

            }


            if (
                barcodeErrorSoundRef.current
            ) {

                barcodeErrorSoundRef.current.pause();

                barcodeErrorSoundRef.current =
                    null;

            }


            if (
                successToneRef.current
            ) {

                successToneRef.current.pause();

                successToneRef.current =
                    null;

            }


            if (
                errorToneRef.current
            ) {

                errorToneRef.current.pause();

                errorToneRef.current =
                    null;

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
    // PLAY SUCCESS TONE
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
    // PLAY ERROR TONE
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


        if (
            type === "success"
        ) {

            playSuccessTone();

        }


        else if (
            type === "error"
        ) {

            playErrorTone();

        }


        else if (
            type === "warning"
        ) {

            playErrorTone();

        }

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
                        `${API_URL}/api/products`
                    );


                if (
                    res.data.success
                ) {

                    setProducts(
                        res.data.products
                    );

                }

                else {

                    showToast(
                        res.data.message ||
                            "Failed to load products.",
                        "error"
                    );

                }

            }

            catch (err) {

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

    const editProduct = (
        product
    ) => {

        setEditingId(
            product.id
        );

        setProductName(
            product.product_name
        );

        setPrice(
            product.price
        );

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


        if (!id) {

            return;

        }


        try {

            const res =
                await axios.delete(
                    `${API_URL}/api/products/${id}`
                );


            if (
                res.data.success
            ) {

                await fetchProducts();

                showToast(
                    `"${productName}" deleted successfully.`,
                    "success"
                );

            }

            else {

                showToast(
                    res.data.message ||
                        "Failed to delete product.",
                    "error"
                );

            }

        }

        catch (err) {

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

        if (
            !productName.trim() ||
            Number(price) <= 0
        ) {

            showToast(
                "Enter a valid Product Name and Price.",
                "warning"
            );

            return;

        }


        const cleanBarcode =
            barcode.trim();


        if (!cleanBarcode) {

            showToast(
                "Please enter or scan a barcode.",
                "warning"
            );

            return;

        }


        const existingProduct =
            isDuplicateBarcode(
                cleanBarcode
            );


        if (existingProduct) {

            playBarcodeErrorSound();

            showToast(
                `Barcode already exists for "${existingProduct.product_name}".`,
                "warning"
            );

            return;

        }


        if (editingId) {

            try {

                const res =
                    await axios.put(
                        `${API_URL}/api/products/${editingId}`,
                        {
                            productName:
                                productName.trim(),

                            price,

                            barcode:
                                cleanBarcode,
                        }
                    );


                if (
                    res.data.success
                ) {

                    await fetchProducts();

                    setEditingId(null);

                    setProductName("");

                    setPrice("");

                    setBarcode("");


                    showToast(
                        "Product updated successfully!",
                        "success"
                    );

                }

                else {

                    showToast(
                        res.data.message ||
                            "Failed to update product.",
                        "error"
                    );

                }

            }

            catch (err) {

                console.log(err);

                showToast(
                    err.response?.data?.message ||
                        "Failed to update product. Please try again.",
                    "error"
                );

            }


            return;

        }


        try {

            const res =
                await axios.post(
                    `${API_URL}/api/products`,
                    {
                        productName:
                            productName.trim(),

                        price,

                        barcode:
                            cleanBarcode,
                    }
                );


            if (
                res.data.success
            ) {

                await fetchProducts();

                setProductName("");

                setPrice("");

                setBarcode("");


                showToast(
                    "Product added successfully!",
                    "success"
                );


                setTimeout(() => {

                    barcodeInputRef.current?.focus();

                }, 100);

            }

            else {

                showToast(
                    res.data.message ||
                        "Failed to add product.",
                    "error"
                );

            }

        }

        catch (err) {

            console.log(err);


            if (
                err.response?.data?.message
            ) {

                playBarcodeErrorSound();

                showToast(
                    err.response.data.message,
                    "warning"
                );

            }

            else {

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

                }

                catch (error) {

                    console.log(
                        "Scanner controls stop error:",
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

                }

                catch (error) {

                    console.log(
                        "Scanner reset error:",
                        error
                    );

                }


                codeReaderRef.current =
                    null;

            }


            if (
                videoRef.current
            ) {

                const stream =
                    videoRef.current.srcObject;


                if (stream) {

                    stream
                        .getTracks()
                        .forEach(
                            (track) => {

                                try {

                                    track.stop();

                                }

                                catch (error) {

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

            if (
                scannerStartingRef.current
            ) {

                return;

            }


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

                            const codeReader =
                                new BrowserMultiFormatReader();


                            codeReaderRef.current =
                                codeReader;


                            const controls =
                                await codeReader.decodeFromVideoDevice(
                                    undefined,
                                    videoRef.current,
                                    (
                                        result,
                                        error
                                    ) => {

                                        if (
                                            sessionId !==
                                            scannerSessionRef.current
                                        ) {

                                            return;

                                        }


                                        if (
                                            barcodeScanLockRef.current
                                        ) {

                                            return;

                                        }


                                        if (
                                            !result
                                        ) {

                                            return;

                                        }


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


                                        const existingProduct =
                                            isDuplicateBarcode(
                                                scannedBarcode
                                            );


                                        if (
                                            existingProduct
                                        ) {

                                            playBarcodeErrorSound();


                                            showToast(
                                                `Barcode already exists for "${existingProduct.product_name}".`,
                                                "warning"
                                            );


                                            setBarcode("");

                                        }

                                        else {

                                            setBarcode(
                                                scannedBarcode
                                            );


                                            playBarcodeSuccessSound();


                                            showToast(
                                                "Barcode scanned successfully.",
                                                "info"
                                            );

                                        }


                                        stopBarcodeScanner();


                                        setTimeout(
                                            () => {

                                                barcodeInputRef.current?.focus();

                                            },
                                            100
                                        );

                                    }
                                );


                            if (
                                sessionId !==
                                scannerSessionRef.current
                            ) {

                                try {

                                    controls.stop();

                                }

                                catch (error) {

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

                        }

                        catch (error) {

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

                }

                catch (error) {

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

                }

                catch (error) {

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

                                }

                                catch (error) {

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

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

            <Toast
                message={toast.message}
                type={toast.type}
                onClose={closeToast}
            />


            {/* ==========================================
                DELETE MODAL
            ========================================== */}

            {deleteConfirm.show && (

                <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">

                    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

                        <div className="p-6">

                            <div className="flex justify-center mb-5">

                                <div className="w-14 h-14 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">

                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-7 h-7 text-red-600"
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


                            <h2 className="text-xl font-bold text-slate-800 text-center">

                                Delete Product?

                            </h2>


                            <p className="text-sm text-slate-500 text-center mt-2 leading-6">

                                Are you sure you want to delete

                                <span className="font-semibold text-slate-800">

                                    {" "}
                                    "{deleteConfirm.productName}"

                                </span>
                                ?

                            </p>


                            <p className="text-xs text-red-500 text-center mt-2">

                                This action cannot be undone.

                            </p>


                            <div className="grid grid-cols-2 gap-3 mt-6">

                                <button
                                    type="button"
                                    onClick={cancelDelete}
                                    className="h-11 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition"
                                >

                                    Cancel

                                </button>


                                <button
                                    type="button"
                                    onClick={deleteProduct}
                                    className="h-11 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition"
                                >

                                    Delete

                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            )}


            {/* ==========================================
                PAGE HEADER
            ========================================== */}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

                <div>

                    <div className="flex items-center gap-3">

                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shadow-sm">

                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-5 h-5 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >

                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M20 7l-8-4-8 4m16 0v10l-8 4-8-4V7m16 0l-8 4m-8-4l8 4m0 0v10"
                                />

                            </svg>

                        </div>


                        <div>

                            <h1 className="text-2xl font-bold text-slate-800">

                                Product Management

                            </h1>

                            <p className="text-sm text-slate-500 mt-0.5">

                                Manage products, prices and barcodes

                            </p>

                        </div>

                    </div>

                </div>


                {/* PRODUCT COUNT */}

                <div className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm">

                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>

                    <span className="text-sm font-semibold text-slate-700">

                        {filteredProducts.length} Products

                    </span>

                </div>

            </div>


            {/* ==========================================
                MAIN CARD
            ========================================== */}

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">


                {/* ==========================================
                    SEARCH HEADER
                ========================================== */}

                <div className="px-5 sm:px-6 py-5 border-b border-slate-200">

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                        <div>

                            <h2 className="text-base font-semibold text-slate-800">

                                Products

                            </h2>

                            <p className="text-xs text-slate-500 mt-1">

                                Search and manage your supermarket products

                            </p>

                        </div>


                        <div className="relative w-full sm:w-80">

                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >

                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M21 21l-4.35-4.35m1.35-5.65a7 7 0 11-14 0 7 7 0 0114 0z"
                                />

                            </svg>


                            <input
                                type="text"
                                placeholder="Search products..."
                                value={search}
                                onChange={(e) =>
                                    setSearch(
                                        e.target.value
                                    )
                                }
                                className="w-full h-10 pl-9 pr-9 border border-slate-300 rounded-lg bg-slate-50 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition"
                            />


                            {search && (

                                <button
                                    type="button"
                                    onClick={() =>
                                        setSearch("")
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-lg transition"
                                    title="Clear Search"
                                >

                                    ×

                                </button>

                            )}

                        </div>

                    </div>

                </div>


                {/* ==========================================
                    ADD / UPDATE SECTION
                ========================================== */}

                <div className="p-5 sm:p-6 bg-slate-50/70 border-b border-slate-200">

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">

                        <div>

                            <h3 className="text-sm font-bold text-slate-800">

                                {editingId
                                    ? "Edit Product"
                                    : "Add New Product"}

                            </h3>

                            <p className="text-xs text-slate-500 mt-1">

                                {editingId
                                    ? "Update the selected product details."
                                    : "Add a new product to your inventory."}

                            </p>

                        </div>


                        {editingId && (

                            <span className="inline-flex items-center self-start px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold">

                                Editing Product

                            </span>

                        )}

                    </div>


                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">


                        {/* BARCODE */}

                        <div>

                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">

                                Barcode

                            </label>

                            <div className="flex gap-2">

                                <input
                                    type="text"
                                    placeholder="Scan or enter barcode"
                                    value={barcode}
                                    ref={barcodeInputRef}
                                    onChange={(e) =>
                                        handleBarcodeValue(
                                            e.target.value
                                        )
                                    }
                                    onKeyDown={(e) => {

                                        if (
                                            e.key === "Enter"
                                        ) {

                                            e.preventDefault();

                                            handleBarcodeValue(
                                                barcode
                                            );

                                        }

                                    }}
                                    className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition"
                                />


                                <button
                                    type="button"
                                    onClick={
                                        startBarcodeScanner
                                    }
                                    className="w-11 h-10 shrink-0 flex items-center justify-center bg-slate-800 hover:bg-slate-900 text-white rounded-lg transition shadow-sm"
                                    title="Scan Barcode using Camera"
                                >

                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="19"
                                        height="19"
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

                        </div>


                        {/* PRODUCT NAME */}

                        <div>

                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">

                                Product Name

                            </label>

                            <input
                                type="text"
                                placeholder="Enter product name"
                                value={productName}
                                onChange={(e) =>
                                    setProductName(
                                        e.target.value
                                    )
                                }
                                className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition"
                            />

                        </div>


                        {/* PRICE */}

                        <div>

                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">

                                Price

                            </label>

                            <div className="relative">

                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">

                                    ₹

                                </span>

                                <input
                                    type="number"
                                    placeholder="0.00"
                                    min="0.01"
                                    step="0.01"
                                    value={price}
                                    onChange={(e) =>
                                        setPrice(
                                            e.target.value
                                        )
                                    }
                                    className="w-full h-10 pl-7 pr-3 border border-slate-300 rounded-lg bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition"
                                />

                            </div>

                        </div>


                        {/* ACTIONS */}

                        <div>

                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">

                                Action

                            </label>

                            <div className="flex gap-2">

                                <button
                                    type="button"
                                    onClick={addProduct}
                                    className="flex-1 h-10 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-semibold transition shadow-sm"
                                >

                                    {editingId
                                        ? "Update Product"
                                        : "Add Product"}

                                </button>


                                {editingId && (

                                    <button
                                        type="button"
                                        onClick={cancelEdit}
                                        className="h-10 px-4 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold transition"
                                    >

                                        Cancel

                                    </button>

                                )}

                            </div>

                        </div>

                    </div>


                    <div className="flex items-start gap-2 mt-4 text-xs text-slate-500">

                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-4 h-4 shrink-0 mt-0.5 text-slate-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >

                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
                            />

                        </svg>

                        <span>

                            Use the camera scanner or connect a USB barcode scanner and scan directly into the Barcode field.

                        </span>

                    </div>

                </div>


                {/* ==========================================
                    TABLE
                ========================================== */}

                <div className="overflow-x-auto">

                    <table className="w-full min-w-[700px]">

                        <thead>

                            <tr className="bg-slate-50 border-b border-slate-200">

                                <th className="px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                    Product

                                </th>

                                <th className="px-5 py-3.5 text-left text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                    Price

                                </th>

                                <th className="px-5 py-3.5 text-left text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                    Barcode

                                </th>

                                <th className="px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                    Action

                                </th>

                            </tr>

                        </thead>


                        <tbody className="divide-y divide-slate-100">

                            {filteredProducts.length > 0 ? (

                                filteredProducts.map(
                                    (product) => (

                                        <tr
                                            key={product.id}
                                            className="hover:bg-slate-50/80 transition"
                                        >

                                            {/* PRODUCT */}

                                            <td className="px-5 py-4 text-center">

                                                <div className="flex items-center gap-3">

                                                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">

                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className="w-4 h-4 text-slate-500"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >

                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M20 7l-8-4-8 4m16 0v10l-8 4-8-4V7m16 0l-8 4m0 0L4 7"
                                                            />

                                                        </svg>

                                                    </div>


                                                    <span className="text-sm font-semibold text-slate-800">

                                                        {product.product_name}

                                                    </span>

                                                </div>

                                            </td>


                                            {/* PRICE */}

                                            <td className="px-5 py-4">

                                                <span className="text-sm font-semibold text-slate-800">

                                                    ₹
                                                    {Number(
                                                        product.price
                                                    ).toFixed(2)}

                                                </span>

                                            </td>


                                            {/* BARCODE */}

                                            <td className="px-5 py-4">

                                                {product.barcode ? (

                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-mono">

                                                        {product.barcode}

                                                    </span>

                                                ) : (

                                                    <span className="text-sm text-slate-400">

                                                        —

                                                    </span>

                                                )}

                                            </td>


                                            {/* ACTION */}

                                            <td className="px-5 py-4">

                                                <div className="flex justify-center items-center gap-2">

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            editProduct(
                                                                product
                                                            )
                                                        }
                                                        className="w-9 h-9 flex items-center justify-center rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition"
                                                        title="Edit Product"
                                                        aria-label="Edit Product"
                                                    >

                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className="w-[18px] h-[18px]"
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


                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            confirmDeleteProduct(
                                                                product.id,
                                                                product.product_name
                                                            )
                                                        }
                                                        className="w-9 h-9 flex items-center justify-center rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition"
                                                        title="Delete Product"
                                                        aria-label="Delete Product"
                                                    >

                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className="w-[18px] h-[18px]"
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
                                        className="px-5 py-14 text-center"
                                    >

                                        <div className="flex flex-col items-center">

                                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">

                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="w-6 h-6 text-slate-400"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >

                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M20 7l-8-4-8 4m16 0v10l-8 4-8-4V7m16 0l-8 4m0 0L4 7"
                                                    />

                                                </svg>

                                            </div>


                                            <p className="text-sm font-semibold text-slate-600">

                                                {search
                                                    ? `No products found for "${search}".`
                                                    : "No products found."}

                                            </p>


                                            <p className="text-xs text-slate-400 mt-1">

                                                {search
                                                    ? "Try a different search term."
                                                    : "Add your first product above."}

                                            </p>

                                        </div>

                                    </td>

                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>


                {/* ==========================================
                    TABLE FOOTER
                ========================================== */}

                {filteredProducts.length > 0 && (

                    <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">

                        <p className="text-xs text-slate-500">

                            Showing

                            <span className="font-semibold text-slate-700">

                                {" "}
                                {filteredProducts.length}

                            </span>

                            {" "}product
                            {filteredProducts.length !== 1
                                ? "s"
                                : ""}

                        </p>

                        {search && (

                            <button
                                type="button"
                                onClick={() =>
                                    setSearch("")
                                }
                                className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
                            >

                                Clear search

                            </button>

                        )}

                    </div>

                )}

            </div>


            {/* ==========================================
                CAMERA SCANNER MODAL
            ========================================== */}

            {showScanner && (

                <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">

                    <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">


                        {/* HEADER */}

                        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">

                            <div className="flex items-center gap-3">

                                <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center">

                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-5 h-5 text-white"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >

                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 8l2-3h4l2 3h4l2-3h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"
                                        />

                                        <circle
                                            cx="12"
                                            cy="13"
                                            r="3"
                                        />

                                    </svg>

                                </div>


                                <div>

                                    <h2 className="text-sm font-bold text-slate-800">

                                        Scan Product Barcode

                                    </h2>

                                    <p className="text-xs text-slate-500 mt-0.5">

                                        Position the barcode inside the frame

                                    </p>

                                </div>

                            </div>


                            <button
                                type="button"
                                onClick={
                                    stopBarcodeScanner
                                }
                                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 text-xl transition"
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


                            {/* DARK OVERLAY */}

                            <div className="absolute inset-0 pointer-events-none">

                                <div className="absolute inset-0 bg-black/10"></div>


                                {/* SCANNER FRAME */}

                                <div className="absolute inset-0 flex items-center justify-center">

                                    <div className="relative w-72 h-36 border-2 border-white/90 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]">

                                        <div className="absolute -top-[2px] -left-[2px] w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg"></div>

                                        <div className="absolute -top-[2px] -right-[2px] w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg"></div>

                                        <div className="absolute -bottom-[2px] -left-[2px] w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg"></div>

                                        <div className="absolute -bottom-[2px] -right-[2px] w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg"></div>


                                        <div className="absolute left-2 right-2 top-1/2 h-px bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.9)]"></div>

                                    </div>

                                </div>

                            </div>

                        </div>


                        {/* FOOTER */}

                        <div className="p-4 bg-slate-50 border-t border-slate-200">

                            <button
                                type="button"
                                onClick={
                                    stopBarcodeScanner
                                }
                                className="w-full h-11 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-semibold transition"
                            >

                                Cancel Scanner

                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

};


export default ProductManagement;