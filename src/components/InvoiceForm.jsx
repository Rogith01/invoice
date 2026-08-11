import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
} from "react";
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
    // REVIEW BUTTON REF
    // ==========================================

    const reviewBtnRef = useRef(null);

    // ==========================================
    // CURRENT TIME
    // ==========================================

    const [currentTime, setCurrentTime] = useState(
        new Date().toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        })
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
    // TOAST STATE
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

        // Only search when 10 digits are entered
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
    // CURRENT TIME
    // ==========================================

    useEffect(() => {

        const timer = setInterval(() => {

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
// VALIDATION
// ==========================================

// CUSTOMER NAME VALIDATION
if (!customerName || customerName.trim().length === 0) {

    showToast(
        "Please enter customer name.",
        "warning"
    );

    return;
}

// PHONE NUMBER VALIDATION
if (!phoneNumber || phoneNumber.trim().length === 0) {

    showToast(
        "Please enter phone number.",
        "warning"
    );

    return;
}

// PHONE NUMBER LENGTH VALIDATION
if (phoneNumber.length !== 10) {

    showToast(
        "Please enter a valid 10-digit phone number.",
        "warning"
    );

    return;
}

// PRODUCT VALIDATION
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

            if (
                requestedQty <= 0
            ) {

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
        // CALCULATE FINAL TOTAL
        // ==========================================

        const invoiceTotal =
            subtotal -
            discountRate -
            invoiceLoyaltyDiscount +
            taxRate;

        // ==========================================
        // IMPORTANT:
        // CREATE FINAL ITEMS WITH AMOUNT
        // ==========================================

        const invoiceItems = validItems.map(
            (item) => {

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
            }
        );

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
            // REFRESH CUSTOMER LOYALTY POINTS
            // ==========================================

            await fetchCustomer(
                phoneNumber
            );

            // ==========================================
            // OPEN INVOICE MODAL
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

        // Reset frozen receipt values
        setRedeemedAmount(0);

        setReviewTotal(0);

        setDiscount("2");

        setTax("5");

        setPaymentMethod("Cash");

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

                            // Reset quantity
                            newItem.qty = 1;
                        }
                    }

                    // ==========================================
                    // CALCULATE ITEM AMOUNT
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

            {/* ========================================== */}
            {/* TOAST */}
            {/* ========================================== */}

            <Toast
                message={toast.message}
                type={toast.type}
                onClose={closeToast}
            />

            {/* ========================================== */}
            {/* MAIN FORM */}
            {/* ========================================== */}

            <form
                onSubmit={reviewInvoiceHandler}
                className="bg-white rounded-xl shadow-lg p-5 md:p-8"
            >

                {/* ========================================== */}
                {/* HEADER */}
                {/* ========================================== */}

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

                {/* ========================================== */}
                {/* INVOICE NUMBER */}
                {/* ========================================== */}

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

                {/* ========================================== */}
                {/* CASHIER & CUSTOMER */}
                {/* ========================================== */}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-6">

                    {/* CASHIER */}

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

                    {/* CUSTOMER */}

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

                {/* ========================================== */}
                {/* PHONE & LOYALTY */}
                {/* ========================================== */}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">

                    {/* PHONE */}

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

                    {/* LOYALTY POINTS */}

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

                    {/* REDEEM */}

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

                {/* ========================================== */}
                {/* ITEM TABLE */}
                {/* ========================================== */}

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
                                        key={item.id}
                                        id={item.id}
                                        name={item.name}
                                        qty={item.qty}
                                        price={item.price}
                                        amount={item.amount}
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

                {/* ========================================== */}
                {/* ADD ITEM */}
                {/* ========================================== */}

                <button
                    type="button"
                    className="mt-3 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 transition"
                    onClick={addItemHandler}
                >
                    ➕ Add Item
                </button>

                {/* ========================================== */}
                {/* TAX & DISCOUNT */}
                {/* ========================================== */}

                <div className="grid grid-cols-2 gap-4 pt-6 md:w-1/2">

                    {/* DISCOUNT */}

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

                    {/* TAX */}

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

                {/* ========================================== */}
                {/* TOTALS */}
                {/* ========================================== */}

                <div className="flex flex-col items-end space-y-3 pt-6 md:w-1/2">

                    {/* SUBTOTAL */}

                    <div className="flex justify-between w-full">

                        <span className="font-bold">
                            Subtotal:
                        </span>

                        <span>
                            {subtotal.toFixed(2)}
                        </span>

                    </div>

                    {/* DISCOUNT */}

                    <div className="flex justify-between w-full">

                        <span className="font-bold">
                            Discount:
                        </span>

                        <span>
                            ({discount || 0}%)
                            {discountRate.toFixed(2)}
                        </span>

                    </div>

                    {/* LOYALTY DISCOUNT */}

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

                    {/* TAX */}

                    <div className="flex justify-between w-full">

                        <span className="font-bold">
                            Tax:
                        </span>

                        <span>
                            {taxRate.toFixed(2)}
                        </span>

                    </div>

                    {/* PAYMENT METHOD */}

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

                    {/* GRAND TOTAL */}

                    <div className="flex justify-between w-full border-t pt-4 mt-2">

                        <span className="font-bold text-xl">
                            Total:
                        </span>

                        <span className="font-bold text-xl text-blue-600">
                            RS: {total.toFixed(2)}
                        </span>

                    </div>

                    {/* REVIEW BUTTON DESKTOP */}

                    <button
                        className="hidden md:block mt-4 w-full rounded-lg bg-blue-600 py-3 text-white font-semibold hover:bg-blue-700 transition"
                        type="submit"
                        ref={reviewBtnRef}
                    >
                        Review Invoice
                    </button>

                </div>

                {/* ========================================== */}
                {/* MOBILE REVIEW BUTTON */}
                {/* ========================================== */}

                <div className="md:hidden w-full pt-4">

                    <button
                        className="w-full rounded-lg bg-blue-600 py-3 text-white font-semibold hover:bg-blue-700 transition"
                        type="submit"
                    >
                        Review Invoice
                    </button>

                </div>

            </form>

            {/* ========================================== */}
            {/* INVOICE MODAL */}
            {/* ========================================== */}

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