require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

/* ======================================================
   GET NEXT INVOICE NUMBER
====================================================== */
app.get("/api/next-invoice-number", (req, res) => {

    const sql = `
        SELECT invoice_number
        FROM invoices
        ORDER BY id DESC
        LIMIT 1
    `;

    db.query(sql, (err, rows) => {

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

        res.json({
            success: true,
            invoiceNumber
        });

    });

});

/* ======================================================
   GET CUSTOMER BY PHONE
====================================================== */

app.get("/api/customer/:phone", (req, res) => {

    const phone = req.params.phone;

    const sql = `
        SELECT *
        FROM customers
        WHERE phone_number = ?
    `;

    db.query(sql, [phone], (err, rows) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        if (rows.length > 0) {
            return res.json({
                success: true,
                customer: rows[0]
            });
        }

        res.json({
            success: false
        });

    });

});

/* ======================================================
   SAVE INVOICE
====================================================== */

app.post("/api/invoices", (req, res) => {

    console.log("POST /api/invoices called");
    console.log(req.body);

    const {
        phoneNumber,
        cashierName,
        customerName,
        subtotal,
        discountRate,
        taxRate,
        total,
        items
    } = req.body;

        // Check if customer already exists
    const checkCustomerSql = `
        SELECT id
        FROM customers
        WHERE phone_number = ?
    `;

    db.query(checkCustomerSql, [phoneNumber], (err, rows) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        // Existing customer
        if (rows.length > 0) {

            const customerId = rows[0].id;

            console.log("Existing Customer ID:", customerId);

            saveInvoice(customerId);

        } else {

            // New customer
            const insertCustomerSql = `
                INSERT INTO customers
                (
                    customer_name,
                    phone_number,
                    loyalty_points
                )
                VALUES
                (
                    ?,
                    ?,
                    0
                )
            `;

            db.query(
                insertCustomerSql,
                [
                    customerName,
                    phoneNumber
                ],
                (err, result) => {

                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: err.message
                        });
                    }

                    const customerId = result.insertId;

                    console.log("New Customer ID:", customerId);

                    saveInvoice(customerId);

                }
            );

        }

function saveInvoice(customerId) {

    // Get latest invoice number
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
            invoiceNumber =
                "INV-" + String(lastNumber + 1).padStart(4, "0");
        }

        // Insert invoice
        const invoiceSql = `
            INSERT INTO invoices
            (
                invoice_number,
                invoice_date,
                customer_id,
                cashier_name,
                customer_name,
                subtotal,
                discount,
                tax,
                total
            )
            VALUES
            (
                ?,
                CURDATE(),
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?
            )
        `;

        db.query(
            invoiceSql,
            [
                invoiceNumber,
                customerId,
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

                if (items && items.length > 0) {

                    let completed = 0;

                    items.forEach((item) => {

                        const itemSql = `
                            INSERT INTO invoice_items
                            (
                                invoice_id,
                                item_name,
                                qty,
                                price,
                                amount
                            )
                            VALUES
                            (
                                ?,
                                ?,
                                ?,
                                ?,
                                ?
                            )
                        `;

                        db.query(
                            itemSql,
                            [
                                invoiceId,
                                item.name,
                                item.qty,
                                item.price,
                                item.qty * item.price
                            ],
                            (err) => {

                                if (err) {
                                    console.error(err);
                                }

                                completed++;

                                if (completed === items.length) {

                                    return res.json({
                                        success: true,
                                        message: "Invoice Saved Successfully",
                                        invoiceNumber
                                    });

                                }

                            }
                        );

                    });

                } else {

                    return res.json({
                        success: true,
                        message: "Invoice Saved Successfully",
                        invoiceNumber
                    });

                }

            }
        );

    });

} // End saveInvoice()

    }); // End checkCustomerSql query

}); // End POST /api/invoices

/* ======================================================
   TEST ROUTE
====================================================== */

app.get("/", (req, res) => {
    res.send("Invoice Backend is Running...");
});

/* ======================================================
   START SERVER
====================================================== */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});