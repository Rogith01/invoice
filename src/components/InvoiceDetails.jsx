import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { useReactToPrint } from "react-to-print";

const InvoiceDetails = () => {

    const navigate = useNavigate();

    const { id } = useParams();

    const [invoice, setInvoice] = useState(null);

    const [items, setItems] = useState([]);

    const printRef = useRef();

const fetchInvoice = React.useCallback(async () => {
    try {
        const res = await axios.get(
            `https://invoice-backend-78hd.onrender.com/api/invoices/${id}`
        );

        if (res.data.success) {
            setInvoice(res.data.invoice);
            setItems(res.data.items);
        }

    } catch (err) {
        console.log(err);
    }

}, [id]);

    useEffect(() => {

        fetchInvoice();

    }, [fetchInvoice]);

    const printInvoiceHandler = useReactToPrint({

    contentRef: printRef,

    documentTitle: invoice?.invoice_number || "Invoice",

});

    if (!invoice) {

        return <h2 className="text-center mt-10">Loading...</h2>;

    }



return (

<div className="min-h-screen bg-gray-100 flex justify-center items-start py-10">



<div
    ref={printRef}
    id="print"
    className="rounded-lg shadow-lg border border-gray-200"
                    style={{
                      width: "100mm",
                      margin: "0 auto",
                      background: "#fff",
                      padding: "18px",
                    }}
>

<h1 className="text-center text-xl font-bold tracking-wide text-gray-900 mb-3">
    AK SUPER MARKET
</h1>



    

    <hr className="border-gray-300 mb-4" />

<div className="mt-8">
    <div className="mb-4 grid grid-cols-2 gap-y-1 text-base">
<span className="font-bold text-[15px]">Date:</span>
<span className="text-[15px]">{new Date(invoice.invoice_date).toLocaleDateString("en-GB")}</span>

<span className="font-bold text-[15px]">Time:</span>
<span className="text-[15px]">{invoice.invoice_time}</span>

<span className="font-bold text-[15px]">Invoice Number:</span>
<span className="text-[15px]">{invoice.invoice_number}</span>

<span className="font-bold text-[15px]">Cashier:</span>
<span className="text-[15px]">{invoice.cashier_name}</span>

<span className="font-bold text-[15px]">Customer:</span>
<span className="text-[15px]">{invoice.customer_name}</span>

<span className="font-bold text-[15px]">Phone:</span>
<span className="text-[15px]">{invoice.phone_number}</span>

<span className="font-bold text-[15px]">Payment:</span>
<span className="text-[15px]">{invoice.payment_method}</span>

    </div>
    </div>

  

   <table className="w-full text-left mt-2">

        <thead>

            <tr className="border-y border-black/10 text-[15px]">

                <th className="text-left py-2">
                    ITEM
                </th>

                <th className="text-center py-2">
                    QTY
                </th>

                <th className="text-right py-2">
                    PRICE
                </th>

                <th className="text-right py-2">
                    AMOUNT
                </th>

            </tr>

        </thead>

        <tbody>

            {items.map((item) => (

                <tr
                    key={item.id}
                    className="border-b border-black/10"
                >

                    <td className="w-full py-2">
                        {item.item_name}
                    </td>

                    <td className="min-w-[50px] text-center py-2">
                        {item.qty}
                    </td>
                    <td className="min-w-[80px] text-right py-2">
                        Rs:{Number(item.price).toFixed(2)}
                    </td>

                    <td className="min-w-[90px] text-right py-2">
                        Rs:{Number(item.amount).toFixed(2)}
                    </td>

                </tr>

            ))}

        </tbody>

    </table>

 <div className="mt-4 flex flex-col items-end space-y-2">

    <div className="flex w-full justify-between  border-black/10 pt-2 text-[15px]">
        <span className="font-bold">Subtotal:</span>
        <span>Rs:{Number(invoice.subtotal).toFixed(2)}</span>
    </div>

    <div className="flex w-full justify-between text-[15px]">
        <span className="font-bold">Discount:</span>
        <span>Rs:{Number(invoice.discount).toFixed(2)}</span>
    </div>

    <div className="flex w-full justify-between text-[15px]">
        <span className="font-bold">Loyalty Discount:</span>
        <span>Rs:{Number(invoice.loyalty_discount).toFixed(2)}</span>
    </div>

    <div className="flex w-full justify-between text-[15px]">
        <span className="font-bold">Tax:</span>
        <span>Rs:{Number(invoice.tax).toFixed(2)}</span>
    </div>

    <div className="flex w-full justify-between border-t border-black/10 py-2 text-[17px] font-bold">
        <span className="font-bold">Grand Total:</span>
        <span className="font-bold text-[18px]">
            Rs:{Number(invoice.total).toFixed(2)}
        </span>
    </div>

    <div className="w-full text-center mt-4">
        <h4 className="font-semibold text-[15px]">
            Thank you, Visit again!
        </h4>
    </div>
<div className="mt-6 flex gap-2 w-full">

    <button
        onClick={printInvoiceHandler}
       className="flex-1 flex items-center justify-center gap-2 rounded-md border border-red-500 py-2 text-sm text-red-500 shadow-sm hover:bg-green-500 hover:text-white transition"
    >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 flex-shrink-0"
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

        <span className="whitespace-nowrap">
            Print Bill
        </span>
    </button>

    <button
        onClick={() => navigate("/invoices")}
       className="flex-1 flex items-center justify-center gap-2 rounded-md bg-red-500 py-2 text-sm text-white shadow-sm hover:bg-green-600 transition"    
    >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
            />
        </svg>

        <span className="whitespace-nowrap">
            Back
        </span>
    </button>

</div>
<hr className="mt-5 border-gray-300" />

</div>
</div>

</div>


);

};

export default InvoiceDetails;

