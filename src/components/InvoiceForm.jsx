import React, { useState, useEffect, useRef } from 'react';
import axios from "axios";
import { uid } from 'uid';
import InvoiceItem from './InvoiceItem';
import InvoiceModal from './InvoiceModal';
import { useNavigate } from "react-router-dom";

const date = new Date();
const today = date.toLocaleDateString('en-GB', {
  month: 'numeric',
  day: 'numeric',
  year: 'numeric',
});



const InvoiceForm = () => {

  const [isOpen, setIsOpen] = useState(false);
  const [discount, setDiscount] = useState('2');
  const [tax, setTax] = useState('5');
  const [invoiceNumber, setInvoiceNumber] = useState("INV-0001");
  const [cashierName, setCashierName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [redeemPoints, setRedeemPoints] = useState(false);
  const [availablePoints, setAvailablePoints] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [itemOptions, setItemOptions] = useState([]);
  const reviewBtnRef = useRef(null);
  const navigate = useNavigate();
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
      name: '',
      qty: 1,
      price: '0.00',
    },
  ]);

  const cashierOptions = ['Rogith', 'Guhan', 'Fayaz'];
  const fetchCustomer = async (phone) => {

  setPhoneNumber(phone);

  if (phone.length !== 10) return;

  try {

    const res = await axios.get(
      `https://invoice-backend-78hd.onrender.com/api/customer/${phone}`
    );

    if (res.data.success) {
      setCustomerName(res.data.customer.customer_name);
      setLoyaltyPoints(res.data.customer.loyalty_points);
      setAvailablePoints(res.data.customer.loyalty_points);
    } else {
      setCustomerName("");
      setLoyaltyPoints(0);
      setAvailablePoints(0);
      setRedeemPoints(false);
    }

  } catch (err) {
    console.log(err);
  }

};
const fetchProducts = async () => {
  try {
    const res = await axios.get(
      "https://invoice-backend-78hd.onrender.com/api/products"
    );

    if (res.data.success) {
      const products = res.data.products.map((p) => ({
        name: p.product_name,
        price: p.price,
      }));

      setItemOptions(products);
    }
  } catch (err) {
    console.log(err);
  }
};
  // Fetch next invoice number from backend
  const fetchInvoiceNumber = async () => {

    try {

      const response = await axios.get(
        "https://invoice-backend-78hd.onrender.com/api/next-invoice-number"
      );

      if (response.data.success) {
        setInvoiceNumber(response.data.invoiceNumber);
      }

    } catch (error) {
      console.error("Error fetching invoice number:", error);
    }

  };

  // Load invoice number when page opens
useEffect(() => {
  fetchInvoiceNumber();
  fetchProducts();

  const handleShortcut = (event) => {

    if (event.key === "F4") {
      event.preventDefault();
      reviewBtnRef.current?.click();
    }

  };
  

  window.addEventListener("keydown", handleShortcut);

  return () => {
    window.removeEventListener("keydown", handleShortcut);
  };

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

  const reviewInvoiceHandler = async (event) => {

    event.preventDefault();
    const invoiceData = {
      phoneNumber,
      cashierName,
      customerName,
      subtotal,
      discountRate,
      taxRate,
      total,
      items,
      redeemPoints,
      paymentMethod,
    };

    try {

      const response = await axios.post(
        "https://invoice-backend-78hd.onrender.com/api/invoices",
        invoiceData
      );

      console.log(response.data);

      // Update invoice number returned from backend
      setInvoiceNumber(response.data.invoiceNumber);
      await fetchCustomer(phoneNumber);
      setIsOpen(true);

    } catch (error) {

      console.error("Error saving invoice:", error);
      alert("Failed to save invoice.");

    }

  };

  const addNextInvoiceHandler = async () => {

    await fetchInvoiceNumber();

    setItems([
      {
        id: uid(6),
        name: '',
        qty: 1,
        price: '0.00',
      },
    ]);

    setPhoneNumber('');
    setCustomerName('');
    setLoyaltyPoints(0);
    setCashierName('');
    setRedeemPoints(false);
    setAvailablePoints(0);
    setDiscount('2');
    setTax('5');

  };

  const addItemHandler = () => {

    setItems((prevItems) => [
      ...prevItems,
      {
        id: uid(6),
        name: '',
        qty: 1,
        price: '0.00',
      },
    ]);

  };

  const deleteItemHandler = (id) => {
    setItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const edtiItemHandler = (event) => {
    const { id, name, value } = event.target;

    const updatedItems = items.map((item) => {
      if (item.id === id) {
        let newItem = { ...item, [name]: value };

        if (name === 'name') {
          const selectedItem = itemOptions.find((opt) => opt.name === value);
          if (selectedItem) {
            newItem.price = selectedItem.price;
          }
        }

        return newItem;
      }
      return item;
    });

    setItems(updatedItems);
  };

  const subtotal = items.reduce((prev, curr) => {
    if (curr.name.trim().length > 0)
      return prev + Number(curr.price * Math.floor(curr.qty));
    else return prev;
  }, 0);

const taxRate = (tax * subtotal) / 100;
const discountRate = (discount * subtotal) / 100;

const loyaltyDiscount = redeemPoints ? availablePoints : 0;

const total =
  subtotal -
  discountRate -
  loyaltyDiscount +
  taxRate;

  return (
    <form className="relative flex flex-col gap-6 px-2 md:flex-row" onSubmit={reviewInvoiceHandler}>
      {/* MAIN FORM CONTENT */}
      <div className="my-6 flex-1 space-y-4 rounded-md bg-white p-4 shadow-sm md:p-6">
        <div className="flex flex-col justify-between gap-2 border-b border-gray-200 pb-4 md:flex-row md:items-center">
          <div className="flex space-x-2">
            <span className="font-bold">Current Date:</span>
            <span>{today}</span>
          </div>
            <div className="flex space-x-2">
            <span className="font-bold">Current time:</span>
            <span>{currentTime}</span>
          </div>
          <div className="flex items-center space-x-2">
            <label htmlFor="invoiceNumber" className="font-bold">Invoice Number:</label>
<input
  className="w-[130px] border rounded px-2 py-1 bg-gray-100 cursor-not-allowed"
  type="text"
  id="invoiceNumber"
  value={invoiceNumber}
  readOnly
/>
          </div>
        </div>

  <div className="flex justify-between items-center gap-2 flex-wrap">

  {/* Left Side */}
  <h1 className="text-xl md:text-2xl font-bold tracking-wide">
    AK SUPER MARKET
  </h1>

  {/* Right Side */}
  <div className="flex gap-2">

    <button
      type="button"
      onClick={() => navigate("/products")}
      className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm px-3 py-1.5 rounded-md shadow"
    >
      📦 Products
    </button>

    <button
      type="button"
      onClick={() => navigate("/dashboard")}
      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-sm px-3 py-1.5 rounded-md shadow"
    >
      📊 Dashboard
    </button>

  </div>

</div>

        {/* CASHIER & CUSTOMER */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-4">
          <div className="flex flex-col">
            <label htmlFor="cashierName" className="text-sm font-bold">Cashier:</label>
            <select
              required
              id="cashierName"
              className="border rounded px-2 py-1"
              value={cashierName}
              onChange={(e) => setCashierName(e.target.value)}
            >
              <option value="">Select cashier</option>
              {cashierOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
         <div className="flex flex-col">
  <label htmlFor="phoneNumber" className="text-sm font-bold">
    Phone Number
  </label>

  <input
    type="text"
    id="phoneNumber"
    className="border rounded px-2 py-1"
    value={phoneNumber}
    onChange={(e) => {
      setPhoneNumber(e.target.value);

      if (e.target.value.length === 10) {
        fetchCustomer(e.target.value);
      }
    }}
  />
</div>
          <div className="flex flex-col">
            <label htmlFor="customerName" className="text-sm font-bold">Customer:</label>
            <input
              required
              id="customerName"
              className="border rounded px-2 py-1"
              placeholder="Customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
    <label className="text-sm font-bold">
        Loyalty Points
    </label>

    <input
        type="text"
        value={loyaltyPoints}
        readOnly
        className="border rounded px-2 py-1 bg-gray-100"
    />
</div>
<div className="flex items-center gap-2 mt-3">
    <input
        type="checkbox"
        checked={redeemPoints}
        onChange={(e) => setRedeemPoints(e.target.checked)}
    />

    <label>Redeem Loyalty Points</label>
</div>
<p className="text-green-600 font-semibold mt-2">
    Discount from Points:
    ₹{redeemPoints ? availablePoints : 0}
</p>
        </div>

        {/* ITEM TABLE */}
        <table className="w-full text-left mt-6">
          <thead>
            <tr className="border-b text-sm font-medium text-gray-700">
              <th>ITEM</th>
              <th>QTY</th>
              <th className="text-center">PRICE</th>
              <th className="text-center">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item,index) => (
              <InvoiceItem
                key={item.id}
                id={item.id}
                name={item.name}
                qty={item.qty}
                price={item.price}
                onDeleteItem={deleteItemHandler}
                onEdtiItem={edtiItemHandler}
                itemOptions={itemOptions}
                onAddItem={addItemHandler}
                autoFocus={index === items.length - 1}
              />
            ))}
          </tbody>
        </table>

        <button
          type="button"
          className="mt-2 rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          onClick={addItemHandler}
        >
          Add Item
        </button>

        {/* TAX & DISCOUNT */}
        <div className="grid grid-cols-2 gap-4 pt-6 md:w-1/2">
          <div className="flex flex-col">
            <label htmlFor="discount" className="font-bold">Discount (%)</label>
            <input
              type="number"
              id="discount"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="tax" className="font-bold">Tax (%)</label>
            <input
              type="number"
              id="tax"
              value={tax}
              onChange={(e) => setTax(e.target.value)}
              className="border rounded px-2 py-1"
            />
          </div>
        </div>

        {/* TOTALS */}
        <div className="flex flex-col items-end space-y-2 pt-6 md:w-1/2">
          <div className="flex justify-between w-full">
            <span className="font-bold">Subtotal:</span>
            <span>Rs: {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between w-full">
            <span className="font-bold">Discount:</span>
            <span>({discount || 0}%) Rs: {discountRate.toFixed(2)}</span>
          </div>
            <div className="flex justify-between w-full">
    <span className="font-bold">Loyalty Discount:</span>
    <span>Rs: ₹{redeemPoints ? availablePoints : 0}</span>
  </div>
          <div className="flex justify-between w-full">
            <span className="font-bold">Tax:</span>
            <span>({tax || 0}%) Rs: {taxRate.toFixed(2)}</span>
          </div>
          <div className="flex justify-between w-full border-t pt-2">
            <span className="font-bold">Total:</span>
            <span className="font-bold">Rs: {total.toFixed(2)}</span>
          </div>
          <div className="w-full">
  <label className="font-bold block mb-1">Payment Method</label>

  <select
    value={paymentMethod}
    onChange={(e) => setPaymentMethod(e.target.value)}
    className="w-full border rounded px-2 py-1"
  >
    <option value="Cash">Cash</option>
    <option value="Online">Online</option>
  </select>
</div>

          {/* ✅ Review Invoice Button inside totals section (for desktop) */}
          <button
            className="hidden md:block mt-4 w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700"
            type="submit"
            ref={reviewBtnRef}
          >
            Review Invoice
          </button>
        </div>
      </div>

      {/* SIDE BUTTON PANEL (only for mobile view) */}
      <div className="md:hidden w-full px-2 pt-2">
        <button
          className="w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700"
          type="submit"
        >
          Review Invoice
        </button>
      </div>

      {/* Invoice Modal */}
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
  loyaltyDiscount: redeemPoints ? availablePoints : 0,
  total,
}}
        items={items}
        onAddNextInvoice={addNextInvoiceHandler}
      />
    </form>
  );
};

export default InvoiceForm;
