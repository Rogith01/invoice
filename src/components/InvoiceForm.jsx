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
    const [invoiceNumber, setInvoiceNumber] = useState("INV-0001");

    const user = JSON.parse(
        sessionStorage.getItem("user")
    );

    const [cashierName, setCashierName] = useState(
        user?.username || ""
    );

    const [counterName, setCounterName] = useState(
        user?.counterName || "Counter 1"
    );

    const [customerName, setCustomerName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [customerSuggestions, setCustomerSuggestions] = useState([]);
    const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
    const [selectedCustomerIndex, setSelectedCustomerIndex] = useState(-1);
    const customerSuggestionRefs = useRef([]);

    // ==========================================
    // LOYALTY STATES
    // ==========================================

    const [loyaltyPoints, setLoyaltyPoints] = useState(0);
    const [redeemPoints, setRedeemPoints] = useState(false);
    const [availablePoints, setAvailablePoints] = useState(0);

    // ==========================================
    // FREEZE VALUES FOR REVIEW INVOICE MODAL
    // ==========================================

    const [redeemedAmount, setRedeemedAmount] = useState(0);
    const [reviewTotal, setReviewTotal] = useState(0);
    const [reviewCashAmount, setReviewCashAmount] = useState(0);
    const [reviewOnlineAmount, setReviewOnlineAmount] = useState(0);

    // ==========================================
    // PAYMENT
    // ==========================================

    const [paymentMethod, setPaymentMethod] = useState("Cash");
    const [cashReceived, setCashReceived] = useState("");

    // Split Payment States
    const [splitCash, setSplitCash] = useState("");
    const [splitOnline, setSplitOnline] = useState("");

    // ==========================================
    // PRODUCTS
    // ==========================================

    const [itemOptions, setItemOptions] = useState([]);

    // ==========================================
    // REFS
    // ==========================================

    const [barcode, setBarcode] = useState("");
    const barcodeInputRef = useRef(null);
    const paymentMethodSelectRef = useRef(null);
    const cashReceivedInputRef = useRef(null);
    const phoneInputRef = useRef(null);
    const reviewBtnRef = useRef(null);

    // ==========================================
    // SOUNDS
    // ==========================================

    const scanSoundRef = useRef(null);
    const barcodeErrorSoundRef = useRef(null);
    const successSoundRef = useRef(null);
    const toastErrorSoundRef = useRef(null);

    useEffect(() => {
        scanSoundRef.current = new Audio("/barcode-beep.mp3");
        scanSoundRef.current.volume = 1.0;

        barcodeErrorSoundRef.current = new Audio("/barcode-error.mp3");
        barcodeErrorSoundRef.current.volume = 1.0;

        successSoundRef.current = new Audio("/success-tone.mp3");
        successSoundRef.current.volume = 1.0;

        toastErrorSoundRef.current = new Audio("/error-tone.mp3");
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

    const [showScanner, setShowScanner] = useState(false);
    const videoRef = useRef(null);
    const codeReaderRef = useRef(null);
    const scannerControlsRef = useRef(null);
    const scannerTimeoutRef = useRef(null);
    const scannerSessionRef = useRef(0);
    const scannerStartingRef = useRef(false);
    const barcodeScanLockRef = useRef(true);

    const [currentTime, setCurrentTime] = useState(
        new Date().toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        })
    );

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

    const [showHeldBills, setShowHeldBills] = useState(false);
    const [heldBills, setHeldBills] = useState(() => {
        try {
            const savedBills = localStorage.getItem("held_bills");
            return savedBills ? JSON.parse(savedBills) : [];
        } catch (error) {
            console.error("Error loading held bills:", error);
            return [];
        }
    });

    const [toast, setToast] = useState({
        message: "",
        type: "success",
    });

    const showToast = useCallback((message, type = "success", playSound = true) => {
        if (playSound) {
            if (type === "success" && successSoundRef.current) {
                successSoundRef.current.currentTime = 0;
                successSoundRef.current.play().catch(() => {});
            } else if ((type === "error" || type === "warning") && toastErrorSoundRef.current) {
                toastErrorSoundRef.current.currentTime = 0;
                toastErrorSoundRef.current.play().catch(() => {});
            }
        }
        setToast({ message, type });
    }, []);

    const closeToast = useCallback(() => {
        setToast({ message: "", type: "success" });
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem("held_bills", JSON.stringify(heldBills));
        } catch (error) {
            console.error("Error saving held bills:", error);
        }
    }, [heldBills]);

    // ==========================================
    // FETCH CUSTOMER
    // ==========================================

    const fetchCustomer = async (phone) => {
        if (phone.length !== 10) return;

        try {
            const res = await api.get(`/api/customer/${phone}`);
            if (res.data.success) {
                setCustomerName(res.data.customer.customer_name);
                setLoyaltyPoints(Number(res.data.customer.loyalty_points || 0));
                setAvailablePoints(Number(res.data.customer.loyalty_points || 0));
                showToast(`Customer "${res.data.customer.customer_name}" found successfully.`, "success");
            } else {
                setCustomerName("");
                setLoyaltyPoints(0);
                setAvailablePoints(0);
                setRedeemPoints(false);
                showToast("Customer not found. You can continue as a new customer.", "info");
            }
        } catch (err) {
            setCustomerName("");
            setLoyaltyPoints(0);
            setAvailablePoints(0);
            setRedeemPoints(false);
            showToast("Unable to find customer.", "error");
        }
    };

    const searchCustomers = async (phone) => {
        if (phone.length < 2) {
            setCustomerSuggestions([]);
            setShowCustomerSuggestions(false);
            setSelectedCustomerIndex(-1);
            return;
        }

        try {
            const res = await api.get(`/api/customers/search/${phone}`);
            if (res.data.success) {
                setCustomerSuggestions(res.data.customers || []);
                setShowCustomerSuggestions((res.data.customers || []).length > 0);
                setSelectedCustomerIndex(-1);
            }
        } catch (err) {
            setCustomerSuggestions([]);
            setShowCustomerSuggestions(false);
            setSelectedCustomerIndex(-1);
        }
    };

    const selectCustomerSuggestion = (customer) => {
        if (!customer) return;
        const phone = String(customer.phone_number || "");
        setPhoneNumber(phone);
        setCustomerName(customer.customer_name || "");
        setLoyaltyPoints(Number(customer.loyalty_points || 0));
        setAvailablePoints(Number(customer.loyalty_points || 0));
        setRedeemPoints(false);
        setCustomerSuggestions([]);
        setShowCustomerSuggestions(false);
        setSelectedCustomerIndex(-1);
        showToast(`Customer "${customer.customer_name}" selected.`, "success");
        setTimeout(() => barcodeInputRef.current?.focus(), 50);
    };

    // Keyboard navigation inside Customer Phone suggestions
    const handlePhoneKeyDown = (e) => {
        if (!showCustomerSuggestions || customerSuggestions.length === 0) {
            if (e.key === "Enter") {
                e.preventDefault();
                barcodeInputRef.current?.focus();
            }
            return;
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedCustomerIndex((prev) => {
                const nextIndex = prev < customerSuggestions.length - 1 ? prev + 1 : 0;
                customerSuggestionRefs.current[nextIndex]?.scrollIntoView({ block: "nearest" });
                return nextIndex;
            });
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedCustomerIndex((prev) => {
                const nextIndex = prev > 0 ? prev - 1 : customerSuggestions.length - 1;
                customerSuggestionRefs.current[nextIndex]?.scrollIntoView({ block: "nearest" });
                return nextIndex;
            });
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (selectedCustomerIndex >= 0 && selectedCustomerIndex < customerSuggestions.length) {
                selectCustomerSuggestion(customerSuggestions[selectedCustomerIndex]);
            } else if (customerSuggestions.length > 0) {
                selectCustomerSuggestion(customerSuggestions[0]);
            } else {
                setShowCustomerSuggestions(false);
                barcodeInputRef.current?.focus();
            }
        } else if (e.key === "Escape") {
            setShowCustomerSuggestions(false);
            setSelectedCustomerIndex(-1);
        }
    };

    // ==========================================
    // FETCH PRODUCTS & INVOICE NUMBER
    // ==========================================

    const fetchProducts = useCallback(async () => {
        try {
            const res = await api.get("/api/products");
            if (res.data.success) {
                const products = res.data.products.map((p) => ({
                    id: p.id,
                    name: p.product_name,
                    price: Number(p.price),
                    stock: Number(p.stock_quantity) || 0,
                    barcode: p.barcode || "",
                }));
                setItemOptions(products);
            }
        } catch (err) {
            showToast("Failed to load products.", "error");
        }
    }, [showToast]);

    const fetchInvoiceNumber = useCallback(async () => {
        try {
            const response = await api.get("/api/next-invoice-number");
            if (response.data.success) {
                setInvoiceNumber(response.data.invoiceNumber);
            }
        } catch (error) {
            showToast("Failed to get invoice number.", "error");
        }
    }, [showToast]);

    // ==========================================
    // KEYBOARD SHORTCUTS
    // ==========================================

    useEffect(() => {
        fetchInvoiceNumber();
        fetchProducts();

        const handleShortcut = (event) => {
            if (event.key === "F2") {
                event.preventDefault();
                barcodeInputRef.current?.focus();
                barcodeInputRef.current?.select();
            } else if (event.key === "F3") {
                event.preventDefault();
                const quantityInputs = document.querySelectorAll('input[name="qty"]');
                if (quantityInputs.length > 0) {
                    const lastQuantityInput = quantityInputs[quantityInputs.length - 1];
                    lastQuantityInput.focus();
                    lastQuantityInput.select();
                }
            } else if (event.key === "F4") {
                event.preventDefault();
                if (paymentMethodSelectRef.current) {
                    paymentMethodSelectRef.current.focus();
                }
            } else if (event.key === "F5") {
                event.preventDefault();
                reviewBtnRef.current?.click();
            }
        };

        window.addEventListener("keydown", handleShortcut);
        return () => window.removeEventListener("keydown", handleShortcut);
    }, [fetchInvoiceNumber, fetchProducts]);

    // Keyboard support on the Payment Method Dropdown
    const handlePaymentKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (paymentMethod === "Cash") {
                cashReceivedInputRef.current?.focus();
            } else if (paymentMethod === "Split") {
                const splitInput = document.getElementById("splitCashInput");
                splitInput?.focus();
            } else {
                barcodeInputRef.current?.focus();
            }
        }
    };

    // ==========================================
    // CAMERA SCANNER
    // ==========================================

    const stopBarcodeScanner = useCallback(() => {
        scannerSessionRef.current += 1;
        barcodeScanLockRef.current = true;
        scannerStartingRef.current = false;

        if (scannerTimeoutRef.current) {
            clearTimeout(scannerTimeoutRef.current);
            scannerTimeoutRef.current = null;
        }
        if (scannerControlsRef.current) {
            try { scannerControlsRef.current.stop(); } catch (e) {}
            scannerControlsRef.current = null;
        }
        if (codeReaderRef.current) {
            try { codeReaderRef.current.reset(); } catch (e) {}
            codeReaderRef.current = null;
        }
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
            videoRef.current.srcObject = null;
        }
        setShowScanner(false);
    }, []);

    const startBarcodeScanner = async () => {
        if (scannerStartingRef.current) return;
        if (codeReaderRef.current || scannerControlsRef.current || scannerTimeoutRef.current) {
            stopBarcodeScanner();
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        const sessionId = scannerSessionRef.current + 1;
        scannerSessionRef.current = sessionId;
        scannerStartingRef.current = true;
        barcodeScanLockRef.current = false;
        setShowScanner(true);

        scannerTimeoutRef.current = setTimeout(async () => {
            scannerTimeoutRef.current = null;
            if (sessionId !== scannerSessionRef.current) {
                scannerStartingRef.current = false;
                return;
            }

            if (!videoRef.current) {
                scannerStartingRef.current = false;
                barcodeScanLockRef.current = true;
                setShowScanner(false);
                showToast("Camera could not be started.", "error");
                return;
            }

            try {
                const codeReader = new BrowserMultiFormatReader();
                codeReaderRef.current = codeReader;
                const controls = await codeReader.decodeFromVideoDevice(
                    undefined,
                    videoRef.current,
                    (result) => {
                        if (sessionId !== scannerSessionRef.current || barcodeScanLockRef.current || !result) return;
                        barcodeScanLockRef.current = true;
                        handleBarcodeScan(result.getText().trim());
                        stopBarcodeScanner();
                    }
                );

                if (sessionId !== scannerSessionRef.current) {
                    try { controls.stop(); } catch (e) {}
                    scannerStartingRef.current = false;
                    return;
                }
                scannerControlsRef.current = controls;
                scannerStartingRef.current = false;
            } catch (error) {
                if (sessionId === scannerSessionRef.current) {
                    barcodeScanLockRef.current = true;
                    scannerStartingRef.current = false;
                    showToast("Unable to start camera. Please check permissions.", "error");
                    stopBarcodeScanner();
                }
            }
        }, 300);
    };

    useEffect(() => {
        return () => stopBarcodeScanner();
    }, [stopBarcodeScanner]);

    useEffect(() => {
        barcodeInputRef.current?.focus();
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(
                new Date().toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                })
            );
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // ==========================================
    // CALCULATIONS (WHOLE NUMBERS FOR DISCOUNT & TAX)
    // ==========================================

    const subtotal = items.reduce((prev, curr) => {
        if (curr.name && curr.name.trim().length > 0) {
            return prev + Number(curr.price || 0) * Math.floor(Number(curr.qty || 0));
        }
        return prev;
    }, 0);

    const taxRate = Math.round((Number(tax || 0) * subtotal) / 100);
    const discountRate = Math.round((Number(discount || 0) * subtotal) / 100);
    const loyaltyDiscount = redeemPoints ? Number(availablePoints || 0) : 0;
    const total = Math.max(0, subtotal - discountRate - loyaltyDiscount + taxRate);

    // Split Payment calculations
    const splitCashNum = Number(splitCash || 0);
    const splitOnlineNum = Number(splitOnline || 0);
    const splitSum = Number((splitCashNum + splitOnlineNum).toFixed(2));
    const roundedTotal = Number(total.toFixed(2));
    const splitDifference = Number((roundedTotal - splitSum).toFixed(2));

    const changeAmount = paymentMethod === "Cash" ? Math.max(0, Number(cashReceived || 0) - total) : 0;
    const insufficientCash = paymentMethod === "Cash" && cashReceived !== "" && Number(cashReceived) < total;

    // Auto-balance split fields
    const handleSplitCashChange = (value) => {
        setSplitCash(value);
        if (value === "") {
            setSplitOnline("");
            return;
        }
        const entered = parseFloat(value) || 0;
        const remaining = Math.max(0, total - entered);
        setSplitOnline(remaining > 0 ? remaining.toString() : "0");
    };

    const handleSplitOnlineChange = (value) => {
        setSplitOnline(value);
        if (value === "") {
            setSplitCash("");
            return;
        }
        const entered = parseFloat(value) || 0;
        const remaining = Math.max(0, total - entered);
        setSplitCash(remaining > 0 ? remaining.toString() : "0");
    };

    // ==========================================
    // HOLD BILL
    // ==========================================

    const holdBillHandler = () => {
        const validItems = items.filter((item) => item.name && item.name.trim().length > 0);
        if (validItems.length === 0) {
            showToast("Add at least one product before holding the bill.", "warning");
            return;
        }

        const heldBill = {
            id: uid(8),
            invoiceNumber,
            cashierName,
            counterName,
            customerName,
            phoneNumber,
            loyaltyPoints,
            redeemPoints,
            availablePoints,
            redeemedAmount,
            discount,
            tax,
            paymentMethod,
            splitCash,
            splitOnline,
            items: validItems.map((item) => ({ ...item })),
            subtotal,
            discountRate,
            taxRate,
            loyaltyDiscount,
            total,
            createdAt: new Date().toISOString(),
        };

        setHeldBills((prevBills) => [...prevBills, heldBill]);
        stopBarcodeScanner();

        setItems([{ id: uid(6), name: "", qty: 1, price: "0.00", amount: 0 }]);
        setPhoneNumber("");
        setCustomerName("");
        setLoyaltyPoints(0);
        setCashierName(user?.username || "");
        setCounterName(user?.counterName || "Counter 1");
        setRedeemPoints(false);
        setAvailablePoints(0);
        setRedeemedAmount(0);
        setReviewTotal(0);
        setDiscount("2");
        setTax("5");
        setPaymentMethod("Cash");
        setCashReceived("");
        setSplitCash("");
        setSplitOnline("");
        setBarcode("");
        fetchInvoiceNumber();

        showToast(`Bill ${invoiceNumber} has been held successfully.`, "success");
        setTimeout(() => barcodeInputRef.current?.focus(), 100);
    };

    // ==========================================
    // RESUME BILL
    // ==========================================

    const resumeBillHandler = (bill) => {
        setInvoiceNumber(bill.invoiceNumber);
        setCashierName(bill.cashierName || user?.username || "");
        setCounterName(bill.counterName || user?.counterName || "Counter 1");
        setCustomerName(bill.customerName || "");
        setPhoneNumber(bill.phoneNumber || "");
        setLoyaltyPoints(Number(bill.loyaltyPoints || 0));
        setRedeemPoints(Boolean(bill.redeemPoints));
        setAvailablePoints(Number(bill.availablePoints || 0));
        setRedeemedAmount(Number(bill.redeemedAmount || 0));
        setDiscount(bill.discount ?? "2");
        setTax(bill.tax ?? "5");
        setPaymentMethod(bill.paymentMethod || "Cash");
        setSplitCash(bill.splitCash || "");
        setSplitOnline(bill.splitOnline || "");
        setItems(bill.items.map((item) => ({ ...item, id: uid(6) })));
        setHeldBills((prevBills) => prevBills.filter((b) => b.id !== bill.id));
        setShowHeldBills(false);
        setBarcode("");

        setTimeout(() => barcodeInputRef.current?.focus(), 100);
        showToast(`Bill ${bill.invoiceNumber} resumed successfully.`, "success");
    };

    const deleteHeldBillHandler = (billId) => {
        setHeldBills((prevBills) => prevBills.filter((b) => b.id !== billId));
        showToast("Held bill deleted successfully.", "success");
    };

    // ==========================================
    // REVIEW / SUBMIT INVOICE
    // ==========================================

    const reviewInvoiceHandler = async (event) => {
        event.preventDefault();

        if (paymentMethod === "Cash") {
            if (cashReceived === "" || Number(cashReceived) <= 0) {
                showToast("Please enter the cash received from customer.", "warning");
                return;
            }
            if (Number(cashReceived) < total) {
                showToast(`Insufficient cash. Customer needs to pay ₹${total.toFixed(2)}.`, "warning");
                return;
            }
        }

        if (paymentMethod === "Split") {
            if (splitCash === "" || splitOnline === "") {
                showToast("Please enter both Cash and Online amounts.", "warning");
                return;
            }

            if (Math.abs(splitDifference) > 0.05) {
                showToast(
                    `Split total (₹${splitSum.toFixed(2)}) must equal invoice total (₹${roundedTotal.toFixed(2)}). Difference: ₹${Math.abs(splitDifference).toFixed(2)}`,
                    "warning"
                );
                return;
            }
        }

        if (!customerName || customerName.trim().length === 0) {
            showToast("Please enter customer name.", "warning");
            return;
        }

        if (!phoneNumber || phoneNumber.length !== 10) {
            showToast("Please enter a valid 10-digit phone number.", "warning");
            return;
        }

        const validItems = items.filter((item) => item.name && item.name.trim().length > 0);
        if (validItems.length === 0) {
            showToast("Please add at least one product to the invoice.", "warning");
            return;
        }

        if (total < 0) {
            showToast("Invoice total cannot be negative.", "warning");
            return;
        }

        const requestedStock = {};
        for (const item of validItems) {
            const product = itemOptions.find((opt) => opt.name === item.name);
            if (!product) {
                showToast(`${item.name} is not available.`, "error");
                return;
            }
            const requestedQty = Math.floor(Number(item.qty || 0));
            if (requestedQty <= 0) {
                showToast(`Please enter a valid quantity for ${item.name}.`, "warning");
                return;
            }
            requestedStock[item.name] = (requestedStock[item.name] || 0) + requestedQty;
        }

        for (const productName in requestedStock) {
            const product = itemOptions.find((opt) => opt.name === productName);
            const totalRequested = requestedStock[productName];
            const availableStock = Number(product.stock || 0);

            if (totalRequested > availableStock) {
                showToast(`Only ${availableStock} stock available for ${productName}. You requested ${totalRequested}.`, "warning");
                return;
            }
        }

        const invoiceLoyaltyDiscount = redeemPoints ? Number(availablePoints || 0) : 0;
        const invoiceTotal = Number(total.toFixed(2));

        let finalCash = 0;
        let finalOnline = 0;

        if (paymentMethod === "Cash") {
            finalCash = invoiceTotal;
            finalOnline = 0;
        } else if (paymentMethod === "Online") {
            finalCash = 0;
            finalOnline = invoiceTotal;
        } else if (paymentMethod === "Split") {
            finalCash = Number(parseFloat(splitCash).toFixed(2)) || 0;
            finalOnline = Number(parseFloat(splitOnline).toFixed(2)) || 0;
        }

        const invoiceItems = validItems.map((item) => {
            const itemQty = Math.floor(Number(item.qty || 0));
            const itemPrice = Number(item.price || 0);
            return {
                ...item,
                qty: itemQty,
                price: itemPrice,
                amount: itemPrice * itemQty,
            };
        });

        const invoiceData = {
            phoneNumber,
            cashierName,
            counterName,
            customerName,
            subtotal,
            discountRate,
            taxRate,
            total: invoiceTotal,
            cashAmount: finalCash,
            onlineAmount: finalOnline,
            cash_amount: finalCash,
            online_amount: finalOnline,
            items: invoiceItems,
            redeemPoints,
            paymentMethod,
        };

        try {
            const response = await api.post("/api/invoices", invoiceData);

            setRedeemedAmount(invoiceLoyaltyDiscount);
            setReviewTotal(invoiceTotal);
            setReviewCashAmount(finalCash);
            setReviewOnlineAmount(finalOnline);
            setInvoiceNumber(response.data.invoiceNumber);

            await fetchProducts();
            await fetchCustomer(phoneNumber);

            setIsOpen(true);
            showToast(`Invoice ${response.data.invoiceNumber} saved successfully!`, "success");
        } catch (error) {
            console.error("Error saving invoice:", error);
            showToast(error.response?.data?.message || "Failed to save invoice.", "error");
        }
    };

    // ==========================================
    // NEW INVOICE RESET
    // ==========================================

    const addNextInvoiceHandler = async () => {
        stopBarcodeScanner();
        setShowHeldBills(false);
        await fetchInvoiceNumber();

        setItems([{ id: uid(6), name: "", qty: 1, price: "0.00", amount: 0 }]);
        setPhoneNumber("");
        setCustomerName("");
        setLoyaltyPoints(0);
        setCashierName(user?.username || "");
        setCounterName(user?.counterName || "Counter 1");
        setRedeemPoints(false);
        setAvailablePoints(0);
        setRedeemedAmount(0);
        setReviewTotal(0);
        setReviewCashAmount(0);
        setReviewOnlineAmount(0);
        setDiscount("2");
        setTax("5");
        setPaymentMethod("Cash");
        setCashReceived("");
        setSplitCash("");
        setSplitOnline("");
        setBarcode("");

        setTimeout(() => barcodeInputRef.current?.focus(), 100);
        showToast("Ready for a new invoice.", "info");
    };

    const addItemHandler = () => {
        setItems((prevItems) => [
            ...prevItems,
            { id: uid(6), name: "", qty: 1, price: "0.00", amount: 0 },
        ]);
    };

    const handleBarcodeScan = (value) => {
        const scannedBarcode = String(value || "").trim();
        if (!scannedBarcode) return;

        const product = itemOptions.find(
            (item) => item.barcode && String(item.barcode).trim() === scannedBarcode
        );

        if (!product) {
            barcodeErrorSoundRef.current?.play().catch(() => {});
            showToast(`No product found for barcode: ${scannedBarcode}`, "warning", false);
            setBarcode("");
            setTimeout(() => barcodeInputRef.current?.focus(), 100);
            return;
        }

        if (Number(product.stock) <= 0) {
            barcodeErrorSoundRef.current?.play().catch(() => {});
            showToast(`${product.name} is out of stock.`, "warning", false);
            setBarcode("");
            setTimeout(() => barcodeInputRef.current?.focus(), 100);
            return;
        }

        const existingItem = items.find((item) => item.name === product.name);

        if (existingItem) {
            const currentQty = Math.floor(Number(existingItem.qty || 0));
            if (currentQty + 1 > Number(product.stock)) {
                barcodeErrorSoundRef.current?.play().catch(() => {});
                showToast(`Only ${product.stock} stock available for ${product.name}.`, "warning", false);
                setBarcode("");
                setTimeout(() => barcodeInputRef.current?.focus(), 100);
                return;
            }

            const newQty = currentQty + 1;
            setItems((prevItems) =>
                prevItems.map((item) =>
                    item.id === existingItem.id
                        ? { ...item, qty: newQty, price: product.price, amount: product.price * newQty }
                        : item
                )
            );
        } else {
            setItems((prevItems) => {
                const firstEmptyItem = prevItems.find((item) => !item.name || item.name.trim() === "");
                if (firstEmptyItem) {
                    return prevItems.map((item) =>
                        item.id === firstEmptyItem.id
                            ? { ...item, name: product.name, qty: 1, price: product.price, amount: product.price }
                            : item
                    );
                }
                return [...prevItems, { id: uid(6), name: product.name, qty: 1, price: product.price, amount: product.price }];
            });
        }

        successSoundRef.current?.play().catch(() => {});
        showToast(`${product.name} added successfully.`, "success", false);
        setBarcode("");
        setTimeout(() => barcodeInputRef.current?.focus(), 100);
    };

    const deleteItemHandler = (id) => {
        setItems((prevItems) => prevItems.filter((item) => item.id !== id));
    };

    const edtiItemHandler = (event) => {
        const { id, name, value } = event.target;

        if (name === "name") {
            const selectedItem = itemOptions.find((opt) => opt.name === value);
            if (!selectedItem) {
                setItems((prevItems) =>
                    prevItems.map((item) =>
                        item.id === id ? { ...item, name: value, qty: 1, price: "0.00", amount: 0 } : item
                    )
                );
                return;
            }

            setItems((prevItems) =>
                prevItems.map((item) =>
                    item.id === id ? { ...item, name: selectedItem.name, qty: 1, price: selectedItem.price, amount: selectedItem.price } : item
                )
            );
            return;
        }

        const updatedItems = items.map((item) => {
            if (item.id === id) {
                let newItem = { ...item, [name]: value };
                newItem.amount = Number(newItem.price || 0) * Math.floor(Number(newItem.qty || 0));
                return newItem;
            }
            return item;
        });

        setItems(updatedItems);
    };

    return (
        <div className="min-h-screen bg-[#f7f8fa] text-slate-800">
            <Toast message={toast.message} type={toast.type} onClose={closeToast} />

            <form onSubmit={reviewInvoiceHandler} className="max-w-[1600px] mx-auto p-4 lg:p-6">
                {/* PAGE HEADER */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M6 2v20"/><path d="M18 2v20"/><path d="M2 6h20"/><path d="M2 18h20"/></svg>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-semibold text-slate-900">New Sale</h1>
                                <span className="text-[10px] font-bold tracking-wide bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded-md">
                                    BILLING
                                </span>
                                <span className="text-[10px] font-bold tracking-wide bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-md">
                                    📍 {counterName}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">Create and complete a customer sale</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                            <span className="text-sm font-semibold text-slate-800">{invoiceNumber}</span>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                            <span className="text-xs font-medium text-slate-600">{today} • {currentTime}</span>
                        </div>
                    </div>
                </div>

                {/* QUICK ACTION BAR */}
                <div className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 mb-5 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 mr-1">Quick Actions</span>
                    <button type="button" onClick={holdBillHandler} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-semibold transition">
                        <span>⏸</span> Hold Bill
                    </button>
                    <button type="button" onClick={() => setShowHeldBills(true)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-semibold transition">
                        <span>▶</span> Resume Bill {heldBills.length > 0 && <span className="bg-purple-600 text-white text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center">{heldBills.length}</span>}
                    </button>
                    <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-400 ml-auto">
                        <span>F2 Scan</span> • <span>F3 Quantity</span> • <span>F4 Payment</span> • <span>F5 Review</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_420px] gap-5">
                    {/* LEFT PANEL */}
                    <div className="space-y-5">
                        {/* CUSTOMER SECTION */}
                        <section className="bg-white border border-slate-200 rounded-xl p-5">
                            <h2 className="text-sm font-semibold text-slate-900 mb-4">Customer Details</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">Customer Name</label>
                                    <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter customer name" className="w-full h-10 border border-slate-200 rounded-lg px-3 text-sm outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">Phone Number</label>
                                    <div className="relative">
                                        <input
                                            ref={phoneInputRef}
                                            type="text"
                                            maxLength={10}
                                            value={phoneNumber}
                                            placeholder="10 digit number"
                                            onKeyDown={handlePhoneKeyDown}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, "");
                                                setPhoneNumber(val);
                                                searchCustomers(val);
                                                if (val.length === 10) fetchCustomer(val);
                                                else { setCustomerName(""); setLoyaltyPoints(0); setAvailablePoints(0); setRedeemPoints(false); }
                                            }}
                                            className="w-full h-10 border border-slate-200 rounded-lg px-3 text-sm outline-none focus:border-blue-500"
                                        />
                                        {showCustomerSuggestions && (
                                            <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                {customerSuggestions.map((c, idx) => (
                                                    <button
                                                        key={c.id}
                                                        ref={(el) => (customerSuggestionRefs.current[idx] = el)}
                                                        type="button"
                                                        onMouseDown={() => selectCustomerSuggestion(c)}
                                                        className={`w-full text-left px-3 py-2.5 border-b border-slate-100 transition ${
                                                            selectedCustomerIndex === idx
                                                                ? "bg-blue-100 text-blue-900 font-semibold"
                                                                : "hover:bg-slate-50 text-slate-800"
                                                        }`}
                                                    >
                                                        <div className="text-sm font-medium">{c.phone_number}</div>
                                                        <div className="text-xs text-slate-500">{c.customer_name}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">Cashier</label>
                                    <input type="text" value={cashierName} readOnly className="w-full h-10 border border-slate-200 rounded-lg px-3 text-sm bg-slate-50 text-slate-500" />
                                </div>
                            </div>

                            {/* LOYALTY */}
                            <div className="mt-4 flex items-center justify-between px-4 py-3 bg-purple-50/60 border border-purple-100 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <span>⭐</span>
                                    <span className="text-sm font-bold text-purple-800">{loyaltyPoints} Points Available</span>
                                </div>
                                <label className={`flex items-center gap-2 text-xs font-semibold ${availablePoints <= 0 ? "text-slate-400" : "text-purple-700 cursor-pointer"}`}>
                                    <input type="checkbox" checked={redeemPoints} disabled={availablePoints <= 0} onChange={(e) => setRedeemPoints(e.target.checked)} className="w-4 h-4 accent-purple-600" />
                                    Redeem Points
                                </label>
                            </div>
                        </section>

                        {/* PRODUCT SCANNER */}
                        <section className="bg-white border border-slate-200 rounded-xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-sm font-semibold text-slate-900">Add Products</h2>
                                <button type="button" onClick={startBarcodeScanner} className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-slate-900 text-white text-xs font-semibold">
                                    Scan Barcode
                                </button>
                            </div>
                            <input
                                type="text"
                                ref={barcodeInputRef}
                                value={barcode}
                                onChange={(e) => setBarcode(e.target.value.replace(/[\r\n]/g, ""))}
                                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleBarcodeScan(barcode); } }}
                                placeholder="Scan or enter barcode..."
                                className="w-full h-11 border border-slate-200 rounded-lg px-4 text-sm outline-none focus:border-blue-500"
                            />
                        </section>

                        {/* TABLE ITEMS */}
                        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-slate-900">Sale Items</h2>
                                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded">{items.filter((i) => i.name).length} Items</span>
                            </div>
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                                        <th className="px-5 py-3 text-center">Item</th>
                                        <th className="px-3 py-3 text-center">Qty</th>
                                        <th className="px-3 py-3 text-center">Price</th>
                                        <th className="px-3 py-3 text-center">Amount</th>
                                        <th className="px-4 py-3 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, index) => (
                                        <InvoiceItem
                                            key={item.id}
                                            id={item.id}
                                            name={item.name}
                                            qty={item.qty}
                                            price={item.price}
                                            amount={item.amount}
                                            onDeleteItem={deleteItemHandler}
                                            onEdtiItem={edtiItemHandler}
                                            itemOptions={itemOptions}
                                            onAddItem={addItemHandler}
                                            autoFocus={index === items.length - 1}
                                        />
                                    ))}
                                </tbody>
                            </table>
                            <div className="p-4 border-t border-slate-100">
                                <button type="button" onClick={addItemHandler} className="text-xs font-semibold text-blue-600 hover:text-blue-700">＋ Add another item</button>
                            </div>
                        </section>
                    </div>

                    {/* RIGHT PAYMENT PANEL */}
                    <div className="xl:sticky xl:top-5 h-fit">
                        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden p-5">
                            <div className="bg-slate-900 text-white rounded-lg p-4 mb-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs uppercase text-slate-400">Total Payable</span>
                                    <span className="text-2xl font-bold">₹{total.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* DISCOUNT & TAX */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Discount %</label>
                                    <input type="number" min="0" value={discount} onChange={(e) => setDiscount(e.target.value)} className="w-full h-9 border rounded-lg px-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1">Tax %</label>
                                    <input type="number" min="0" value={tax} onChange={(e) => setTax(e.target.value)} className="w-full h-9 border rounded-lg px-2 text-sm" />
                                </div>
                            </div>

                            {/* SUMMARY */}
                            <div className="space-y-2 text-xs border-t border-b border-slate-100 py-3 mb-4">
                                <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                                <div className="flex justify-between text-red-500"><span>Discount</span><span>- ₹{discountRate}</span></div>
                                <div className="flex justify-between text-purple-600"><span>Loyalty Discount</span><span>- ₹{loyaltyDiscount.toFixed(2)}</span></div>
                                <div className="flex justify-between"><span>Tax</span><span>+ ₹{taxRate}</span></div>
                            </div>

                            {/* PAYMENT METHOD */}
                            <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Payment Method</label>
                                <select
                                    ref={paymentMethodSelectRef}
                                    id="paymentMethod"
                                    value={paymentMethod}
                                    onKeyDown={handlePaymentKeyDown}
                                    onChange={(e) => {
                                        const method = e.target.value;
                                        setPaymentMethod(method);
                                        setCashReceived("");
                                        setSplitCash("");
                                        setSplitOnline("");
                                    }}
                                    className="w-full h-10 border border-slate-200 rounded-lg px-3 text-sm font-semibold outline-none bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                >
                                    <option value="Cash">Cash Only</option>
                                    <option value="Online">Online Only</option>
                                    <option value="Split">Split (Cash + Online)</option>
                                </select>

                                {/* CASH ONLY INPUT */}
                                {paymentMethod === "Cash" && (
                                    <div className="mt-4">
                                        <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Cash Received</label>
                                        <input
                                            ref={cashReceivedInputRef}
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={cashReceived}
                                            onChange={(e) => setCashReceived(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    reviewBtnRef.current?.click();
                                                }
                                            }}
                                            placeholder="Enter amount"
                                            className="w-full h-10 border border-slate-200 rounded-lg px-3 text-sm"
                                        />
                                        {insufficientCash && <p className="text-[11px] text-red-500 font-semibold mt-1">⚠ Insufficient cash</p>}
                                        <div className="mt-3 p-3 bg-emerald-50 rounded-lg flex justify-between text-emerald-800 font-bold text-sm">
                                            <span>Change:</span>
                                            <span>₹{changeAmount.toFixed(2)}</span>
                                        </div>
                                    </div>
                                )}

                                {/* AUTO-BALANCING SPLIT PAYMENT */}
                                {paymentMethod === "Split" && (
                                    <div className="mt-4 p-4 border border-blue-200 bg-blue-50/50 rounded-xl space-y-3">
                                        <p className="text-xs font-bold text-blue-900">Enter Cash or Online Amount</p>
                                        
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Cash Portion (₹)</label>
                                            <input
                                                id="splitCashInput"
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={splitCash}
                                                onChange={(e) => handleSplitCashChange(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        reviewBtnRef.current?.click();
                                                    }
                                                }}
                                                className="w-full h-9 border border-slate-300 rounded-lg px-3 text-sm bg-white font-semibold text-slate-800 outline-none focus:border-blue-500"
                                                placeholder="Enter cash portion"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 mb-1">Online Portion (₹)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="any"
                                                value={splitOnline}
                                                onChange={(e) => handleSplitOnlineChange(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        reviewBtnRef.current?.click();
                                                    }
                                                }}
                                                className="w-full h-9 border border-slate-300 rounded-lg px-3 text-sm bg-white font-semibold text-slate-800 outline-none focus:border-blue-500"
                                                placeholder="Enter online portion"
                                            />
                                        </div>

                                        <div className="pt-2 border-t border-blue-200 flex justify-between text-xs font-bold">
                                            <span className={Math.abs(splitDifference) <= 0.05 ? "text-emerald-700 font-bold" : "text-amber-700 font-semibold"}>
                                                {Math.abs(splitDifference) <= 0.05
                                                    ? "✓ Balanced"
                                                    : splitDifference > 0
                                                    ? `Need ₹${splitDifference.toFixed(2)} more`
                                                    : `Exceeds by ₹${Math.abs(splitDifference).toFixed(2)}`
                                                }
                                            </span>
                                            <span className="text-slate-800">Entered: ₹{splitSum.toFixed(2)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                ref={reviewBtnRef}
                                className="w-full mt-5 h-11 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2"
                            >
                                Review Invoice <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">F5</span>
                            </button>
                        </section>
                    </div>
                </div>
            </form>

            {/* HELD BILLS MODAL */}
            {showHeldBills && (
                <div className="fixed inset-0 z-[9998] bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                            <h2 className="text-lg font-semibold text-slate-900">Held Bills</h2>
                            <button type="button" onClick={() => setShowHeldBills(false)} className="text-xl">×</button>
                        </div>
                        <div className="p-5 overflow-y-auto max-h-[60vh]">
                            {heldBills.length === 0 ? (
                                <p className="text-center py-10 text-slate-400">No held bills found.</p>
                            ) : (
                                heldBills.map((b) => (
                                    <div key={b.id} className="border border-slate-200 rounded-lg p-3 mb-2 flex justify-between items-center">
                                        <div>
                                            <h4 className="font-bold text-sm">{b.invoiceNumber}</h4>
                                            <p className="text-xs text-slate-500">{b.customerName || "Walk-in"} • ₹{Number(b.total || 0).toFixed(2)}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => resumeBillHandler(b)} className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-semibold">Resume</button>
                                            <button type="button" onClick={() => deleteHeldBillHandler(b.id)} className="px-3 py-1 bg-red-50 text-red-600 rounded text-xs font-semibold">Delete</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* BARCODE SCANNER MODAL */}
            {showScanner && (
                <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                            <h2 className="text-sm font-semibold text-slate-900">Scan Barcode</h2>
                            <button type="button" onClick={stopBarcodeScanner} className="text-xl">×</button>
                        </div>
                        <div className="relative bg-black">
                            <video ref={videoRef} className="w-full aspect-video object-cover" autoPlay muted playsInline />
                        </div>
                        <div className="p-4">
                            <button type="button" onClick={stopBarcodeScanner} className="w-full h-10 bg-red-600 text-white rounded-lg font-semibold">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* INVOICE MODAL */}
            <InvoiceModal
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                invoiceInfo={{
                    invoiceNumber,
                    cashierName,
                    counterName,
                    customerName,
                    phoneNumber,
                    paymentMethod,
                    cashAmount: reviewCashAmount,
                    onlineAmount: reviewOnlineAmount,
                    subtotal,
                    discountRate,
                    taxRate,
                    loyaltyDiscount: redeemedAmount,
                    total: reviewTotal,
                }}
                items={items}
                onAddNextInvoice={addNextInvoiceHandler}
            />
        </div>
    );
};

export default InvoiceForm;