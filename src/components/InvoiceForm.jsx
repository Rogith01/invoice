import React, { useState} from 'react';
import axios from "axios";
import { uid } from 'uid';
import InvoiceItem from './InvoiceItem';
import InvoiceModal from './InvoiceModal';
import incrementString from '../helpers/incrementString';

const date = new Date();
const today = date.toLocaleDateString('en-GB', {
  month: 'numeric',
  day: 'numeric',
  year: 'numeric',
});

const itemOptions = [
  { name: 'Rice', price: '50.00' },
  { name: 'Sugar', price: '45.00' },
  { name: 'Milk', price: '30.00' },
  { name: 'Eggs', price: '5.00' },
  { name: 'Bread', price: '25.00' },
  { name: 'Tea', price: '10.00' },
  { name: 'Coffee', price: '12.00' },
  { name: 'Oil', price: '90.00' },
  { name: 'Soap', price: '15.00' },
  { name: 'Salt', price: '20.00' },
];

const InvoiceForm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [discount, setDiscount] = useState('');
  const [tax, setTax] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(1);
  const [cashierName, setCashierName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [items, setItems] = useState([
    {
      id: uid(6),
      name: '',
      qty: 1,
      price: '0.00',
    },
  ]);

  const cashierOptions = ['Rogith', 'Guhan', 'Fayaz'];

const reviewInvoiceHandler = async (event) => {
  event.preventDefault();

  const invoiceData = {
    invoiceNumber,
    cashierName,
    customerName,
    subtotal,
    discountRate,
    taxRate,
    total,
    items,
  };

  try {
    const response = await axios.post(
      "https://invoice-backend-78hd.onrender.com/api/invoices",
      invoiceData
    );

    console.log(response.data);

    setIsOpen(true);

  } catch (error) {
    console.error("Error saving invoice:", error);
    alert("Failed to save invoice.");
  }
};

  const addNextInvoiceHandler = () => {
    setInvoiceNumber((prevNumber) => incrementString(prevNumber));
    setItems([
      {
        id: uid(6),
        name: '',
        qty: 1,
        price: '0.00',
      },
    ]);
    setCustomerName('');
    setCashierName('');
    setDiscount('');
    setTax('');
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
  const total = subtotal - discountRate + taxRate;

  return (
    <form className="relative flex flex-col gap-6 px-2 md:flex-row" onSubmit={reviewInvoiceHandler}>
      {/* MAIN FORM CONTENT */}
      <div className="my-6 flex-1 space-y-4 rounded-md bg-white p-4 shadow-sm md:p-6">
        <div className="flex flex-col justify-between gap-2 border-b border-gray-200 pb-4 md:flex-row md:items-center">
          <div className="flex space-x-2">
            <span className="font-bold">Current Date:</span>
            <span>{today}</span>
          </div>
          <div className="flex items-center space-x-2">
            <label htmlFor="invoiceNumber" className="font-bold">Invoice Number:</label>
            <input
              required
              className="w-[130px] border rounded px-2 py-1"
              type="number"
              id="invoiceNumber"
              min="1"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </div>
        </div>

        <h1 className="text-center text-xl font-bold">XYZ SUPER MARKET</h1>

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
            {items.map((item) => (
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
            <span className="font-bold">Tax:</span>
            <span>({tax || 0}%) Rs: {taxRate.toFixed(2)}</span>
          </div>
          <div className="flex justify-between w-full border-t pt-2">
            <span className="font-bold">Total:</span>
            <span className="font-bold">Rs: {total.toFixed(2)}</span>
          </div>

          {/* ✅ Review Invoice Button inside totals section (for desktop) */}
          <button
            className="hidden md:block mt-4 w-full rounded bg-blue-600 py-2 text-white hover:bg-blue-700"
            type="submit"
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
          subtotal,
          taxRate,
          discountRate,
          total,
        }}
        items={items}
        onAddNextInvoice={addNextInvoiceHandler}
      />
    </form>
  );
};

export default InvoiceForm;
