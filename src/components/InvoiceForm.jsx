import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
} from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import axios from "axios";
import { uid } from "uid";
import InvoiceItem from "./InvoiceItem";
import InvoiceModal from "./InvoiceModal";
import Toast from "./Toast";
import "../index.css";

const date = new Date();

const today = date.toLocaleDateString("en-GB", {
    month: "numeric",
    day: "numeric",
    year: "numeric",
});

const InvoiceForm = () => {

    // ==========================================
    // INVOICE STATES
    // ==========================================

    const [isOpen, setIsOpen] = useState(false);

    const [discount, setDiscount] = useState("2");

    const [tax, setTax] = useState("5");

    const [invoiceNumber, setInvoiceNumber] =
        useState("INV-0001");

    const user = JSON.parse(
        sessionStorage.getItem("user")
    );

    const [cashierName, setCashierName] = useState(
        user?.username || ""
    );

    const [customerName, setCustomerName] =
        useState("");

    const [phoneNumber, setPhoneNumber] =
        useState("");

    // ==========================================
    // LOYALTY STATES
    // ==========================================

    const [loyaltyPoints, setLoyaltyPoints] =
        useState(0);

    const [redeemPoints, setRedeemPoints] =
        useState(false);

    const [availablePoints, setAvailablePoints] =
        useState(0);

    // ==========================================
    // FREEZE VALUES FOR REVIEW INVOICE MODAL
    // ==========================================

    const [redeemedAmount, setRedeemedAmount] =
        useState(0);

    const [reviewTotal, setReviewTotal] =
        useState(0);

    // ==========================================
    // PAYMENT
    // ==========================================

    const [paymentMethod, setPaymentMethod] =
        useState("Cash");

    // ==========================================
    // PRODUCTS
    // ==========================================

    const [itemOptions, setItemOptions] =
        useState([]);

    // ==========================================
    // BARCODE INPUT
    // ==========================================

    const [barcode, setBarcode] =
        useState("");

    const barcodeInputRef = useRef(null);
    const scanSoundRef = useRef(null);

useEffect(() => {
    scanSoundRef.current = new Audio("/barcode-beep.mp3");
    scanSoundRef.current.volume = 1.0;
}, []);

    // ==========================================
    // CAMERA SCANNER
    // ==========================================

    const [showScanner, setShowScanner] =
        useState(false);

    const videoRef = useRef(null);

    const codeReaderRef = useRef(null);

    // IMPORTANT:
    // Stores ZXing scanner controls returned by
    // decodeFromVideoDevice().
    const scannerControlsRef = useRef(null);

    // IMPORTANT:
    // Stores timeout used while starting scanner.
    // This prevents old scanner startup callbacks.
    const scannerTimeoutRef = useRef(null);

    // IMPORTANT:
    // Every time a new scanner starts, this number
    // changes. Old callbacks are then ignored.
    const scannerSessionRef = useRef(0);

    // Prevent clicking Scan Barcode multiple times
    // while scanner is starting.
    const scannerStartingRef = useRef(false);

    // Prevent multiple results from the SAME
    // scanner session.
    const barcodeScanLockRef = useRef(true);

    // ==========================================
    // REVIEW BUTTON REF
    // ==========================================

    const reviewBtnRef = useRef(null);

    // ==========================================
    // CURRENT TIME
    // ==========================================

    const [currentTime, setCurrentTime] =
        useState(
            new Date().toLocaleTimeString(
                "en-GB",
                {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                }
            )
        );

    // ==========================================
    // ITEMS
    // ==========================================

    const [items, setItems] = useState([
        {
            id: uid(6),
            name: "",
            qty: 1,
            price: "0.00",
            amount: 0,
        },
    ]);

    // ==========================================
    // TOAST
    // ==========================================

    const [toast, setToast] = useState({
        message: "",
        type: "success",
    });

    // ==========================================
    // SHOW TOAST
    // ==========================================

    const showToast = useCallback(
        (message, type = "success") => {

            setToast({
                message,
                type,
            });

        },
        []
    );

    // ==========================================
    // CLOSE TOAST
    // ==========================================

    const closeToast = useCallback(() => {

        setToast({
            message: "",
            type: "success",
        });

    }, []);

    // ==========================================
    // FETCH CUSTOMER
    // ==========================================

    const fetchCustomer = async (phone) => {

        if (phone.length !== 10) {
            return;
        }

        try {

            const res = await axios.get(
                `https://invoice-backend-78hd.onrender.com/api/customer/${phone}`
            );

            if (res.data.success) {

                setCustomerName(
                    res.data.customer.customer_name
                );

                setLoyaltyPoints(
                    Number(
                        res.data.customer.loyalty_points || 0
                    )
                );

                setAvailablePoints(
                    Number(
                        res.data.customer.loyalty_points || 0
                    )
                );

                showToast(
                    `Customer "${res.data.customer.customer_name}" found successfully.`,
                    "success"
                );

            } else {

                setCustomerName("");

                setLoyaltyPoints(0);

                setAvailablePoints(0);

                setRedeemPoints(false);

                showToast(
                    "Customer not found. You can continue as a new customer.",
                    "info"
                );
            }

        } catch (err) {

            console.log(
                "Customer Fetch Error:",
                err
            );

            setCustomerName("");

            setLoyaltyPoints(0);

            setAvailablePoints(0);

            setRedeemPoints(false);

            showToast(
                "Unable to find customer.",
                "error"
            );
        }
    };

    // ==========================================
    // FETCH PRODUCTS
    // ==========================================

    const fetchProducts = useCallback(async () => {

        try {

            const res = await axios.get(
                "https://invoice-backend-78hd.onrender.com/api/products"
            );

            if (res.data.success) {

                const products =
                    res.data.products.map((p) => ({
                        id: p.id,

                        name: p.product_name,

                        price: Number(p.price),

                        stock:
                            Number(
                                p.stock_quantity
                            ) || 0,

                        barcode:
                            p.barcode || "",
                    }));

                setItemOptions(products);
            }

        } catch (err) {

            console.error(
                "Error fetching products:",
                err
            );

            showToast(
                "Failed to load products.",
                "error"
            );
        }

    }, [showToast]);

    // ==========================================
    // FETCH NEXT INVOICE NUMBER
    // ==========================================

    const fetchInvoiceNumber = useCallback(async () => {

        try {

            const response =
                await axios.get(
                    "https://invoice-backend-78hd.onrender.com/api/next-invoice-number"
                );

            if (response.data.success) {

                setInvoiceNumber(
                    response.data.invoiceNumber
                );
            }

        } catch (error) {

            console.error(
                "Error fetching invoice number:",
                error
            );

            showToast(
                "Failed to generate invoice number.",
                "error"
            );
        }

    }, [showToast]);

    // ==========================================
    // INITIAL LOAD
    // ==========================================

    useEffect(() => {

        fetchInvoiceNumber();

        fetchProducts();

        const handleShortcut = (event) => {

            if (event.key === "F4") {

                event.preventDefault();

                reviewBtnRef.current?.click();
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
        fetchInvoiceNumber,
        fetchProducts,
    ]);

    // ==========================================
    // STOP / CLEAN CAMERA SCANNER
    // ==========================================

    const stopBarcodeScanner = useCallback(() => {

        console.log(
            "Stopping barcode scanner..."
        );

        // ==========================================
        // INVALIDATE CURRENT SCANNER SESSION
        // ==========================================

        scannerSessionRef.current += 1;

        // Do not accept any more results
        barcodeScanLockRef.current = true;

        // Scanner is no longer starting
        scannerStartingRef.current = false;

        // ==========================================
        // CANCEL PENDING START TIMEOUT
        // ==========================================

        if (scannerTimeoutRef.current) {

            clearTimeout(
                scannerTimeoutRef.current
            );

            scannerTimeoutRef.current = null;
        }

        // ==========================================
        // STOP ZXING CONTROLS
        // ==========================================

        if (scannerControlsRef.current) {

            try {

                scannerControlsRef.current.stop();

            } catch (error) {

                console.log(
                    "ZXing controls stop error:",
                    error
                );
            }

            scannerControlsRef.current = null;
        }

        // ==========================================
        // RESET ZXING READER
        // ==========================================

        if (codeReaderRef.current) {

            try {

                codeReaderRef.current.reset();

            } catch (error) {

                console.log(
                    "ZXing reader reset error:",
                    error
                );
            }

            codeReaderRef.current = null;
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
                    .forEach((track) => {

                        try {
                            track.stop();
                        } catch (error) {
                            console.log(error);
                        }

                    });
            }

            videoRef.current.srcObject = null;
        }

        // ==========================================
        // CLOSE CAMERA MODAL
        // ==========================================

        setShowScanner(false);

    }, []);

    // ==========================================
    // START CAMERA BARCODE SCANNER
    // ==========================================

    const startBarcodeScanner = async () => {

        // ==========================================
        // PREVENT DOUBLE CLICK WHILE STARTING
        // ==========================================

        if (scannerStartingRef.current) {

            console.log(
                "Scanner is already starting."
            );

            return;
        }

        // ==========================================
        // IF OLD SCANNER EXISTS, CLEAN IT FIRST
        // ==========================================

        if (
            codeReaderRef.current ||
            scannerControlsRef.current ||
            scannerTimeoutRef.current
        ) {

            stopBarcodeScanner();

            // Give browser a moment to release camera
            await new Promise((resolve) =>
                setTimeout(resolve, 100)
            );
        }

        // ==========================================
        // CREATE NEW SCANNER SESSION
        // ==========================================

        const sessionId =
            scannerSessionRef.current + 1;

        scannerSessionRef.current =
            sessionId;

        scannerStartingRef.current = true;

        // Allow ONE scan for this session
        barcodeScanLockRef.current = false;

        setShowScanner(true);

        console.log(
            "Starting scanner session:",
            sessionId
        );

        // ==========================================
        // WAIT FOR VIDEO ELEMENT
        // ==========================================

        scannerTimeoutRef.current =
            setTimeout(async () => {

                scannerTimeoutRef.current =
                    null;

                // Check whether this scanner session
                // is still valid.
                if (
                    sessionId !==
                    scannerSessionRef.current
                ) {

                    console.log(
                        "Old scanner session ignored."
                    );

                    scannerStartingRef.current =
                        false;

                    return;
                }

                if (!videoRef.current) {

                    console.error(
                        "Video element not found."
                    );

                    scannerStartingRef.current =
                        false;

                    barcodeScanLockRef.current =
                        true;

                    setShowScanner(false);

                    showToast(
                        "Camera could not be started.",
                        "error"
                    );

                    return;
                }

                try {

                    // ==========================================
                    // CREATE COMPLETELY NEW ZXING READER
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
                            (result, error) => {

                                // ==========================================
                                // IGNORE OLD SCANNER SESSION
                                // ==========================================

                                if (
                                    sessionId !==
                                    scannerSessionRef.current
                                ) {

                                    console.log(
                                        "Ignoring old scanner callback."
                                    );

                                    return;
                                }

                                // ==========================================
                                // IGNORE IF ALREADY SCANNED
                                // ==========================================

                                if (
                                    barcodeScanLockRef.current
                                ) {

                                    return;
                                }

                                // ==========================================
                                // NO RESULT
                                // ==========================================

                                if (!result) {

                                    return;
                                }

                                // ==========================================
                                // LOCK IMMEDIATELY
                                // ==========================================

                                barcodeScanLockRef.current =
                                    true;

                                const scannedBarcode =
                                    result
                                        .getText()
                                        .trim();

                                console.log(
                                    "Barcode scanned:",
                                    scannedBarcode
                                );

                                // ==========================================
                                // PROCESS EXACTLY ONE SCAN
                                // ==========================================

                                handleBarcodeScan(
                                    scannedBarcode
                                );

                                // ==========================================
                                // STOP CAMERA IMMEDIATELY
                                // ==========================================

                                stopBarcodeScanner();
                            }
                        );

                    // ==========================================
                    // CHECK IF SCANNER WAS STOPPED WHILE
                    // ZXING WAS INITIALIZING
                    // ==========================================

                    if (
                        sessionId !==
                        scannerSessionRef.current
                    ) {

                        console.log(
                            "Scanner became outdated while starting."
                        );

                        try {
                            controls.stop();
                        } catch (error) {
                            console.log(error);
                        }

                        scannerStartingRef.current =
                            false;

                        return;
                    }

                    scannerControlsRef.current =
                        controls;

                    scannerStartingRef.current =
                        false;

                    console.log(
                        "Scanner started successfully:",
                        sessionId
                    );

                } catch (error) {

                    console.error(
                        "ZXing Scanner Error:",
                        error
                    );

                    // ==========================================
                    // ONLY SHOW ERROR IF THIS IS STILL
                    // THE CURRENT SESSION
                    // ==========================================

                    if (
                        sessionId ===
                        scannerSessionRef.current
                    ) {

                        barcodeScanLockRef.current =
                            true;

                        scannerStartingRef.current =
                            false;

                        showToast(
                            "Unable to start camera. Please allow camera permission and try again.",
                            "error"
                        );

                        stopBarcodeScanner();
                    }

                }

            }, 300);
    };

    // ==========================================
    // CLEAN CAMERA WHEN COMPONENT UNMOUNTS
    // ==========================================

useEffect(() => {

    // Capture the video element when this effect runs.
    // This prevents the React Hooks cleanup warning.
    const videoElement = videoRef.current;

    return () => {

        // ==========================================
        // INVALIDATE CURRENT SCANNER
        // ==========================================

        scannerSessionRef.current += 1;

        barcodeScanLockRef.current = true;

        scannerStartingRef.current = false;

        // ==========================================
        // CANCEL PENDING TIMEOUT
        // ==========================================

        if (scannerTimeoutRef.current) {

            clearTimeout(
                scannerTimeoutRef.current
            );

            scannerTimeoutRef.current = null;
        }

        // ==========================================
        // STOP ZXING CONTROLS
        // ==========================================

        if (scannerControlsRef.current) {

            try {

                scannerControlsRef.current.stop();

            } catch (error) {

                console.log(
                    "ZXing controls stop error:",
                    error
                );

            }

            scannerControlsRef.current = null;
        }

        // ==========================================
        // RESET ZXING READER
        // ==========================================

        if (codeReaderRef.current) {

            try {

                codeReaderRef.current.reset();

            } catch (error) {

                console.log(
                    "ZXing reader reset error:",
                    error
                );

            }

            codeReaderRef.current = null;
        }

        // ==========================================
        // STOP CAMERA STREAM
        // ==========================================

        if (videoElement) {

            const stream =
                videoElement.srcObject;

            if (stream) {

                stream
                    .getTracks()
                    .forEach((track) => {

                        try {

                            track.stop();

                        } catch (error) {

                            console.log(
                                "Camera track stop error:",
                                error
                            );

                        }

                    });

            }

            videoElement.srcObject = null;
        }

    };

}, []);
    // ==========================================
    // AUTO FOCUS BARCODE INPUT
    // ==========================================

    useEffect(() => {

        barcodeInputRef.current?.focus();

    }, []);

    // ==========================================
    // CURRENT TIME
    // ==========================================

    useEffect(() => {

        const timer =
            setInterval(() => {

                setCurrentTime(
                    new Date().toLocaleTimeString(
                        "en-GB",
                        {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                        }
                    )
                );

            }, 1000);

        return () =>
            clearInterval(timer);

    }, []);

    // ==========================================
    // CALCULATIONS
    // ==========================================

    const subtotal = items.reduce(
        (prev, curr) => {

            if (
                curr.name &&
                curr.name.trim().length > 0
            ) {

                return (
                    prev +
                    Number(curr.price || 0) *
                        Math.floor(
                            Number(curr.qty || 0)
                        )
                );
            }

            return prev;

        },
        0
    );

    const taxRate =
        (Number(tax || 0) * subtotal) / 100;

    const discountRate =
        (Number(discount || 0) * subtotal) / 100;

    const loyaltyDiscount =
        redeemPoints
            ? Number(availablePoints || 0)
            : 0;

    const total =
        subtotal -
        discountRate -
        loyaltyDiscount +
        taxRate;

    // ==========================================
    // REVIEW INVOICE
    // ==========================================

    const reviewInvoiceHandler = async (event) => {

        event.preventDefault();

        // ==========================================
        // CUSTOMER NAME VALIDATION
        // ==========================================

        if (
            !customerName ||
            customerName.trim().length === 0
        ) {

            showToast(
                "Please enter customer name.",
                "warning"
            );

            return;
        }

        // ==========================================
        // PHONE VALIDATION
        // ==========================================

        if (
            !phoneNumber ||
            phoneNumber.trim().length === 0
        ) {

            showToast(
                "Please enter phone number.",
                "warning"
            );

            return;
        }

        if (phoneNumber.length !== 10) {

            showToast(
                "Please enter a valid 10-digit phone number.",
                "warning"
            );

            return;
        }

        // ==========================================
        // PRODUCT VALIDATION
        // ==========================================

        const validItems = items.filter(
            (item) =>
                item.name &&
                item.name.trim().length > 0
        );

        if (validItems.length === 0) {

            showToast(
                "Please add at least one product to the invoice.",
                "warning"
            );

            return;
        }

        if (total < 0) {

            showToast(
                "Invoice total cannot be negative.",
                "warning"
            );

            return;
        }

        // ==========================================
        // CHECK STOCK
        // ==========================================

        for (const item of validItems) {

            const product =
                itemOptions.find(
                    (opt) =>
                        opt.name === item.name
                );

            if (!product) {

                showToast(
                    `${item.name} is not available.`,
                    "error"
                );

                return;
            }

            const requestedQty =
                Math.floor(
                    Number(item.qty || 0)
                );

            if (requestedQty <= 0) {

                showToast(
                    `Please enter a valid quantity for ${item.name}.`,
                    "warning"
                );

                return;
            }

            if (
                requestedQty >
                Number(product.stock || 0)
            ) {

                showToast(
                    `Only ${product.stock} stock available for ${item.name}.`,
                    "warning"
                );

                return;
            }
        }

        // ==========================================
        // FREEZE LOYALTY DISCOUNT
        // ==========================================

        const invoiceLoyaltyDiscount =
            redeemPoints
                ? Number(availablePoints || 0)
                : 0;

        // ==========================================
        // FINAL TOTAL
        // ==========================================

        const invoiceTotal =
            subtotal -
            discountRate -
            invoiceLoyaltyDiscount +
            taxRate;

        // ==========================================
        // FINAL ITEMS
        // ==========================================

        const invoiceItems =
            validItems.map((item) => {

                const itemQty =
                    Math.floor(
                        Number(item.qty || 0)
                    );

                const itemPrice =
                    Number(item.price || 0);

                const itemAmount =
                    itemPrice * itemQty;

                return {
                    ...item,
                    qty: itemQty,
                    price: itemPrice,
                    amount: itemAmount,
                };
            });

        // ==========================================
        // INVOICE DATA
        // ==========================================

        const invoiceData = {

            phoneNumber,

            cashierName,

            customerName,

            subtotal,

            discountRate,

            taxRate,

            total: invoiceTotal,

            items: invoiceItems,

            redeemPoints,

            paymentMethod,
        };

        try {

            const response =
                await axios.post(
                    "https://invoice-backend-78hd.onrender.com/api/invoices",
                    invoiceData
                );

            console.log(
                response.data
            );

            // ==========================================
            // FREEZE RECEIPT VALUES
            // ==========================================

            setRedeemedAmount(
                invoiceLoyaltyDiscount
            );

            setReviewTotal(
                invoiceTotal
            );

            // ==========================================
            // UPDATE INVOICE NUMBER
            // ==========================================

            setInvoiceNumber(
                response.data.invoiceNumber
            );

            // ==========================================
            // REFRESH PRODUCT STOCK
            // ==========================================

            await fetchProducts();

            // ==========================================
            // REFRESH CUSTOMER LOYALTY
            // ==========================================

            await fetchCustomer(
                phoneNumber
            );

            // ==========================================
            // OPEN MODAL
            // ==========================================

            setIsOpen(true);

            // ==========================================
            // SUCCESS TOAST
            // ==========================================

            showToast(
                `Invoice ${response.data.invoiceNumber} saved successfully!`,
                "success"
            );

        } catch (error) {

            console.error(
                "Error saving invoice:",
                error
            );

            showToast(
                error.response?.data?.message ||
                    "Failed to save invoice.",
                "error"
            );
        }
    };

    // ==========================================
    // NEW INVOICE
    // ==========================================

    const addNextInvoiceHandler = async () => {

        // Make absolutely sure camera is stopped
        stopBarcodeScanner();

        await fetchInvoiceNumber();

        setItems([
            {
                id: uid(6),
                name: "",
                qty: 1,
                price: "0.00",
                amount: 0,
            },
        ]);

        setPhoneNumber("");

        setCustomerName("");

        setLoyaltyPoints(0);

        setCashierName(
            user?.username || ""
        );

        setRedeemPoints(false);

        setAvailablePoints(0);

        setRedeemedAmount(0);

        setReviewTotal(0);

        setDiscount("2");

        setTax("5");

        setPaymentMethod("Cash");

        setBarcode("");

        setTimeout(() => {

            barcodeInputRef.current?.focus();

        }, 100);

        showToast(
            "Ready for a new invoice.",
            "info"
        );
    };

    // ==========================================
    // ADD ITEM
    // ==========================================

    const addItemHandler = () => {

        setItems((prevItems) => [

            ...prevItems,

            {
                id: uid(6),
                name: "",
                qty: 1,
                price: "0.00",
                amount: 0,
            },

        ]);
    };

    // ==========================================
    // BARCODE SCAN HANDLER
    // ==========================================

    const handleBarcodeScan = (value) => {

        const scannedBarcode =
            String(value || "").trim();

        if (!scannedBarcode) {
            return;
        }

        console.log(
            "Processing barcode:",
            scannedBarcode
        );

        // ==========================================
        // FIND PRODUCT
        // ==========================================

        const product =
            itemOptions.find(
                (item) =>
                    item.barcode &&
                    String(item.barcode).trim() ===
                        scannedBarcode
            );

        // ==========================================
        // PRODUCT NOT FOUND
        // ==========================================

        if (!product) {

            showToast(
                `No product found for barcode: ${scannedBarcode}`,
                "warning"
            );

            setBarcode("");

            setTimeout(() => {

                barcodeInputRef.current?.focus();

            }, 100);

            return;
        }
        // ==========================================
// PLAY BARCODE SCAN SOUND
// ==========================================

if (scanSoundRef.current) {
    scanSoundRef.current.currentTime = 0;

    scanSoundRef.current
        .play()
        .catch((error) => {
            console.log("Scan sound could not play:", error);
        });
}
        // ==========================================
        // CHECK STOCK
        // ==========================================

        if (
            Number(product.stock) <= 0
        ) {

            showToast(
                `${product.name} is out of stock.`,
                "warning"
            );

            setBarcode("");

            setTimeout(() => {

                barcodeInputRef.current?.focus();

            }, 100);

            return;
        }

        // ==========================================
        // CHECK EXISTING ITEM
        // ==========================================

        const existingItem =
            items.find(
                (item) =>
                    item.name === product.name
            );

        // ==========================================
        // PRODUCT ALREADY IN INVOICE
        // ==========================================

        if (existingItem) {

            const currentQty =
                Math.floor(
                    Number(
                        existingItem.qty || 0
                    )
                );

            // ==========================================
            // STOCK LIMIT
            // ==========================================

            if (
                currentQty + 1 >
                Number(product.stock)
            ) {

                showToast(
                    `Only ${product.stock} stock available for ${product.name}.`,
                    "warning"
                );

                setBarcode("");

                setTimeout(() => {

                    barcodeInputRef.current?.focus();

                }, 100);

                return;
            }

            // ==========================================
            // INCREASE QTY BY EXACTLY ONE
            // ==========================================

            const newQty =
                currentQty + 1;

            setItems((prevItems) =>

                prevItems.map((item) => {

                    if (
                        item.id ===
                        existingItem.id
                    ) {

                        return {

                            ...item,

                            qty: newQty,

                            price:
                                product.price,

                            amount:
                                product.price *
                                newQty,
                        };
                    }

                    return item;
                })
            );

        } else {

            // ==========================================
            // ADD NEW PRODUCT
            // ==========================================

            setItems((prevItems) => {

                // Find empty row
                const firstEmptyItem =
                    prevItems.find(
                        (item) =>
                            !item.name ||
                            item.name.trim() === ""
                    );

                // ==========================================
                // USE EMPTY ROW
                // ==========================================

                if (firstEmptyItem) {

                    return prevItems.map(
                        (item) => {

                            if (
                                item.id ===
                                firstEmptyItem.id
                            ) {

                                return {

                                    ...item,

                                    name:
                                        product.name,

                                    qty: 1,

                                    price:
                                        product.price,

                                    amount:
                                        product.price,
                                };
                            }

                            return item;
                        }
                    );
                }

                // ==========================================
                // ADD NEW ROW
                // ==========================================

                return [

                    ...prevItems,

                    {
                        id: uid(6),

                        name:
                            product.name,

                        qty: 1,

                        price:
                            product.price,

                        amount:
                            product.price,
                    },

                ];
            });
        }

        // ==========================================
        // SUCCESS MESSAGE
        // ==========================================

        showToast(
            `${product.name} added successfully.`,
            "success"
        );

        // ==========================================
        // CLEAR BARCODE
        // ==========================================

        setBarcode("");

        // ==========================================
        // FOCUS BARCODE INPUT
        // ==========================================

        setTimeout(() => {

            barcodeInputRef.current?.focus();

        }, 100);
    };

    // ==========================================
    // DELETE ITEM
    // ==========================================

    const deleteItemHandler = (id) => {

        setItems((prevItems) =>
            prevItems.filter(
                (item) =>
                    item.id !== id
            )
        );
    };

    // ==========================================
    // EDIT ITEM
    // ==========================================

    const edtiItemHandler = (event) => {

        const {
            id,
            name,
            value,
        } = event.target;

        const updatedItems =
            items.map((item) => {

                if (item.id === id) {

                    let newItem = {
                        ...item,
                        [name]: value,
                    };

                    // ==========================================
                    // PRODUCT SELECTED
                    // ==========================================

                    if (
                        name === "name"
                    ) {

                        const selectedItem =
                            itemOptions.find(
                                (opt) =>
                                    opt.name ===
                                    value
                            );

                        if (selectedItem) {

                            newItem.price =
                                selectedItem.price;

                            newItem.qty = 1;
                        }
                    }

                    // ==========================================
                    // CALCULATE AMOUNT
                    // ==========================================

                    const itemPrice =
                        Number(
                            newItem.price || 0
                        );

                    const itemQty =
                        Math.floor(
                            Number(
                                newItem.qty || 0
                            )
                        );

                    newItem.amount =
                        itemPrice *
                        itemQty;

                    return newItem;
                }

                return item;
            });

        setItems(updatedItems);
    };

    // ==========================================
    // RENDER
    // ==========================================

    return (

        <div className="max-w-6xl mx-auto p-4 md:p-6">

            {/* ==========================================
                TOAST
            ========================================== */}

            <Toast
                message={toast.message}
                type={toast.type}
                onClose={closeToast}
            />

            {/* ==========================================
                MAIN FORM
            ========================================== */}

            <form
                onSubmit={reviewInvoiceHandler}
                className="bg-white rounded-xl shadow-lg p-5 md:p-8"
            >

                {/* ==========================================
                    HEADER
                ========================================== */}

                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">

                    <div>

                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                            AK Super Market
                        </h1>

                        <p className="text-gray-500 mt-1">
                            Create New Invoice
                        </p>

                    </div>

                    <div className="text-left md:text-right">

                        <p className="text-sm text-gray-500">
                            Current Date
                        </p>

                        <p className="font-semibold text-gray-800">
                            {today}
                        </p>

                        <p className="text-sm text-gray-500 mt-2">
                            Current Time
                        </p>

                        <p className="font-semibold text-gray-800">
                            {currentTime}
                        </p>

                    </div>

                </div>

                {/* ==========================================
                    INVOICE NUMBER
                ========================================== */}

                <div className="mt-6">

                    <label
                        htmlFor="invoiceNumber"
                        className="text-sm font-bold"
                    >
                        Invoice Number:
                    </label>

                    <input
                        type="text"
                        id="invoiceNumber"
                        value={invoiceNumber}
                        readOnly
                        className="w-full mt-1 border rounded px-3 py-2 bg-gray-100 font-semibold"
                    />

                </div>

                {/* ==========================================
                    CASHIER & CUSTOMER
                ========================================== */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-6">

                    <div className="flex flex-col">

                        <label
                            htmlFor="cashierName"
                            className="text-sm font-bold"
                        >
                            Cashier:
                        </label>

                        <input
                            type="text"
                            id="cashierName"
                            value={cashierName}
                            readOnly
                            className="border rounded px-3 py-2 bg-gray-100"
                        />

                    </div>

                    <div className="flex flex-col">

                        <label
                            htmlFor="customerName"
                            className="text-sm font-bold"
                        >
                            Customer Name:
                        </label>

                        <input
                            type="text"
                            id="customerName"
                            value={customerName}
                            onChange={(e) =>
                                setCustomerName(
                                    e.target.value
                                )
                            }
                            placeholder="Customer name"
                            className="border rounded px-3 py-2"
                        />

                    </div>

                </div>

                {/* ==========================================
                    PHONE & LOYALTY
                ========================================== */}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">

                    <div className="flex flex-col">

                        <label
                            htmlFor="phoneNumber"
                            className="text-sm font-bold"
                        >
                            Phone Number:
                        </label>

                        <input
                            type="text"
                            id="phoneNumber"
                            maxLength={10}
                            className="border rounded px-3 py-2"
                            value={phoneNumber}
                            placeholder="10 digit phone number"
                            onChange={(e) => {

                                const value =
                                    e.target.value.replace(
                                        /\D/g,
                                        ""
                                    );

                                setPhoneNumber(value);

                                if (
                                    value.length ===
                                    10
                                ) {

                                    fetchCustomer(
                                        value
                                    );
                                }

                            }}
                        />

                    </div>

                    <div className="flex flex-col">

                        <label className="text-sm font-bold">
                            Loyalty Points:
                        </label>

                        <input
                            type="text"
                            value={loyaltyPoints}
                            readOnly
                            className="border rounded px-3 py-2 bg-gray-100"
                        />

                    </div>

                    <div className="flex items-center gap-2 mt-6 md:mt-0">

                        <input
                            type="checkbox"
                            id="redeemPoints"
                            checked={redeemPoints}
                            disabled={
                                availablePoints <= 0
                            }
                            onChange={(e) =>
                                setRedeemPoints(
                                    e.target.checked
                                )
                            }
                            className="w-5 h-5"
                        />

                        <label
                            htmlFor="redeemPoints"
                            className="font-semibold"
                        >
                            Redeem Loyalty Points
                        </label>

                    </div>

                </div>

                {/* ==========================================
                    BARCODE SCANNER
                ========================================== */}

                <div className="mt-6">



    <button
        type="button"
        onClick={startBarcodeScanner}
        className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-3 py-2 rounded-md transition shadow-sm whitespace-nowrap"
    >
        📷 Scan Barcode
    </button>


                    <input
                        type="text"
                        id="barcode"
                        value={barcode}
                        ref={barcodeInputRef}
                        onChange={(e) => {

                            const value =
                                e.target.value;

                            const cleanValue =
                                value.replace(
                                    /[\r\n]/g,
                                    ""
                                );

                            setBarcode(
                                cleanValue
                            );

                        }}
                        onKeyDown={(e) => {

                            if (
                                e.key === "Enter"
                            ) {

                                e.preventDefault();

                                handleBarcodeScan(
                                    barcode
                                );
                            }

                        }}
                        placeholder="Scan or enter barcode"
                        className="w-full border rounded px-3 py-2 mt-1"
                    />

                    <p className="text-xs text-gray-500 mt-1">
                        Scan or enter a barcode manually.
                    </p>

                </div>

                {/* ==========================================
                    ITEM TABLE
                ========================================== */}

                <div className="overflow-x-auto mt-6">

                    <table className="w-full text-left">

                        <thead>

                            <tr className="border-b text-sm font-medium text-gray-700">

                                <th className="p-2 min-w-[180px]">
                                    ITEM
                                </th>

                                <th className="p-2">
                                    QTY
                                </th>

                                <th className="p-2 text-center">
                                    PRICE
                                </th>

                                <th className="p-2 text-center">
                                    AMOUNT
                                </th>

                                <th className="p-2 text-center">
                                    ACTION
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {items.map(
                                (
                                    item,
                                    index
                                ) => (

                                    <InvoiceItem
                                        key={
                                            item.id
                                        }

                                        id={
                                            item.id
                                        }

                                        name={
                                            item.name
                                        }

                                        qty={
                                            item.qty
                                        }

                                        price={
                                            item.price
                                        }

                                        amount={
                                            item.amount
                                        }

                                        onDeleteItem={
                                            deleteItemHandler
                                        }

                                        onEdtiItem={
                                            edtiItemHandler
                                        }

                                        itemOptions={
                                            itemOptions
                                        }

                                        onAddItem={
                                            addItemHandler
                                        }

                                        autoFocus={
                                            index ===
                                            items.length -
                                            1
                                        }
                                    />

                                )
                            )}

                        </tbody>

                    </table>

                </div>

                {/* ==========================================
                    ADD ITEM
                ========================================== */}

                <button
                    type="button"
                    className="mt-3 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 transition"
                    onClick={addItemHandler}
                >
                    ➕ Add Item
                </button>

                {/* ==========================================
                    TAX & DISCOUNT
                ========================================== */}

                <div className="grid grid-cols-2 gap-4 pt-6 md:w-1/2">

                    <div className="flex flex-col">

                        <label
                            htmlFor="discount"
                            className="font-bold"
                        >
                            Discount (%)
                        </label>

                        <input
                            type="number"
                            id="discount"
                            min="0"
                            value={discount}
                            onChange={(e) =>
                                setDiscount(
                                    e.target.value
                                )
                            }
                            className="border rounded px-3 py-2"
                        />

                    </div>

                    <div className="flex flex-col">

                        <label
                            htmlFor="tax"
                            className="font-bold"
                        >
                            Tax (%)
                        </label>

                        <input
                            type="number"
                            id="tax"
                            min="0"
                            value={tax}
                            onChange={(e) =>
                                setTax(
                                    e.target.value
                                )
                            }
                            className="border rounded px-3 py-2"
                        />

                    </div>

                </div>

                {/* ==========================================
                    TOTALS
                ========================================== */}

                <div className="flex flex-col items-end space-y-3 pt-6 md:w-1/2">

                    <div className="flex justify-between w-full">

                        <span className="font-bold">
                            Subtotal:
                        </span>

                        <span>
                            {subtotal.toFixed(2)}
                        </span>

                    </div>

                    <div className="flex justify-between w-full">

                        <span className="font-bold">
                            Discount:
                        </span>

                        <span>
                            ({discount || 0}%)
                            {discountRate.toFixed(2)}
                        </span>

                    </div>

                    <div className="flex justify-between w-full">

                        <span className="font-bold">
                            Loyalty Discount:
                        </span>

                        <span className="text-purple-600 font-semibold">

                            {redeemPoints
                                ? Number(
                                    availablePoints
                                ).toFixed(2)
                                : "0.00"}

                        </span>

                    </div>

                    <div className="flex justify-between w-full">

                        <span className="font-bold">
                            Tax:
                        </span>

                        <span>
                            {taxRate.toFixed(2)}
                        </span>

                    </div>

                    {/* ==========================================
                        PAYMENT METHOD
                    ========================================== */}

                    <div className="w-full mt-2">

                        <label
                            htmlFor="paymentMethod"
                            className="font-bold"
                        >
                            Payment Method:
                        </label>

                        <select
                            id="paymentMethod"
                            value={paymentMethod}
                            onChange={(e) =>
                                setPaymentMethod(
                                    e.target.value
                                )
                            }
                            className="w-full border rounded px-3 py-2 mt-1"
                        >

                            <option value="Cash">
                                Cash
                            </option>

                            <option value="Online">
                                Online
                            </option>

                        </select>

                    </div>

                    {/* ==========================================
                        GRAND TOTAL
                    ========================================== */}

                    <div className="flex justify-between w-full border-t pt-4 mt-2">

                        <span className="font-bold text-xl">
                            Total:
                        </span>

                        <span className="font-bold text-xl text-blue-600">
                            RS: {total.toFixed(2)}
                        </span>

                    </div>

                    {/* ==========================================
                        REVIEW BUTTON
                    ========================================== */}

                    <button
                        className="hidden md:block mt-4 w-full rounded-lg bg-blue-600 py-3 text-white font-semibold hover:bg-blue-700 transition"
                        type="submit"
                        ref={reviewBtnRef}
                    >
                        Review Invoice
                    </button>

                </div>

                {/* ==========================================
                    MOBILE REVIEW BUTTON
                ========================================== */}

                <div className="md:hidden w-full pt-4">

                    <button
                        className="w-full rounded-lg bg-blue-600 py-3 text-white font-semibold hover:bg-blue-700 transition"
                        type="submit"
                    >
                        Review Invoice
                    </button>

                </div>

            </form>

            {/* ==========================================
                CAMERA BARCODE SCANNER
            ========================================== */}

            {showScanner && (

                <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">

                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

                        {/* HEADER */}

                        <div className="flex items-center justify-between p-4 border-b">

                            <div>

                                <h2 className="text-lg font-bold text-gray-800">
                                    Scan Barcode
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

            {/* ==========================================
                INVOICE MODAL
            ========================================== */}

            <InvoiceModal
                isOpen={isOpen}
                setIsOpen={setIsOpen}

                invoiceInfo={{

                    invoiceNumber,

                    cashierName,

                    customerName,

                    phoneNumber,

                    paymentMethod,

                    subtotal,

                    discountRate,

                    taxRate,

                    loyaltyDiscount:
                        redeemedAmount,

                    total:
                        reviewTotal,

                }}

                items={items}

                onAddNextInvoice={
                    addNextInvoiceHandler
                }
            />

        </div>
    );
};

export default InvoiceForm;