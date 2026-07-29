require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.post("/api/invoices", (req, res) => {
    console.log("POST /api/invoices called");
    console.log(req.body);

    const {
        invoiceNumber,
        cashierName,
        customerName,
        subtotal,
        discountRate,
        taxRate,
        total,
        items
    } = req.body;

    const sql = `
        INSERT INTO invoices
        (invoice_number, invoice_date, cashier_name, customer_name,
        subtotal, discount, tax, total)
        VALUES (?, CURDATE(), ?, ?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            invoiceNumber,
            cashierName,
            customerName,
            subtotal,
            discountRate,
            taxRate,
            total
        ],
        (err, result) => {

           if (err) {
    console.error("Invoice Insert Error:", err);
    return res.status(500).json({
        success: false,
        message: err.message
    });
}

            const invoiceId = result.insertId;

            items.forEach(item => {

                const itemSql = `
                    INSERT INTO invoice_items
                    (invoice_id,item_name,qty,price,amount)
                    VALUES (?,?,?,?,?)
                `;

                db.query(
                    itemSql,
                    [
                        invoiceId,
                        item.name,
                        item.qty,
                        item.price,
                        item.qty * item.price
                    ]
                );
            });

            res.json({
                success: true,
                message: "Invoice Saved Successfully"
            });

        });

});

// Test Route
app.get("/", (req, res) => {
    res.send("Invoice Backend is Running...");
});

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});