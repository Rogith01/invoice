import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
} from "react";

import { BrowserMultiFormatReader } from "@zxing/browser";
import api from "../api";
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

    const [customerSuggestions, setCustomerSuggestions] =
    useState([]);

    const [showCustomerSuggestions, setShowCustomerSuggestions] =
    useState(false);

    const [selectedCustomerIndex, setSelectedCustomerIndex] =
    useState(-1);

    const customerSuggestionRefs = useRef([]);

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
                    "held_bills"
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
                "held_bills",
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

        const res = await api.get(
            `/api/customer/${phone}`
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
// SEARCH CUSTOMER PHONE SUGGESTIONS
// ==========================================

const searchCustomers = async (phone) => {

    if (phone.length < 2) {

        setCustomerSuggestions([]);

        setShowCustomerSuggestions(false);

        return;
    }

    try {

        const res = await api.get(
            `/api/customers/search/${phone}`
        );

        if (res.data.success) {

            setCustomerSuggestions(
                res.data.customers || []
            );

            setShowCustomerSuggestions(
                res.data.customers.length > 0
            );
        }

    } catch (err) {

        console.log(
            "Customer Search Error:",
            err
        );

        setCustomerSuggestions([]);

        setShowCustomerSuggestions(false);
    }
};
// ==========================================
// SELECT CUSTOMER SUGGESTION
// ==========================================

const selectCustomerSuggestion = (customer) => {

    if (!customer) {
        return;
    }

    const phone =
        String(customer.phone_number || "");

    setPhoneNumber(phone);

    setCustomerName(
        customer.customer_name || ""
    );

    setLoyaltyPoints(
        Number(
            customer.loyalty_points || 0
        )
    );

    setAvailablePoints(
        Number(
            customer.loyalty_points || 0
        )
    );

    setRedeemPoints(false);

    setCustomerSuggestions([]);

    setShowCustomerSuggestions(false);

    setSelectedCustomerIndex(-1);

    showToast(
        `Customer "${customer.customer_name}" selected.`,
        "success"
    );
};
// ==========================================
// FETCH PRODUCTS
// ==========================================

const fetchProducts = useCallback(async () => {

    try {

        const res = await api.get(
            "/api/products"
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
            await api.get(
                "/api/next-invoice-number"
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
            "Failed to get invoice number.",
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
        await api.post(
            "/api/invoices",
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

    <div className="min-h-screen bg-[#f7f8fa] text-slate-800">

        <Toast
            message={toast.message}
            type={toast.type}
            onClose={closeToast}
        />

        <form
            onSubmit={reviewInvoiceHandler}
            className="max-w-[1600px] mx-auto p-4 lg:p-6"
        >

            {/* ==================================================
                PAGE HEADER
            ================================================== */}

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">

                <div className="flex items-center gap-3">

                    <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center shadow-sm">

                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M6 2v20" />
                            <path d="M18 2v20" />
                            <path d="M2 6h20" />
                            <path d="M2 18h20" />
                        </svg>

                    </div>

                    <div>

                        <div className="flex items-center gap-2">

                            <h1 className="text-xl font-semibold text-slate-900">
                                New Sale
                            </h1>

                            <span className="text-[10px] font-bold tracking-wide bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded-md">
                                BILLING
                            </span>

                        </div>

                        <p className="text-xs text-slate-500 mt-0.5">
                            Create and complete a customer sale
                        </p>

                    </div>

                </div>

                <div className="flex items-center gap-2">

                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">

                        <span className="text-sm font-semibold text-slate-800">
                            {invoiceNumber}
                        </span>

                    </div>

                    <div className="hidden sm:flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">

                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="text-slate-400"
                        >
                            <rect
                                width="18"
                                height="18"
                                x="3"
                                y="4"
                                rx="2"
                            />
                            <line
                                x1="16"
                                x2="16"
                                y1="2"
                                y2="6"
                            />
                            <line
                                x1="8"
                                x2="8"
                                y1="2"
                                y2="6"
                            />
                            <line
                                x1="3"
                                x2="21"
                                y1="10"
                                y2="10"
                            />
                        </svg>

                        <span className="text-xs font-medium text-slate-600">
                            {today}
                        </span>

                        <span className="text-slate-300">
                            •
                        </span>

                        <span className="text-xs font-medium text-slate-600">
                            {currentTime}
                        </span>

                    </div>

                </div>

            </div>

{/* ==================================================
    QUICK ACTION BAR
================================================== */}

<div className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 mb-5 flex flex-wrap items-center gap-2">

    <span className="text-xs font-semibold text-slate-500 mr-1">
        Quick Actions
    </span>

    <button
        type="button"
        onClick={holdBillHandler}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-semibold transition"
    >
        <span>⏸</span>
        Hold Bill
    </button>

    <button
        type="button"
        onClick={() =>
            setShowHeldBills(true)
        }
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-semibold transition"
    >
        <span>▶</span>

        Resume Bill

        {heldBills.length > 0 && (
            <span className="bg-purple-600 text-white text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center">
                {heldBills.length}
            </span>
        )}

    </button>

    {/* Separator after Resume Bill */}

    <div className="hidden md:block h-5 w-px bg-slate-200 mx-1" />


    {/* Keyboard Shortcuts */}

    <div className="hidden md:flex items-center gap-2">

        <span className="text-[11px] text-slate-400">
            F2 Scan
        </span>

        <div className="h-5 w-px bg-slate-200" />

        <span className="text-[11px] text-slate-400">
            F3 Quantity
        </span>

        <div className="h-5 w-px bg-slate-200" />

        <span className="text-[11px] text-slate-400">
            F4 Payment
        </span>

        <div className="h-5 w-px bg-slate-200" />

        <span className="text-[11px] text-slate-400">
            F5 Review
        </span>

    </div>

</div>

            {/* ==================================================
                MAIN POS LAYOUT
            ================================================== */}

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_390px] gap-5">


                {/* ==================================================
                    LEFT CONTENT
                ================================================== */}

                <div className="space-y-5">


                    {/* ==================================================
                        CUSTOMER
                    ================================================== */}

                    <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">

                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">

                            <div>

                                <h2 className="text-sm font-semibold text-slate-900">
                                    Customer Details
                                </h2>

                                <p className="text-xs text-slate-400 mt-0.5">
                                    Customer and cashier information
                                </p>

                            </div>

                            <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">

                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="text-slate-500"
                                >
                                    <path d="M20 21a8 8 0 0 0-16 0" />
                                    <circle
                                        cx="12"
                                        cy="7"
                                        r="4"
                                    />
                                </svg>

                            </div>

                        </div>


                        <div className="p-5">

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                <div>

                                    <label
                                        htmlFor="customerName"
                                        className="block text-[11px] font-semibold text-slate-600 mb-1.5"
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
                                        placeholder="Enter customer name"
                                        className="w-full h-10 border border-slate-200 rounded-lg px-3 text-sm outline-none bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                                    />

                                </div>


<div>

    <label
        htmlFor="phoneNumber"
        className="block text-[11px] font-semibold text-slate-600 mb-1.5"
    >
        Phone Number
    </label>

    <div className="relative">

        <input
            type="text"
            id="phoneNumber"
            maxLength={10}
            value={phoneNumber}
            placeholder="10 digit number"

            onChange={(e) => {

                const value =
                    e.target.value.replace(
                        /\D/g,
                        ""
                    );

                setPhoneNumber(value);

                setSelectedCustomerIndex(-1);

                searchCustomers(value);

                if (value.length === 10) {

                    fetchCustomer(value);

                } else {

                    setCustomerName("");

                    setLoyaltyPoints(0);

                    setAvailablePoints(0);

                    setRedeemPoints(false);

                }

            }}

            onKeyDown={(e) => {

                if (
                    !showCustomerSuggestions ||
                    customerSuggestions.length === 0
                ) {
                    return;
                }

                if (e.key === "ArrowDown") {

                    e.preventDefault();

                    setSelectedCustomerIndex((prev) => {

                        const nextIndex =
                            prev <
                            customerSuggestions.length - 1
                                ? prev + 1
                                : 0;

                        setTimeout(() => {

                            customerSuggestionRefs.current[
                                nextIndex
                            ]?.scrollIntoView({
                                behavior: "smooth",
                                block: "nearest",
                            });

                        }, 0);

                        return nextIndex;

                    });

                }

                else if (e.key === "ArrowUp") {

                    e.preventDefault();

                    setSelectedCustomerIndex((prev) => {

                        const nextIndex =
                            prev > 0
                                ? prev - 1
                                : customerSuggestions.length - 1;

                        setTimeout(() => {

                            customerSuggestionRefs.current[
                                nextIndex
                            ]?.scrollIntoView({
                                behavior: "smooth",
                                block: "nearest",
                            });

                        }, 0);

                        return nextIndex;

                    });

                }

                else if (e.key === "Enter") {

                    e.preventDefault();

                    if (
                        selectedCustomerIndex >= 0
                    ) {

                        selectCustomerSuggestion(
                            customerSuggestions[
                                selectedCustomerIndex
                            ]
                        );

                    }

                }

                else if (e.key === "Escape") {

                    e.preventDefault();

                    setShowCustomerSuggestions(false);

                    setSelectedCustomerIndex(-1);

                }

            }}

            onBlur={() => {

                setTimeout(() => {

                    setShowCustomerSuggestions(false);

                }, 200);

            }}

            className="w-full h-10 border border-slate-200 rounded-lg px-3 text-sm outline-none bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
        />


        {showCustomerSuggestions && (

            <div
                className="
                    absolute
                    z-50
                    left-0
                    right-0
                    mt-1
                    bg-white
                    border
                    border-slate-200
                    rounded-lg
                    shadow-lg
                    overflow-y-auto
                    max-h-48
                "
            >

                {customerSuggestions.map(
                    (customer, index) => (

                        <button
                            key={customer.id}
                            type="button"

                            ref={(el) => {
                                customerSuggestionRefs.current[
                                    index
                                ] = el;
                            }}

                            onMouseDown={(e) => {

                                e.preventDefault();

                                selectCustomerSuggestion(
                                    customer
                                );

                            }}

                            className={`w-full text-left px-3 py-2.5 border-b border-slate-100 last:border-b-0 transition ${
                                selectedCustomerIndex === index
                                    ? "bg-blue-50"
                                    : "hover:bg-slate-50"
                            }`}
                        >

                            <div className="text-sm font-medium text-slate-800">

                                {customer.phone_number}

                            </div>

                            <div className="text-xs text-slate-500 mt-0.5">

                                {customer.customer_name}

                            </div>

                        </button>

                    )
                )}

            </div>

        )}

    </div>

</div>


                                <div>

                                    <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                                        Cashier
                                    </label>

                                    <input
                                        type="text"
                                        value={cashierName}
                                        readOnly
                                        className="w-full h-10 border border-slate-200 rounded-lg px-3 text-sm bg-slate-50 text-slate-500 outline-none"
                                    />

                                </div>

                            </div>


                            {/* LOYALTY */}

                            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 bg-purple-50/60 border border-purple-100 rounded-lg">

                                <div className="flex items-center gap-3">

                                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                                        ⭐
                                    </div>

                                    <div>

                                        <p className="text-[10px] font-semibold uppercase tracking-wide text-purple-500">
                                            Loyalty Balance
                                        </p>

                                        <p className="text-sm font-bold text-purple-800">
                                            {loyaltyPoints} Points
                                        </p>

                                    </div>

                                </div>

                                <label
                                    htmlFor="redeemPoints"
                                    className={`flex items-center gap-2 text-xs font-semibold ${
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

                                    Redeem available points

                                </label>

                            </div>

                        </div>

                    </section>


                    {/* ==================================================
                        PRODUCT SEARCH
                    ================================================== */}

                    <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">

                        <div className="px-5 py-4 border-b border-slate-100">

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                                <div>

                                    <h2 className="text-sm font-semibold text-slate-900">
                                        Add Products
                                    </h2>

                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Scan barcode or search products
                                    </p>

                                </div>

                                <button
                                    type="button"
                                    onClick={startBarcodeScanner}
                                    className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition"
                                >

                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="16"
                                        height="16"
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

                        </div>


                        <div className="p-5">

                            <div className="relative">

                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">

                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="17"
                                        height="17"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <circle
                                            cx="11"
                                            cy="11"
                                            r="8"
                                        />
                                        <path d="m21 21-4.3-4.3" />
                                    </svg>

                                </div>

                                <input
                                    type="text"
                                    id="barcode"
                                    value={barcode}
                                    ref={barcodeInputRef}
                                    onChange={(e) => {

                                        const value =
                                            e.target.value;

                                        setBarcode(
                                            value.replace(
                                                /[\r\n]/g,
                                                ""
                                            )
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
                                    className="w-full h-11 border border-slate-200 rounded-lg pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                                />

                            </div>

                            <div className="flex items-center justify-between mt-2">

                                <p className="text-[11px] text-slate-400">
                                    Barcode scanner ready
                                </p>

                                <span className="text-[10px] text-slate-400">
                                    Press Enter to add
                                </span>

                            </div>

                        </div>

                    </section>


                    {/* ==================================================
                        SALE ITEMS
                    ================================================== */}

                    <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">

                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">

                            <div>

                                <h2 className="text-sm font-semibold text-slate-900">
                                    Sale Items
                                </h2>

                                <p className="text-xs text-slate-400 mt-0.5">
                                    Products included in this sale
                                </p>

                            </div>

                            <span className="text-[10px] font-bold uppercase tracking-wide bg-slate-100 text-slate-500 px-2.5 py-1.5 rounded-md">

                                {items.filter(
                                    (item) =>
                                        item.name &&
                                        item.name.trim().length > 0
                                ).length}{" "}
                                Items

                            </span>

                        </div>


                        <div className="overflow-x-auto">

                            <table className="w-full">

                                <thead>

                                    <tr className="bg-slate-50 border-b border-slate-200">

                                        <th className="px-5 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 min-w-[260px]">
                                            Item
                                        </th>

                                        <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                            Qty
                                        </th>

                                        <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                            Price
                                        </th>

                                        <th className="px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                            Amount
                                        </th>

                                        <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500">
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
                                                    items.length - 1
                                                }
                                            />

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>


                        <div className="px-5 py-3 border-t border-slate-100">

                            <button
                                type="button"
                                onClick={addItemHandler}
                                className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700 px-2 py-2 rounded-lg hover:bg-blue-50 transition"
                            >

                                <span className="text-base">
                                    ＋
                                </span>

                                Add another item

                            </button>

                        </div>

                    </section>

                </div>


                {/* ==================================================
                    RIGHT - CURRENT SALE
                ================================================== */}

                <div className="xl:sticky xl:top-5 h-fit">

                    <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">


                        {/* CART HEADER */}

                        <div className="px-5 py-4 bg-slate-900 text-white">

                            <div className="flex items-center justify-between">

                                <div>

                                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                                        Current Sale
                                    </p>

                                    <h2 className="text-lg font-semibold mt-0.5">
                                        {invoiceNumber}
                                    </h2>

                                </div>

                                <div className="text-right">

                                    <p className="text-[10px] text-slate-400">
                                        Items
                                    </p>

                                    <p className="text-sm font-semibold">
                                        {items.filter(
                                            (item) =>
                                                item.name &&
                                                item.name.trim()
                                                    .length > 0
                                        ).length}
                                    </p>

                                </div>

                            </div>

                        </div>


                        <div className="p-5">


                            {/* ==================================================
                                CART ITEMS
                            ================================================== */}

                            <div className="max-h-[220px] overflow-y-auto pr-1">

                                {items.filter(
                                    (item) =>
                                        item.name &&
                                        item.name.trim().length > 0
                                ).length === 0 ? (

                                    <div className="py-8 text-center">

                                        <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-3">

                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                width="21"
                                                height="21"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.8"
                                            >
                                                <circle
                                                    cx="9"
                                                    cy="20"
                                                    r="1"
                                                />
                                                <circle
                                                    cx="20"
                                                    cy="20"
                                                    r="1"
                                                />
                                                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                                            </svg>

                                        </div>

                                        <p className="text-sm font-semibold text-slate-600">
                                            No items added
                                        </p>

                                        <p className="text-xs text-slate-400 mt-1">
                                            Scan or add a product
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
                                                key={item.id}
                                                className="flex items-center justify-between gap-3 py-3 border-b border-slate-100 last:border-0"
                                            >

                                                <div className="min-w-0">

                                                    <p className="text-xs font-semibold text-slate-700 truncate">
                                                        {item.name}
                                                    </p>

                                                    <p className="text-[11px] text-slate-400 mt-1">

                                                        {Math.floor(
                                                            Number(
                                                                item.qty || 0
                                                            )
                                                        )}

                                                        {" × ₹"}

                                                        {Number(
                                                            item.price || 0
                                                        ).toFixed(2)}

                                                    </p>

                                                </div>

                                                <p className="text-xs font-bold text-slate-800 whitespace-nowrap">
                                                    ₹
                                                    {Number(
                                                        item.amount || 0
                                                    ).toFixed(2)}
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
                                            className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5"
                                        >
                                            Discount %
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
                                            className="w-full h-9 border border-slate-200 rounded-lg px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />

                                    </div>

                                    <div>

                                        <label
                                            htmlFor="tax"
                                            className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5"
                                        >
                                            Tax %
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
                                            className="w-full h-9 border border-slate-200 rounded-lg px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />

                                    </div>

                                </div>

                            </div>


                            {/* ==================================================
                                TOTALS
                            ================================================== */}

                            <div className="mt-5 space-y-3">

                                <div className="flex justify-between text-xs">

                                    <span className="text-slate-500">
                                        Subtotal
                                    </span>

                                    <span className="font-medium text-slate-700">
                                        ₹{subtotal.toFixed(2)}
                                    </span>

                                </div>


                                <div className="flex justify-between text-xs">

                                    <span className="text-slate-500">
                                        Discount ({discount || 0}%)
                                    </span>

                                    <span className="font-medium text-red-500">
                                        - ₹{discountRate.toFixed(2)}
                                    </span>

                                </div>


                                <div className="flex justify-between text-xs">

                                    <span className="text-slate-500">
                                        Loyalty Discount
                                    </span>

                                    <span className="font-medium text-purple-600">
                                        - ₹
                                        {redeemPoints
                                            ? Number(
                                                availablePoints
                                            ).toFixed(2)
                                            : "0.00"}
                                    </span>

                                </div>


                                <div className="flex justify-between text-xs">

                                    <span className="text-slate-500">
                                        Tax ({tax || 0}%)
                                    </span>

                                    <span className="font-medium text-slate-700">
                                        + ₹{taxRate.toFixed(2)}
                                    </span>

                                </div>


                                <div className="border-t border-slate-200 pt-4 mt-4">

                                    <div className="flex items-end justify-between">

                                        <div>

                                            <p className="text-xs text-slate-500">
                                                Grand Total
                                            </p>

                                            <p className="text-2xl font-bold text-slate-900 mt-1">
                                                ₹{total.toFixed(2)}
                                            </p>

                                        </div>

                                        <span className="text-[10px] font-bold uppercase tracking-wide bg-blue-50 text-blue-600 px-2 py-1 rounded-md">
                                            Payable
                                        </span>

                                    </div>

                                </div>

                            </div>


                            {/* ==================================================
                                PAYMENT
                            ================================================== */}

                            <div className="mt-5 pt-5 border-t border-slate-200">

                                <label
                                    htmlFor="paymentMethod"
                                    className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5"
                                >
                                    Payment Method
                                </label>

                                <select
                                    id="paymentMethod"
                                    value={paymentMethod}
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
                                    className="w-full h-10 border border-slate-200 rounded-lg px-3 text-sm font-medium outline-none bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >

                                    <option value="Cash">
                                        Cash
                                    </option>

                                    <option value="Online">
                                        Online
                                    </option>

                                </select>


                                {paymentMethod === "Cash" && (

                                    <div className="mt-4">

                                        <label
                                            htmlFor="cashReceived"
                                            className="block text-[10px] font-bold uppercase tracking-wide text-slate-500 mb-1.5"
                                        >
                                            Cash Received
                                        </label>

                                        <input
                                            type="number"
                                            id="cashReceived"
                                            min="0"
                                            step="0.01"
                                            value={cashReceived}
                                            onChange={(e) =>
                                                setCashReceived(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Enter amount received"
                                            className={`w-full h-10 border rounded-lg px-3 text-sm outline-none transition ${
                                                insufficientCash
                                                    ? "border-red-400 focus:ring-2 focus:ring-red-100"
                                                    : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                            }`}
                                        />


                                        {insufficientCash && (

                                            <p className="text-[11px] text-red-600 font-semibold mt-1.5">
                                                ⚠ Insufficient cash amount
                                            </p>

                                        )}


                                        <div className="flex items-center justify-between mt-3 px-3 py-2.5 bg-emerald-50 border border-emerald-100 rounded-lg">

                                            <span className="text-xs font-medium text-emerald-700">
                                                Change to Return
                                            </span>

                                            <span className="text-sm font-bold text-emerald-700">
                                                ₹ {changeAmount.toFixed(2)}
                                            </span>

                                        </div>

                                    </div>

                                )}

                            </div>


                            {/* ==================================================
                                REVIEW BUTTON
                            ================================================== */}

                            <button
                                type="submit"
                                ref={reviewBtnRef}
                                className="hidden md:flex w-full mt-5 h-11 items-center justify-center gap-2 bg-slate-900 hover:bg-slate-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg shadow-sm transition"
                            >

                                Review Invoice

                                <span className="text-[10px] bg-white/15 px-2 py-1 rounded">
                                    F5
                                </span>

                            </button>

                        </div>

                    </section>

                </div>

            </div>


            {/* ==================================================
                MOBILE REVIEW
            ================================================== */}

            <div className="md:hidden mt-5">

                <button
                    type="submit"
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition"
                >
                    Review Invoice • ₹{total.toFixed(2)}
                </button>

            </div>

        </form>


        {/* ==================================================
            HELD BILLS MODAL
        ================================================== */}

        {showHeldBills && (

            <div className="fixed inset-0 z-[9998] bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">

                <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden">

                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">

                        <div>

                            <h2 className="text-lg font-semibold text-slate-900">
                                Held Bills
                            </h2>

                            <p className="text-xs text-slate-500 mt-0.5">
                                Select a bill to continue billing
                            </p>

                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setShowHeldBills(false)
                            }
                            className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 text-xl transition"
                        >
                            ×
                        </button>

                    </div>


                    <div className="p-5 overflow-y-auto max-h-[60vh]">

                        {heldBills.length === 0 ? (

                            <div className="text-center py-12">

                                <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 flex items-center justify-center mb-4 text-2xl">
                                    🛒
                                </div>

                                <h3 className="text-sm font-semibold text-slate-700">
                                    No Held Bills
                                </h3>

                                <p className="text-xs text-slate-400 mt-1">
                                    Held bills will appear here.
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
                                                className="border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition"
                                            >

                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                                                    <div>

                                                        <div className="flex items-center gap-2">

                                                            <h3 className="text-sm font-bold text-slate-800">
                                                                {
                                                                    bill.invoiceNumber
                                                                }
                                                            </h3>

                                                            <span className="text-[9px] font-bold bg-orange-50 text-orange-600 border border-orange-100 px-2 py-1 rounded-md">
                                                                HELD
                                                            </span>

                                                        </div>

                                                        <p className="text-xs text-slate-500 mt-1">

                                                            Customer:{" "}

                                                            <span className="font-medium text-slate-700">
                                                                {
                                                                    bill.customerName ||
                                                                    "Walk-in Customer"
                                                                }
                                                            </span>

                                                        </p>

                                                        <p className="text-[11px] text-slate-400 mt-1">

                                                            {itemCount} items
                                                            {" • "}
                                                            {heldDate}
                                                            {" • "}
                                                            {heldTime}

                                                        </p>

                                                    </div>


                                                    <p className="text-lg font-bold text-slate-900">

                                                        ₹
                                                        {Number(
                                                            bill.total || 0
                                                        ).toFixed(2)}

                                                    </p>

                                                </div>


                                                <div className="flex gap-2 mt-4">

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            resumeBillHandler(
                                                                bill
                                                            )
                                                        }
                                                        className="flex-1 h-9 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition"
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
                                                        className="flex-1 h-9 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg transition"
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


                    <div className="border-t border-slate-200 p-4">

                        <button
                            type="button"
                            onClick={() =>
                                setShowHeldBills(false)
                            }
                            className="w-full h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition"
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

            <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">

                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">

                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">

                        <div>

                            <h2 className="text-sm font-semibold text-slate-900">
                                Scan Barcode
                            </h2>

                            <p className="text-xs text-slate-500 mt-0.5">
                                Point your camera at the barcode
                            </p>

                        </div>

                        <button
                            type="button"
                            onClick={
                                stopBarcodeScanner
                            }
                            className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-red-600 text-xl transition"
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

                            <div className="w-64 h-32 border-2 border-white/80 rounded-lg relative shadow-lg">

                                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-red-500 shadow-lg" />

                            </div>

                        </div>

                    </div>


                    <div className="p-4">

                        <button
                            type="button"
                            onClick={
                                stopBarcodeScanner
                            }
                            className="w-full h-10 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition"
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