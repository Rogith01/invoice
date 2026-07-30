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
        cashierName,
        customerName,
        subtotal,
        discountRate,
        taxRate,
        total,
        items
    } = req.body;

    // Get the last invoice number
    const getLastInvoice = `
        SELECT invoice_number
        FROM invoices
        ORDER BY id DESC
        LIMIT 1
    `;

    db.query(getLastInvoice, (err, rows) => {

        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        let invoiceNumber = "INV-0001";

        if (rows.length > 0) {
            const lastInvoice = rows[0].invoice_number;
            const lastNumber = parseInt(lastInvoice.replace("INV-", ""));
            invoiceNumber = "INV-" + String(lastNumber + 1).padStart(4, "0");
        }

        // Insert invoice
        const sql = `
            INSERT INTO invoices
            (
                invoice_number,
                invoice_date,
                cashier_name,
                customer_name,
                subtotal,
                discount,
                tax,
                total
            )
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

                // Insert invoice items
                items.forEach(item => {

                    const itemSql = `
                        INSERT INTO invoice_items
                        (
                            invoice_id,
                            item_name,
                            qty,
                            price,
                            amount
                        )
                        VALUES (?, ?, ?, ?, ?)
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
                    message: "Invoice Saved Successfully",
                    invoiceNumber: invoiceNumber
                });

            }
        );

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