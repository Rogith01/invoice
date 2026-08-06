import React, { Fragment, useRef, useState, useEffect  } from 'react';
import { useReactToPrint } from "react-to-print";
import { Dialog, Transition } from '@headlessui/react';
import "../index.css";


const InvoiceModal = ({
  isOpen,
  setIsOpen,
  invoiceInfo,
  items,
  onAddNextInvoice,
}) => {
  const [today, setToday] = useState("");
const [currentTime, setCurrentTime] = useState("");

useEffect(() => {

  if(isOpen){

    const now = new Date();

    setToday(
      now.toLocaleDateString('en-GB', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
      })
    );

    setCurrentTime(
      now.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    );

  }

}, [isOpen]);
  function closeModal() {
    setIsOpen(false);
  }
const printRef = useRef();

  const addNextInvoiceHandler = () => {
    setIsOpen(false);
    onAddNextInvoice();
    
  };


const printInvoiceHandler = useReactToPrint({
  contentRef: printRef,
  documentTitle: `Invoice-${invoiceInfo.invoiceNumber}`,
});


  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-10 overflow-y-auto"
        onClose={closeModal}
      >
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span
            className="inline-block h-screen align-middle"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="my-8 inline-block w-full max-w-md transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl transition-all">
              <div
                    ref={printRef}
                    id="print"
                    style={{
                      width: "80mm",
                      margin: "0 auto",
                      background: "#fff",
                      padding: "8px",
                    }}
>
                <h1 className="text-center text-lg font-bold text-gray-900">
                  AK SUPER MARKET<br />
                </h1>
                <div className="mt-6">
                  <div className="mb-4 grid grid-cols-2">
                    <span className="font-bold">Date:</span>
                    <span>{today}</span>
                    <span className="font-bold">Time:</span>
                    <span>{currentTime}</span>
                    <span className="font-bold">Invoice Number:</span>
                    <span>{invoiceInfo.invoiceNumber}</span>
                    <span className="font-bold">Cashier:</span>
                    <span>{invoiceInfo.cashierName}</span>
                    <span className="font-bold">Customer:</span>
                    <span>{invoiceInfo.customerName}</span>
                    <span className="font-bold">Phone:</span>
                    <span>{invoiceInfo.phoneNumber}</span>
                    <span className="font-bold">Payment:</span>
                    <span>{invoiceInfo.paymentMethod}</span>
                  </div>

                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-y border-black/10 text-sm md:text-base">
                        <th>ITEM</th>
                        <th className="text-center">QTY</th>
                        <th className="text-right">PRICE</th>
                        <th className="text-right">AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item) => (
                        <tr key={item.id}>
                          <td className="w-full">{item.name}</td>
                          <td className="min-w-[50px] text-center">
                            {item.qty}
                          </td>
                          <td className="min-w-[80px] text-right">
                            Rs:{Number(item.price).toFixed(2)}
                          </td>
                          <td className="min-w-[90px] text-right">
                            Rs:{Number(item.price * item.qty).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="mt-4 flex flex-col items-end space-y-2">
                    <div className="flex w-full justify-between border-t border-black/10 pt-2">
                      <span className="font-bold">Subtotal:</span>
                      <span>Rs:{invoiceInfo.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex w-full justify-between">
                      <span className="font-bold">Discount:</span>
                      <span>Rs:{invoiceInfo.discountRate.toFixed(2)}</span>
                    </div>
                    <div className="flex w-full justify-between">
                    <span className="font-bold">Loyalty Discount:</span>
                    <span>
                      Rs:{invoiceInfo.loyaltyDiscount.toFixed(2)}
                    </span>
                  </div>
                    <div className="flex w-full justify-between">
                      <span className="font-bold">Tax:</span> 
                      <span>Rs:{invoiceInfo.taxRate.toFixed(2)}</span>
                    </div>
<div className="flex w-full justify-between border-t border-black/10 py-2">
  <span className="font-bold">Grand Total:</span>
  <span className="font-bold">
    Rs:
    {(
      invoiceInfo.subtotal -
      invoiceInfo.discountRate -
      invoiceInfo.loyaltyDiscount +
      invoiceInfo.taxRate
    ).toFixed(2)}
  </span>
</div>
                    <div className="w-full text-center">
  <h4 className="font-semibold">
    Thank you, Visit again!
  </h4>
</div>
                  </div>             
                </div>         
              </div>
              <div className="mt-4 flex space-x-2 px-4 pb-6">
                  <button
                    type="button"
                    onClick={printInvoiceHandler}
                    className="flex w-full items-center justify-center space-x-1 rounded-md border border-red-500 py-2 text-sm text-red-500 shadow-sm hover:bg-green-500 hover:text-white"
                    
                  >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  <span>Print Bill</span>
                </button>
                <button
                  onClick={addNextInvoiceHandler}
                  className="flex w-full items-center justify-center space-x-1 rounded-md bg-red-500 py-2 text-sm text-white shadow-sm hover:bg-green-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 5l7 7-7 7M5 5l7 7-7 7"
                    />
                  </svg>
                  <span>Next</span>
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
};

export default InvoiceModal;
