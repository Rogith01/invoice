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
   GET ALL PRODUCTS
====================================================== */
app.get("/api/products", (req, res) => {

    const sql = `
        SELECT id, product_name, price
        FROM products
        ORDER BY product_name
    `;

    db.query(sql, (err, rows) => {

        if (err) {
            console.error("Products Error:", err);

            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.json({
            success: true,
            products: rows
        });

    });

});
/* ======================================================
   ADD PRODUCT
====================================================== */

app.post("/api/products", (req, res) => {

    const { productName, price } = req.body;

    const sql = `
        INSERT INTO products
        (
            product_name,
            price
        )
        VALUES
        (
            ?,
            ?
        )
    `;

    db.query(
        sql,
        [
            productName,
            price
        ],
        (err, result) => {

            if (err) {

                console.error("Add Product Error:", err);

                return res.status(500).json({
                    success: false,
                    message: err.message
                });

            }

            res.json({
                success: true,
                message: "Product Added Successfully"
            });

        }
    );

});
/* ======================================================
   UPDATE PRODUCT
====================================================== */

app.put("/api/products/:id", (req, res) => {

    const { productName, price } = req.body;
    const id = req.params.id;

    const sql = `
        UPDATE products
        SET
            product_name = ?,
            price = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            productName,
            price,
            id
        ],
        (err) => {

            if (err) {

                return res.status(500).json({
                    success: false,
                    message: err.message
                });

            }

            res.json({
                success: true,
                message: "Product Updated Successfully"
            });

        }
    );

});
/* ======================================================
   DELETE PRODUCT
====================================================== */

app.delete("/api/products/:id", (req, res) => {

    const id = req.params.id;

    const sql = `
        DELETE FROM products
        WHERE id = ?
    `;

    db.query(sql, [id], (err) => {

        if (err) {

            return res.status(500).json({
                success: false,
                message: err.message
            });

        }

        res.json({
            success: true,
            message: "Product Deleted Successfully"
        });

    });

});
/* ======================================================
   DASHBOARD
====================================================== */

app.get("/api/dashboard", (req, res) => {

    const dashboard = {};

    // Today's Sales
    db.query(
        `
        SELECT IFNULL(SUM(total),0) AS todaySales
        FROM invoices
        WHERE invoice_date = CURDATE()
        `,
        (err, rows) => {

            if (err) return res.status(500).json(err);

            dashboard.todaySales = rows[0].todaySales;

            // Today's Orders
            db.query(
                `
                SELECT COUNT(*) AS todayOrders
                FROM invoices
                WHERE invoice_date = CURDATE()
                `,
                (err, rows) => {

                    if (err) return res.status(500).json(err);

                    dashboard.todayOrders = rows[0].todayOrders;

                    // Cash Sales
                    db.query(
                        `
                        SELECT IFNULL(SUM(total),0) AS cashSales
                        FROM invoices
                        WHERE payment_Method='Cash'
                        AND invoice_date = CURDATE()
                        `,
                        (err, rows) => {

                            if (err) return res.status(500).json(err);

                            dashboard.cashSales = rows[0].cashSales;

                            // Online Sales
                            db.query(
                                `
                                SELECT IFNULL(SUM(total),0) AS onlineSales
                                FROM invoices
                                WHERE payment_Method='Online'
                                AND invoice_date = CURDATE()
                                `,
                                (err, rows) => {

                                    if (err)
                                        return res.status(500).json(err);

                                    dashboard.onlineSales =
                                        rows[0].onlineSales;

                                    res.json({
                                        success: true,
                                        dashboard
                                    });

                                }
                            );

                        }
                    );

                }
            );

        }
    );

});
/* ======================================================
   GET ALL INVOICES
====================================================== */

app.get("/api/invoices", (req, res) => {

    const sql = `
        SELECT
            id,
            invoice_number,
            invoice_date,
            invoice_time,
            customer_name,
            cashier_name,
            total,
            payment_Method
        FROM invoices
        ORDER BY id DESC
    `;

    db.query(sql, (err, rows) => {

        if (err) {

            console.error("Invoice History Error:", err);

            return res.status(500).json({
                success: false,
                message: err.message
            });

        }

        res.json({
            success: true,
            invoices: rows
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
        items,
        redeemPoints,
        paymentMethod
    } = req.body;
    console.log("Redeem Points:", redeemPoints);

        // Check if customer already exists
    const checkCustomerSql = `
        SELECT id , loyalty_points
        FROM customers
        WHERE phone_number = ?
    `;

    db.query(checkCustomerSql, [phoneNumber], (err, rows) => {

        if (err) {
            return res.status(500).json({
                message: err.message
            });
        }

        // Existing customer
        if (rows.length > 0) {

            const customerId = rows[0].id;
            const loyaltyPoints = rows[0].loyalty_points;

            console.log("Existing Customer ID:", customerId);

            saveInvoice(customerId, loyaltyPoints);

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

                    saveInvoice(customerId,0);

                }
            );

        }

function saveInvoice(customerId , loyaltyPoints) {

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
                invoice_time,
                customer_id,
                cashier_name,
                customer_name,
                subtotal,
                discount,
                loyalty_discount,
                tax,
                total,
                payment_Method
            )
            VALUES
            (
                ?,
                CURDATE(),
                TIME(CONVERT_TZ(NOW(), '+00:00', '+05:30')),
                ?,
                ?,
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
                redeemPoints ? loyaltyPoints : 0,
                taxRate,
                total,
                paymentMethod
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
                                    const redeemedPoints = redeemPoints ? loyaltyPoints : 0;
                                    const earnedPoints = Math.floor(total / 100);
                                    const finalPoints =
                                            loyaltyPoints - redeemedPoints + earnedPoints;
                                    const updatePointsSql = `
                                        UPDATE customers
                                        SET loyalty_points = ?
                                        WHERE id = ?
                                    `;

                                    db.query(
                                        updatePointsSql,
                                        [
                                            finalPoints,
                                            customerId
                                        ],
                                        (err) => {

                                            if (err) {
                                                console.error("Loyalty Points Error:", err);
                                            }

                                            return res.json({
                                                success: true,
                                                message: "Invoice Saved Successfully",
                                                invoiceNumber,
                                                earnedPoints,
                                                redeemedPoints,
                                                finalPoints
                                            });

                                        }
                                    );

                                }

                            }
                        );

                    });

                } else {
                    const redeemedPoints = redeemPoints ? loyaltyPoints : 0;
                    const earnedPoints = Math.floor(total / 100);
                    const finalPoints =
                    loyaltyPoints - redeemedPoints + earnedPoints;
                    const updatePointsSql = `
                        UPDATE customers
                        SET loyalty_points = ?
                        WHERE id = ?
                    `;

                            db.query(
                                updatePointsSql,
                                [
                                    finalPoints,
                                    customerId
                                ],
                                (err) => {

                                    if (err) {
                                        console.error("Loyalty Points Error:", err);
                                    }

                                    return res.json({
                                        success: true,
                                        message: "Invoice Saved Successfully",
                                        invoiceNumber,
                                        earnedPoints,
                                        redeemedPoints,
                                        finalPoints
                                    });

                        }
                    );

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