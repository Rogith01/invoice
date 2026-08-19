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

    const [cashReceived, setCashReceived] =
        useState("");

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

    // ==========================================
    // BARCODE SOUNDS
    // ==========================================

    const scanSoundRef = useRef(null);

    const barcodeErrorSoundRef = useRef(null);

    // ==========================================
    // NORMAL TOAST SOUNDS
    // ==========================================

    const successSoundRef = useRef(null);

    const toastErrorSoundRef = useRef(null);

    // ==========================================
    // INITIALIZE ALL SOUNDS
    // ==========================================

    useEffect(() => {

        scanSoundRef.current =
            new Audio("/barcode-beep.mp3");

        scanSoundRef.current.volume = 1.0;

        barcodeErrorSoundRef.current =
            new Audio("/barcode-error.mp3");

        barcodeErrorSoundRef.current.volume = 1.0;

        successSoundRef.current =
            new Audio("/success-tone.mp3");

        successSoundRef.current.volume = 1.0;

        toastErrorSoundRef.current =
            new Audio("/error-tone.mp3");

        toastErrorSoundRef.current.volume = 1.0;

        return () => {

            scanSoundRef.current = null;

            barcodeErrorSoundRef.current = null;

            successSoundRef.current = null;

            toastErrorSoundRef.current = null;

        };

    }, []);

    // ==========================================
    // CAMERA SCANNER
    // ==========================================

    const [showScanner, setShowScanner] =
        useState(false);

    const videoRef = useRef(null);

    const codeReaderRef = useRef(null);

    const scannerControlsRef = useRef(null);

    const scannerTimeoutRef = useRef(null);

    const scannerSessionRef = useRef(0);

    const scannerStartingRef = useRef(false);

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
    // HOLD / RESUME BILL
    // ==========================================

    const [showHeldBills, setShowHeldBills] =
        useState(false);

    const [heldBills, setHeldBills] = useState(() => {

        try {

            const savedBills =
                localStorage.getItem(
                    "ak_held_bills"
                );

            return savedBills
                ? JSON.parse(savedBills)
                : [];

        } catch (error) {

            console.error(
                "Error loading held bills:",
                error
            );

            return [];

        }

    });

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
        (
            message,
            type = "success",
            playSound = true
        ) => {

            if (playSound) {

                if (type === "success") {

                    if (successSoundRef.current) {

                        successSoundRef.current.currentTime = 0;

                        successSoundRef.current
                            .play()
                            .catch((error) => {

                                console.log(
                                    "Success toast sound could not play:",
                                    error
                                );

                            });

                    }

                }

                else if (
                    type === "error" ||
                    type === "warning"
                ) {

                    if (toastErrorSoundRef.current) {

                        toastErrorSoundRef.current.currentTime = 0;

                        toastErrorSoundRef.current
                            .play()
                            .catch((error) => {

                                console.log(
                                    "Error toast sound could not play:",
                                    error
                                );

                            });

                    }

                }

            }

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
    // SAVE HELD BILLS
    // ==========================================

    useEffect(() => {

        try {

            localStorage.setItem(
                "ak_held_bills",
                JSON.stringify(heldBills)
            );

        } catch (error) {

            console.error(
                "Error saving held bills:",
                error
            );

        }

    }, [heldBills]);

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
// INITIAL LOAD + POS KEYBOARD SHORTCUTS
// ==========================================

useEffect(() => {

    fetchInvoiceNumber();

    fetchProducts();

    const handleShortcut = (event) => {

        // ==========================================
        // F2 → BARCODE / SCANNING
        // ==========================================

        if (event.key === "F2") {

            event.preventDefault();

            barcodeInputRef.current?.focus();

            barcodeInputRef.current?.select();

            return;
        }


        // ==========================================
        // F3 → QUANTITY
        // ==========================================

        if (event.key === "F3") {

            event.preventDefault();

            const quantityInputs =
                document.querySelectorAll(
                    'input[name="qty"]'
                );

            if (quantityInputs.length > 0) {

                const lastQuantityInput =
                    quantityInputs[
                        quantityInputs.length - 1
                    ];

                lastQuantityInput.focus();

                lastQuantityInput.select();

            }

            return;
        }


        // ==========================================
        // F4 → REVIEW INVOICE
        // ==========================================

        if (event.key === "F5") {

            event.preventDefault();

            reviewBtnRef.current?.click();

            return;
        }


        // ==========================================
        // F5 → PAYMENT METHOD
        // ==========================================

        if (event.key === "F4") {

            event.preventDefault();

            const paymentSelect =
                document.getElementById(
                    "paymentMethod"
                );

            if (paymentSelect) {

                paymentSelect.focus();

            }

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
    fetchInvoiceNumber,
    fetchProducts,
]);

    // ==========================================
    // STOP / CLEAN CAMERA SCANNER
    // ==========================================

    const stopBarcodeScanner = useCallback(() => {

        scannerSessionRef.current += 1;

        barcodeScanLockRef.current = true;

        scannerStartingRef.current = false;

        if (scannerTimeoutRef.current) {

            clearTimeout(
                scannerTimeoutRef.current
            );

            scannerTimeoutRef.current = null;

        }

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

        setShowScanner(false);

    }, []);

    // ==========================================
    // START CAMERA BARCODE SCANNER
    // ==========================================

    const startBarcodeScanner = async () => {

        if (scannerStartingRef.current) {
            return;
        }

        if (
            codeReaderRef.current ||
            scannerControlsRef.current ||
            scannerTimeoutRef.current
        ) {

            stopBarcodeScanner();

            await new Promise((resolve) =>
                setTimeout(resolve, 100)
            );

        }

        const sessionId =
            scannerSessionRef.current + 1;

        scannerSessionRef.current =
            sessionId;

        scannerStartingRef.current = true;

        barcodeScanLockRef.current = false;

        setShowScanner(true);

        scannerTimeoutRef.current =
            setTimeout(async () => {

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

                if (!videoRef.current) {

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

                    const codeReader =
                        new BrowserMultiFormatReader();

                    codeReaderRef.current =
                        codeReader;

                    const controls =
                        await codeReader.decodeFromVideoDevice(
                            undefined,
                            videoRef.current,
                            (result) => {

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

                                if (!result) {
                                    return;
                                }

                                barcodeScanLockRef.current =
                                    true;

                                const scannedBarcode =
                                    result
                                        .getText()
                                        .trim();

                                handleBarcodeScan(
                                    scannedBarcode
                                );

                                stopBarcodeScanner();

                            }
                        );

                    if (
                        sessionId !==
                        scannerSessionRef.current
                    ) {

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
    // CLEAN CAMERA
    // ==========================================

    useEffect(() => {

        const videoElement =
            videoRef.current;

        return () => {

            scannerSessionRef.current += 1;

            barcodeScanLockRef.current = true;

            scannerStartingRef.current = false;

            if (scannerTimeoutRef.current) {

                clearTimeout(
                    scannerTimeoutRef.current
                );

                scannerTimeoutRef.current = null;

            }

            if (scannerControlsRef.current) {

                try {
                    scannerControlsRef.current.stop();
                } catch (error) {
                    console.log(error);
                }

                scannerControlsRef.current = null;

            }

            if (codeReaderRef.current) {

                try {
                    codeReaderRef.current.reset();
                } catch (error) {
                    console.log(error);
                }

                codeReaderRef.current = null;

            }

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
                                console.log(error);
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
    // CASH CHANGE
    // ==========================================

    const changeAmount =
        paymentMethod === "Cash"
            ? Math.max(
                0,
                Number(cashReceived || 0) - total
            )
            : 0;

    const insufficientCash =
        paymentMethod === "Cash" &&
        cashReceived !== "" &&
        Number(cashReceived) < total;

    // ==========================================
    // HOLD CURRENT BILL
    // ==========================================

    const holdBillHandler = () => {

        const validItems = items.filter(
            (item) =>
                item.name &&
                item.name.trim().length > 0
        );

        if (validItems.length === 0) {

            showToast(
                "Add at least one product before holding the bill.",
                "warning"
            );

            return;

        }

        for (const item of validItems) {

            const quantity =
                Math.floor(
                    Number(item.qty || 0)
                );

            if (quantity <= 0) {

                showToast(
                    `Please enter a valid quantity for ${item.name}.`,
                    "warning"
                );

                return;

            }

        }

        const heldBill = {

            id: uid(8),

            invoiceNumber,

            cashierName,

            customerName,

            phoneNumber,

            loyaltyPoints,

            redeemPoints,

            availablePoints,

            redeemedAmount,

            discount,

            tax,

            paymentMethod,

            items: validItems.map((item) => ({
                ...item,
            })),

            subtotal,

            discountRate,

            taxRate,

            loyaltyDiscount,

            total,

            createdAt:
                new Date().toISOString(),

        };

        setHeldBills((prevBills) => [
            ...prevBills,
            heldBill,
        ]);

        stopBarcodeScanner();

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

        setCashReceived("");

        setBarcode("");

        fetchInvoiceNumber();

        showToast(
            `Bill ${invoiceNumber} has been held successfully.`,
            "success"
        );

        setTimeout(() => {

            barcodeInputRef.current?.focus();

        }, 100);

    };

    // ==========================================
    // RESUME HELD BILL
    // ==========================================

    const resumeBillHandler = (bill) => {

        setInvoiceNumber(
            bill.invoiceNumber
        );

        setCashierName(
            bill.cashierName ||
                user?.username ||
                ""
        );

        setCustomerName(
            bill.customerName || ""
        );

        setPhoneNumber(
            bill.phoneNumber || ""
        );

        setLoyaltyPoints(
            Number(
                bill.loyaltyPoints || 0
            )
        );

        setRedeemPoints(
            Boolean(
                bill.redeemPoints
            )
        );

        setAvailablePoints(
            Number(
                bill.availablePoints || 0
            )
        );

        setRedeemedAmount(
            Number(
                bill.redeemedAmount || 0
            )
        );

        setDiscount(
            bill.discount ?? "2"
        );

        setTax(
            bill.tax ?? "5"
        );

        setPaymentMethod(
            bill.paymentMethod ||
                "Cash"
        );

        setItems(
            bill.items.map((item) => ({
                ...item,
                id: uid(6),
            }))
        );

        setHeldBills((prevBills) =>
            prevBills.filter(
                (heldBill) =>
                    heldBill.id !== bill.id
            )
        );

        setShowHeldBills(false);

        setBarcode("");

        setTimeout(() => {

            barcodeInputRef.current?.focus();

        }, 100);

        showToast(
            `Bill ${bill.invoiceNumber} resumed successfully.`,
            "success"
        );

    };

    // ==========================================
    // DELETE HELD BILL
    // ==========================================

    const deleteHeldBillHandler = (billId) => {

        setHeldBills((prevBills) =>
            prevBills.filter(
                (bill) =>
                    bill.id !== billId
            )
        );

        showToast(
            "Held bill deleted successfully.",
            "success"
        );

    };

    // ==========================================
    // REVIEW INVOICE
    // ==========================================

    const reviewInvoiceHandler = async (event) => {

        event.preventDefault();

        if (paymentMethod === "Cash") {

            if (
                cashReceived === "" ||
                Number(cashReceived) <= 0
            ) {

                showToast(
                    "Please enter the cash received from customer.",
                    "warning"
                );

                return;

            }

            if (
                Number(cashReceived) < total
            ) {

                showToast(
                    `Insufficient cash. Customer needs to pay ₹${total.toFixed(2)}.`,
                    "warning"
                );

                return;

            }

        }

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

        const requestedStock = {};

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
                requestedStock[item.name]
            ) {

                requestedStock[item.name] +=
                    requestedQty;

            } else {

                requestedStock[item.name] =
                    requestedQty;

            }

        }

        for (
            const productName
            in requestedStock
        ) {

            const product =
                itemOptions.find(
                    (opt) =>
                        opt.name === productName
                );

            const totalRequested =
                requestedStock[productName];

            const availableStock =
                Number(
                    product.stock || 0
                );

            if (
                totalRequested >
                availableStock
            ) {

                showToast(
                    `Only ${availableStock} stock available for ${productName}. You requested ${totalRequested}.`,
                    "warning"
                );

                return;

            }

        }

        const invoiceLoyaltyDiscount =
            redeemPoints
                ? Number(
                    availablePoints || 0
                )
                : 0;

        const invoiceTotal =
            subtotal -
            discountRate -
            invoiceLoyaltyDiscount +
            taxRate;

        const invoiceItems =
            validItems.map((item) => {

                const itemQty =
                    Math.floor(
                        Number(
                            item.qty || 0
                        )
                    );

                const itemPrice =
                    Number(
                        item.price || 0
                    );

                const itemAmount =
                    itemPrice *
                    itemQty;

                return {
                    ...item,
                    qty: itemQty,
                    price: itemPrice,
                    amount: itemAmount,
                };

            });

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

            setRedeemedAmount(
                invoiceLoyaltyDiscount
            );

            setReviewTotal(
                invoiceTotal
            );

            setInvoiceNumber(
                response.data.invoiceNumber
            );

            await fetchProducts();

            await fetchCustomer(
                phoneNumber
            );

            setIsOpen(true);

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

        stopBarcodeScanner();

        setShowHeldBills(false);

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

        setCashReceived("");

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
    // BARCODE SUCCESS SOUND
    // ==========================================

    const playBarcodeSuccessSound = () => {

        if (scanSoundRef.current) {

            scanSoundRef.current.currentTime = 0;

            scanSoundRef.current
                .play()
                .catch((error) => {

                    console.log(
                        "Barcode success sound could not play:",
                        error
                    );

                });

        }

    };

    // ==========================================
    // BARCODE ERROR SOUND
    // ==========================================

    const playBarcodeErrorSound = () => {

        if (barcodeErrorSoundRef.current) {

            barcodeErrorSoundRef.current.currentTime = 0;

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
    // BARCODE SCAN HANDLER
    // ==========================================

    const handleBarcodeScan = (value) => {

        const scannedBarcode =
            String(value || "").trim();

        if (!scannedBarcode) {
            return;
        }

        const product =
            itemOptions.find(
                (item) =>
                    item.barcode &&
                    String(item.barcode).trim() ===
                        scannedBarcode
            );

        if (!product) {

            playBarcodeErrorSound();

            showToast(
                `No product found for barcode: ${scannedBarcode}`,
                "warning",
                false
            );

            setBarcode("");

            setTimeout(() => {

                barcodeInputRef.current?.focus();

            }, 100);

            return;

        }

        if (
            Number(product.stock) <= 0
        ) {

            playBarcodeErrorSound();

            showToast(
                `${product.name} is out of stock.`,
                "warning",
                false
            );

            setBarcode("");

            setTimeout(() => {

                barcodeInputRef.current?.focus();

            }, 100);

            return;

        }

        const existingItem =
            items.find(
                (item) =>
                    item.name === product.name
            );

        if (existingItem) {

            const currentQty =
                Math.floor(
                    Number(
                        existingItem.qty || 0
                    )
                );

            if (
                currentQty + 1 >
                Number(product.stock)
            ) {

                playBarcodeErrorSound();

                showToast(
                    `Only ${product.stock} stock available for ${product.name}.`,
                    "warning",
                    false
                );

                setBarcode("");

                setTimeout(() => {

                    barcodeInputRef.current?.focus();

                }, 100);

                return;

            }

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

            setItems((prevItems) => {

                const firstEmptyItem =
                    prevItems.find(
                        (item) =>
                            !item.name ||
                            item.name.trim() === ""
                    );

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

        playBarcodeSuccessSound();

        showToast(
            `${product.name} added successfully.`,
            "success",
            false
        );

        setBarcode("");

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

        if (
            name === "name"
        ) {

            const selectedItem =
                itemOptions.find(
                    (opt) =>
                        opt.name === value
                );

            if (!selectedItem) {

                setItems((prevItems) =>
                    prevItems.map((item) => {

                        if (
                            item.id === id
                        ) {

                            return {
                                ...item,
                                name: value,
                                qty: 1,
                                price: "0.00",
                                amount: 0,
                            };

                        }

                        return item;

                    })
                );

                return;

            }

            const existingQuantity =
                items.reduce(
                    (totalQuantity, item) => {

                        if (
                            item.id === id
                        ) {

                            return totalQuantity;

                        }

                        if (
                            item.name ===
                            selectedItem.name
                        ) {

                            return (
                                totalQuantity +
                                Math.floor(
                                    Number(
                                        item.qty || 0
                                    )
                                )
                            );

                        }

                        return totalQuantity;

                    },
                    0
                );

            const newTotalQuantity =
                existingQuantity + 1;

            const availableStock =
                Number(
                    selectedItem.stock || 0
                );

            if (
                newTotalQuantity >
                availableStock
            ) {

                showToast(
                    `Only ${availableStock} stock available for ${selectedItem.name}. You already added ${existingQuantity}.`,
                    "warning"
                );

                return;

            }

            setItems((prevItems) =>
                prevItems.map((item) => {

                    if (
                        item.id === id
                    ) {

                        return {

                            ...item,

                            name:
                                selectedItem.name,

                            qty: 1,

                            price:
                                selectedItem.price,

                            amount:
                                selectedItem.price,

                        };

                    }

                    return item;

                })
            );

            return;

        }

        if (
            name === "qty"
        ) {

            const enteredQty =
                Math.floor(
                    Number(value || 0)
                );

            const currentItem =
                items.find(
                    (item) =>
                        item.id === id
                );

            if (!currentItem) {
                return;
            }

            const selectedProduct =
                itemOptions.find(
                    (opt) =>
                        opt.name ===
                        currentItem.name
                );

            if (!selectedProduct) {
                return;
            }

            const otherRowsQuantity =
                items.reduce(
                    (totalQuantity, item) => {

                        if (
                            item.id === id
                        ) {

                            return totalQuantity;

                        }

                        if (
                            item.name ===
                            currentItem.name
                        ) {

                            return (
                                totalQuantity +
                                Math.floor(
                                    Number(
                                        item.qty || 0
                                    )
                                )
                            );

                        }

                        return totalQuantity;

                    },
                    0
                );

            const totalRequestedQuantity =
                otherRowsQuantity +
                enteredQty;

            const availableStock =
                Number(
                    selectedProduct.stock || 0
                );

            if (
                totalRequestedQuantity >
                availableStock
            ) {

                showToast(
                    `Only ${availableStock} stock available for ${currentItem.name}. You already added ${otherRowsQuantity}.`,
                    "warning"
                );

                return;

            }

        }

        const updatedItems =
            items.map((item) => {

                if (item.id === id) {

                    let newItem = {
                        ...item,
                        [name]: value,
                    };

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

        <div className="min-h-screen bg-slate-50 p-3 md:p-5">

            <Toast
                message={toast.message}
                type={toast.type}
                onClose={closeToast}
            />

            <form
                onSubmit={reviewInvoiceHandler}
                className="max-w-[1500px] mx-auto"
            >

                {/* ==================================================
                    BILLING HEADER
                ================================================== */}

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-5 py-4 mb-4">

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                        <div className="flex items-center gap-4">

<div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="9" cy="20" r="1" />
        <circle cx="20" cy="20" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
</div>

                            <div>

                                <div className="flex items-center gap-3 flex-wrap">

                                    <h1 className="text-2xl font-bold text-slate-800">
                                        New Sale
                                    </h1>

                                    <span className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full">
                                        BILLING
                                    </span>

                                </div>

                                <p className="text-sm text-slate-500 mt-0.5">
                                    Create a new supermarket sale
                                </p>

                            </div>

                        </div>

                        <div className="flex flex-wrap items-center gap-3">

                            <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">



                                <p className="font-bold text-slate-800">
                                    {invoiceNumber}
                                </p>

                            </div>

                            <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">

                                <p className="font-semibold text-slate-800 text-sm">
                                    {today} • {currentTime}
                                </p>

                            </div>

                        </div>

                    </div>

                </div>

                {/* ==================================================
                    QUICK ACTIONS
                ================================================== */}

                <div className="flex flex-wrap gap-2 mb-4">

                    <button
                        type="button"
                        onClick={holdBillHandler}
                        className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition"
                    >
                        <span>⏸</span>
                        Hold Bill
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            setShowHeldBills(true)
                        }
                        className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition"
                    >
                        <span>▶</span>
                        Resume Bill

                        {heldBills.length > 0 && (
                            <span className="bg-white text-purple-700 text-[11px] font-bold rounded-full min-w-[21px] h-5 flex items-center justify-center px-1">
                                {heldBills.length}
                            </span>
                        )}
                    </button>


                </div>

                {/* ==================================================
                    MAIN POS GRID
                ================================================== */}

                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_430px] gap-4">

                    {/* ==================================================
                        LEFT SIDE
                    ================================================== */}

                    <div className="space-y-4">

                        {/* CUSTOMER CARD */}

                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">

                            <div className="flex items-center justify-between mb-4">

                                <div>

                                    <h2 className="text-base font-bold text-slate-800">
                                        Customer Details
                                    </h2>



                                </div>

                                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                    👤
                                </div>

                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                <div>

                                    <label
                                        htmlFor="customerName"
                                        className="block text-xs font-semibold text-slate-600 mb-1.5"
                                    >
                                        Customer Name
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
                                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                                    />

                                </div>

                                <div>

                                    <label
                                        htmlFor="phoneNumber"
                                        className="block text-xs font-semibold text-slate-600 mb-1.5"
                                    >
                                        Phone Number
                                    </label>

                                    <input
                                        type="text"
                                        id="phoneNumber"
                                        maxLength={10}
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
                                                value.length === 10
                                            ) {

                                                fetchCustomer(
                                                    value
                                                );

                                            }

                                        }}
                                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                                    />

                                </div>

                                <div>

                                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                        Cashier
                                    </label>

                                    <input
                                        type="text"
                                        value={cashierName}
                                        readOnly
                                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm bg-slate-50 text-slate-600"
                                    />

                                </div>

                            </div>

                            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3">

                                <div className="flex items-center gap-3">

                                    <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center">
                                        ⭐
                                    </div>

                                    <div>

                                        <p className="text-xs text-purple-600 font-semibold">
                                            Loyalty Points
                                        </p>

                                        <p className="font-bold text-purple-800">
                                            {loyaltyPoints} Points
                                        </p>

                                    </div>

                                </div>

                                <label
                                    htmlFor="redeemPoints"
                                    className={`flex items-center gap-2 text-sm font-semibold ${
                                        availablePoints <= 0
                                            ? "text-slate-400"
                                            : "text-purple-700"
                                    }`}
                                >

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
                                        className="w-4 h-4 accent-purple-600"
                                    />

                                    Redeem Loyalty Points

                                </label>

                            </div>

                        </div>

                        {/* ==================================================
                            BARCODE / PRODUCT SEARCH
                        ================================================== */}

                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">

                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">

                                <div>

                                    <h2 className="text-base font-bold text-slate-800">
                                        Add Products
                                    </h2>

                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Scan a barcode or select products below
                                    </p>

                                </div>

                                <button
                                    type="button"
                                    onClick={startBarcodeScanner}
                                    className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition"
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

                                    Scan Barcode

                                </button>

                            </div>

                            <div className="relative">

                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                    🔍
                                </div>

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
                                    placeholder="Scan or enter barcode..."
                                    className="w-full border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                                />

                            </div>
<div className="flex items-center justify-between mt-2">

    <p className="text-xs text-slate-400">
        Barcode scanner is ready
    </p>

    <div className="flex items-center gap-2">

        <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-medium">
            F2 Scan
        </span>

        <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-1 rounded-md font-medium">
            Enter to add
        </span>

    </div>

</div>

                        </div>

                        {/* ==================================================
                            ITEM TABLE
                        ================================================== */}

                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

                            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">

                                <div>

                                    <h2 className="text-base font-bold text-slate-800">
                                        Sale Items
                                    </h2>

                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Add products to this invoice
                                    </p>

                                </div>

                                <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                                    {items.filter(
                                        (item) =>
                                            item.name &&
                                            item.name.trim()
                                                .length > 0
                                    ).length}{" "}
                                    Items
                                </span>

                            </div>

                            <div className="overflow-x-auto">

                                <table className="w-full text-center">

                                    <thead className="bg-slate-50">

                                        <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide font-bold text-slate-500">

                                            <th className="px-5 py-3 min-w-[220px] text-center">
                                                Item
                                            </th>

                                            <th className="px-3 py-3 ">
                                                Qty
                                            </th>

                                            <th className="px-3 py-3 text-center">
                                                Price
                                            </th>

                                            <th className="px-3 py-3 text-center">
                                                Amount
                                            </th>

                                            <th className="px-3 py-3 text-center">
                                                Action
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

                            <div className="px-5 py-4 border-t border-slate-100">

                                <button
                                    type="button"
                                    onClick={addItemHandler}
                                    className="inline-flex items-center gap-2 border border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50 text-slate-600 hover:text-blue-600 font-semibold text-sm px-4 py-2.5 rounded-xl transition"
                                >
                                    <span>＋</span>
                                    Add Item
                                </button>

                            </div>

                        </div>

                    </div>

                    {/* ==================================================
                        RIGHT SIDE - CART / PAYMENT
                    ================================================== */}

                    <div className="xl:sticky xl:top-4 h-fit">

                        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

                            {/* CART HEADER */}

                            <div className="bg-blue-600 px-5 py-5 text-white">

                                <div className="flex items-center justify-between">

                                    <div className="flex items-center gap-3">

<div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="9" cy="20" r="1" />
        <circle cx="20" cy="20" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
</div>

                                        <div>

                                            <h2 className="font-bold text-lg">
                                                Current Sale
                                            </h2>

                                            <p className="text-xs text-slate-300">
                                                {invoiceNumber}
                                            </p>

                                        </div>

                                    </div>

                                    <div className="bg-white/10 px-3 py-1.5 rounded-lg text-xs font-semibold">
                                        {items.filter(
                                            (item) =>
                                                item.name &&
                                                item.name.trim()
                                                    .length > 0
                                        ).length}{" "}
                                        items
                                    </div>

                                </div>

                            </div>

                            {/* QUICK SUMMARY */}

                            <div className="p-5">

                                <div className="space-y-2.5 max-h-[230px] overflow-y-auto pr-1">

                                    {items.filter(
                                        (item) =>
                                            item.name &&
                                            item.name.trim()
                                                .length > 0
                                    ).length === 0 ? (

                                        <div className="text-center py-8">

                                            <div className="text-4xl mb-2">
                                                🛒
                                            </div>

                                            <p className="font-semibold text-slate-600">
                                                No items added
                                            </p>

                                            <p className="text-xs text-slate-400 mt-1">
                                                Scan a barcode or add an item
                                            </p>

                                        </div>

                                    ) : (

                                        items
                                            .filter(
                                                (item) =>
                                                    item.name &&
                                                    item.name.trim()
                                                        .length > 0
                                            )
                                            .map((item) => (

                                                <div
                                                    key={
                                                        item.id
                                                    }
                                                    className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-100 last:border-0"
                                                >

                                                    <div className="min-w-0">

                                                        <p className="text-sm font-semibold text-slate-700 truncate">
                                                            {item.name}
                                                        </p>

                                                        <p className="text-xs text-slate-400">
                                                            {Math.floor(
                                                                Number(
                                                                    item.qty ||
                                                                        0
                                                                )
                                                            )}{" "}
                                                            × ₹
                                                            {Number(
                                                                item.price ||
                                                                    0
                                                            ).toFixed(
                                                                2
                                                            )}
                                                        </p>

                                                    </div>

                                                    <p className="text-sm font-bold text-slate-800 whitespace-nowrap">
                                                        ₹
                                                        {Number(
                                                            item.amount ||
                                                                0
                                                        ).toFixed(
                                                            2
                                                        )}
                                                    </p>

                                                </div>

                                            ))

                                    )}

                                </div>

                                {/* ==================================================
                                    DISCOUNT / TAX
                                ================================================== */}

                                <div className="border-t border-slate-200 mt-4 pt-4">

                                    <div className="grid grid-cols-2 gap-3">

                                        <div>

                                            <label
                                                htmlFor="discount"
                                                className="block text-xs font-semibold text-slate-600 mb-1.5"
                                            >
                                                Discount %
                                            </label>

                                            <input
                                                type="number"
                                                id="discount"
                                                min="0"
                                                value={
                                                    discount
                                                }
                                                onChange={(e) =>
                                                    setDiscount(
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                            />

                                        </div>

                                        <div>

                                            <label
                                                htmlFor="tax"
                                                className="block text-xs font-semibold text-slate-600 mb-1.5"
                                            >
                                                Tax %
                                            </label>

                                            <input
                                                type="number"
                                                id="tax"
                                                min="0"
                                                value={
                                                    tax
                                                }
                                                onChange={(e) =>
                                                    setTax(
                                                        e.target.value
                                                    )
                                                }
                                                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                            />

                                        </div>

                                    </div>

                                </div>

                                {/* ==================================================
                                    TOTAL BREAKDOWN
                                ================================================== */}

                                <div className="mt-5 space-y-3">

                                    <div className="flex justify-between text-sm">

                                        <span className="text-slate-500">
                                            Subtotal
                                        </span>

                                        <span className="font-semibold text-slate-700">
                                            ₹{subtotal.toFixed(2)}
                                        </span>

                                    </div>

                                    <div className="flex justify-between text-sm">

                                        <span className="text-slate-500">
                                            Discount
                                            <span className="text-xs ml-1">
                                                ({discount || 0}%)
                                            </span>
                                        </span>

                                        <span className="font-semibold text-red-500">
                                            - ₹{discountRate.toFixed(2)}
                                        </span>

                                    </div>

                                    <div className="flex justify-between text-sm">

                                        <span className="text-slate-500">
                                            Loyalty Discount
                                        </span>

                                        <span className="font-semibold text-purple-600">
                                            - ₹
                                            {redeemPoints
                                                ? Number(
                                                    availablePoints
                                                ).toFixed(2)
                                                : "0.00"}
                                        </span>

                                    </div>

                                    <div className="flex justify-between text-sm">

                                        <span className="text-slate-500">
                                            Tax
                                        </span>

                                        <span className="font-semibold text-slate-700">
                                            + ₹{taxRate.toFixed(2)}
                                        </span>

                                    </div>

                                    <div className="font-bold flex justify-between text-lg">

                                        <span className="text-blue-600">
                                            Grand Total
                                        </span>

                                        <span className="font-semibold text-blue-600">
                                            ₹{total.toFixed(2)}
                                        </span>

                                    </div>

                                </div>

                                {/* ==================================================
                                    PAYMENT METHOD
                                ================================================== */}

                                <div className="mt-5">

                                    <label
                                        htmlFor="paymentMethod"
                                        className="block text-xs font-semibold text-slate-600 mb-1.5"
                                    >
                                        Payment Method
                                    </label>

                                    <select
                                        id="paymentMethod"
                                        value={
                                            paymentMethod
                                        }
                                        onChange={(e) => {

                                            const method =
                                                e.target.value;

                                            setPaymentMethod(
                                                method
                                            );

                                            if (
                                                method !==
                                                "Cash"
                                            ) {

                                                setCashReceived(
                                                    ""
                                                );

                                            }

                                        }}
                                        className="w-full border border-slate-200 rounded-xl px-3.5 py-3 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                                    >

                                        <option value="Cash">
                                            Cash
                                        </option>

                                        <option value="Online">
                                            Online
                                        </option>

                                    </select>

                                </div>

                                {/* ==================================================
                                    CASH PAYMENT
                                ================================================== */}

                                {paymentMethod === "Cash" && (

                                    <div className="mt-4">

                                        <label
                                            htmlFor="cashReceived"
                                            className="block text-xs font-semibold text-slate-600 mb-1.5"
                                        >
                                            Cash Received
                                        </label>

                                        <input
                                            type="number"
                                            id="cashReceived"
                                            min="0"
                                            step="0.01"
                                            value={
                                                cashReceived
                                            }
                                            onChange={(e) =>
                                                setCashReceived(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Enter amount received"
                                            className={`w-full border rounded-xl px-3.5 py-3 text-sm outline-none focus:ring-2 transition ${
                                                insufficientCash
                                                    ? "border-red-400 focus:ring-red-100"
                                                    : "border-slate-200 focus:border-blue-500 focus:ring-blue-100"
                                            }`}
                                        />

                                        {insufficientCash && (

                                            <p className="text-red-600 text-xs font-semibold mt-1.5">
                                                ⚠ Insufficient cash amount.
                                            </p>

                                        )}

                                        <div className="flex justify-between items-center mt-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">

                                            <span className="text-sm font-semibold text-green-700">
                                                Change to Return
                                            </span>

                                            <span className="text-base font-bold text-green-700">
                                                ₹ {changeAmount.toFixed(2)}
                                            </span>

                                        </div>

                                    </div>

                                )}

                                {/* ==================================================
                                    REVIEW / PAYMENT BUTTON
                                ================================================== */}

                                <button
                                    type="submit"
                                    ref={reviewBtnRef}
                                    className="hidden md:flex w-full mt-5 items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-3.5 rounded-xl shadow-sm transition"
                                >

                                    <span>Review Invoice</span>

                                    <span className="text-xs bg-white/15 px-2 py-1 rounded-md">
                                        F5
                                    </span>

                                </button>

                            </div>

                        </div>

                    </div>

                </div>

                {/* ==================================================
                    MOBILE REVIEW BUTTON
                ================================================== */}

                <div className="md:hidden mt-4">

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-sm transition"
                    >
                        Review Invoice • ₹{total.toFixed(2)}
                    </button>

                </div>

            </form>

            {/* ==================================================
                HELD BILLS MODAL
            ================================================== */}

            {showHeldBills && (

                <div className="fixed inset-0 z-[9998] bg-black/60 flex items-center justify-center p-4">

                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden">

                        <div className="flex items-center justify-between p-5 border-b">

                            <div>

                                <h2 className="text-xl font-bold text-gray-800">
                                    Held Bills
                                </h2>

                                <p className="text-sm text-gray-500 mt-1">
                                    Select a bill to continue billing.
                                </p>

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowHeldBills(false)
                                }
                                className="text-gray-500 hover:text-red-600 text-3xl leading-none"
                            >
                                ×
                            </button>

                        </div>

                        <div className="p-5 overflow-y-auto max-h-[60vh]">

                            {heldBills.length === 0 ? (

                                <div className="text-center py-12">

                                    <div className="text-5xl mb-4">
                                        🛒
                                    </div>

                                    <h3 className="text-lg font-semibold text-gray-700">
                                        No Held Bills
                                    </h3>

                                    <p className="text-sm text-gray-500 mt-1">
                                        Bills that you hold will appear here.
                                    </p>

                                </div>

                            ) : (

                                <div className="space-y-3">

                                    {heldBills
                                        .slice()
                                        .reverse()
                                        .map((bill) => {

                                            const itemCount =
                                                bill.items.reduce(
                                                    (
                                                        itemTotal,
                                                        item
                                                    ) =>
                                                        itemTotal +
                                                        Number(
                                                            item.qty ||
                                                                0
                                                        ),
                                                    0
                                                );

                                            const heldTime =
                                                new Date(
                                                    bill.createdAt
                                                ).toLocaleTimeString(
                                                    "en-GB",
                                                    {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    }
                                                );

                                            const heldDate =
                                                new Date(
                                                    bill.createdAt
                                                ).toLocaleDateString(
                                                    "en-GB"
                                                );

                                            return (

                                                <div
                                                    key={
                                                        bill.id
                                                    }
                                                    className="border rounded-xl p-4 hover:bg-gray-50 transition"
                                                >

                                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

                                                        <div className="flex-1">

                                                            <div className="flex items-center gap-2">

                                                                <h3 className="font-bold text-gray-800">
                                                                    {
                                                                        bill.invoiceNumber
                                                                    }
                                                                </h3>

                                                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-semibold">
                                                                    HELD
                                                                </span>

                                                            </div>

                                                            <p className="text-sm text-gray-600 mt-1">

                                                                Customer:{" "}

                                                                <span className="font-semibold">
                                                                    {
                                                                        bill.customerName ||
                                                                        "Walk-in Customer"
                                                                    }
                                                                </span>

                                                            </p>

                                                            <p className="text-sm text-gray-500">

                                                                {itemCount}{" "}
                                                                item
                                                                {itemCount !==
                                                                1
                                                                    ? "s"
                                                                    : ""}{" "}
                                                                •{" "}
                                                                {
                                                                    heldDate
                                                                }{" "}
                                                                •{" "}
                                                                {
                                                                    heldTime
                                                                }

                                                            </p>

                                                        </div>

                                                        <div className="text-left md:text-right">

                                                            <p className="text-lg font-bold text-blue-600">

                                                                ₹{" "}

                                                                {Number(
                                                                    bill.total ||
                                                                        0
                                                                ).toFixed(
                                                                    2
                                                                )}

                                                            </p>

                                                        </div>

                                                    </div>

                                                    <div className="flex gap-2 mt-4">

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                resumeBillHandler(
                                                                    bill
                                                                )
                                                            }
                                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition"
                                                        >
                                                            ▶ Resume
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                deleteHeldBillHandler(
                                                                    bill.id
                                                                )
                                                            }
                                                            className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-semibold px-4 py-2 rounded-lg transition"
                                                        >
                                                            Delete
                                                        </button>

                                                    </div>

                                                </div>

                                            );

                                        })}

                                </div>

                            )}

                        </div>

                        <div className="border-t p-4">

                            <button
                                type="button"
                                onClick={() =>
                                    setShowHeldBills(false)
                                }
                                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 rounded-lg transition"
                            >
                                Close
                            </button>

                        </div>

                    </div>

                </div>

            )}

            {/* ==================================================
                CAMERA BARCODE SCANNER
            ================================================== */}

            {showScanner && (

                <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">

                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

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

                        <div className="relative bg-black">

                            <video
                                ref={videoRef}
                                className="w-full aspect-video object-cover bg-black"
                                autoPlay
                                muted
                                playsInline
                            />

                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">

                                <div className="w-64 h-32 border-2 border-white rounded-lg relative">

                                    <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-red-500" />

                                </div>

                            </div>

                        </div>

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

            {/* ==================================================
                INVOICE MODAL
            ================================================== */}

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