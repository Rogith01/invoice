require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const db = require("./db");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
// ======================================================
// JWT AUTHENTICATION MIDDLEWARE
// ======================================================

const authenticateToken = (req, res, next) => {

    const authHeader = req.headers["authorization"];

    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {

        return res.status(401).json({
            success: false,
            message: "Access token required"
        });

    }

    jwt.verify(
        token,
        process.env.JWT_SECRET,
        (err, user) => {

            if (err) {

                return res.status(403).json({
                    success: false,
                    message: "Invalid or expired token"
                });

            }

            req.user = user;

            next();

        }
    );

};

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
   GET ALL USERS
====================================================== */

app.get("/api/users", (req, res) => {

    const sql = `
        SELECT
            id,
            username,
            password,
            role
        FROM users
        ORDER BY id
    `;

    db.query(sql, (err, rows) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: err.message
            });
        }

        res.json({
            success: true,
            users: rows
        });

    });

});
/* ======================================================
   ADD USER
====================================================== */

app.post("/api/users", (req, res) => {

    const {
        username,
        password,
        role
    } = req.body;

    const sql = `
        INSERT INTO users
        (
            username,
            password,
            role
        )
        VALUES
        (
            ?,
            ?,
            ?
        )
    `;

    db.query(
        sql,
        [
            username,
            password,
            role
        ],
        (err) => {

            if (err) {

                return res.status(500).json({
                    success: false,
                    message: err.message
                });

            }

            res.json({
                success: true
            });

        }
    );

});
/* ======================================================
   UPDATE USER
====================================================== */

app.put("/api/users/:id", (req, res) => {

    const { username, password, role } = req.body;
    const id = req.params.id;

    const sql = `
        UPDATE users
        SET
            username = ?,
            password = ?,
            role = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            username,
            password,
            role,
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
                message: "User Updated Successfully"
            });

        }
    );

});
/* ======================================================
   DELETE USER
====================================================== */

app.delete("/api/users/:id", (req, res) => {

    const id = req.params.id;

    const sql = `
        DELETE FROM users
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
            message: "User Deleted Successfully"
        });

    });

});
/* ======================================================
   DASHBOARD
====================================================== */

app.get("/api/dashboard", (req, res) => {

    const dashboard = {};

    // ==================================================
    // 1. TOTAL SALES
    // ==================================================

    db.query(
        `
        SELECT IFNULL(SUM(total), 0) AS totalSales
        FROM invoices
        `,
        (err, rows) => {

            if (err) {
                console.error("Total Sales Error:", err);
                return res.status(500).json({
                    success: false,
                    message: err.message
                });
            }

            dashboard.totalSales = rows[0].totalSales;


            // ==================================================
            // 2. TODAY'S SALES
            // ==================================================

            db.query(
                `
                SELECT IFNULL(SUM(total), 0) AS todaySales
                FROM invoices
                WHERE invoice_date = CURDATE()
                `,
                (err, rows) => {

                    if (err) {
                        console.error("Today's Sales Error:", err);
                        return res.status(500).json({
                            success: false,
                            message: err.message
                        });
                    }

                    dashboard.todaySales = rows[0].todaySales;


                    // ==================================================
                    // 3. TODAY'S ORDERS
                    // ==================================================

                    db.query(
                        `
                        SELECT COUNT(*) AS todayOrders
                        FROM invoices
                        WHERE invoice_date = CURDATE()
                        `,
                        (err, rows) => {

                            if (err) {
                                console.error("Today's Orders Error:", err);
                                return res.status(500).json({
                                    success: false,
                                    message: err.message
                                });
                            }

                            dashboard.todayOrders = rows[0].todayOrders;


                            // ==================================================
                            // 4. TODAY'S CASH SALES
                            // ==================================================

                            db.query(
                                `
                                SELECT IFNULL(SUM(total), 0) AS cashSales
                                FROM invoices
                                WHERE payment_Method = 'Cash'
                                AND invoice_date = CURDATE()
                                `,
                                (err, rows) => {

                                    if (err) {
                                        console.error("Cash Sales Error:", err);
                                        return res.status(500).json({
                                            success: false,
                                            message: err.message
                                        });
                                    }

                                    dashboard.cashSales = rows[0].cashSales;


                                    // ==================================================
                                    // 5. TODAY'S ONLINE SALES
                                    // ==================================================

                                    db.query(
                                        `
                                        SELECT IFNULL(SUM(total), 0) AS onlineSales
                                        FROM invoices
                                        WHERE payment_Method = 'Online'
                                        AND invoice_date = CURDATE()
                                        `,
                                        (err, rows) => {

                                            if (err) {
                                                console.error("Online Sales Error:", err);
                                                return res.status(500).json({
                                                    success: false,
                                                    message: err.message
                                                });
                                            }

                                            dashboard.onlineSales = rows[0].onlineSales;


                                            // ==================================================
                                            // 6. TOP SELLING PRODUCT
                                            // ==================================================

                                            db.query(
                                                `
                                                SELECT
                                                    item_name,
                                                    SUM(qty) AS total_quantity_sold
                                                FROM invoice_items
                                                GROUP BY item_name
                                                ORDER BY total_quantity_sold DESC
                                                LIMIT 1
                                                `,
                                                (err, rows) => {

                                                    if (err) {
                                                        console.error("Top Product Error:", err);
                                                        return res.status(500).json({
                                                            success: false,
                                                            message: err.message
                                                        });
                                                    }

                                                    dashboard.topProduct =
                                                        rows.length > 0
                                                            ? rows[0]
                                                            : null;


                                                    // ==================================================
                                                    // 7. TOP CUSTOMER
                                                    // ==================================================

                                                    db.query(
                                                        `
                                                        SELECT
                                                            customer_name,
                                                            COUNT(*) AS total_orders,
                                                            SUM(total) AS total_spent
                                                        FROM invoices
                                                        WHERE customer_name IS NOT NULL
                                                        AND customer_name != ''
                                                        GROUP BY customer_name
                                                        ORDER BY total_spent DESC
                                                        LIMIT 1
                                                        `,
                                                        (err, rows) => {

                                                            if (err) {
                                                                console.error("Top Customer Error:", err);
                                                                return res.status(500).json({
                                                                    success: false,
                                                                    message: err.message
                                                                });
                                                            }

                                                            dashboard.topCustomer =
                                                                rows.length > 0
                                                                    ? rows[0]
                                                                    : null;


                                                            // ==================================================
                                                            // 8. TOP CASHIER
                                                            // ==================================================

                                                            db.query(
                                                                `
                                                                SELECT
                                                                    cashier_name,
                                                                    COUNT(*) AS total_orders,
                                                                    SUM(total) AS total_sales
                                                                FROM invoices
                                                                WHERE cashier_name IS NOT NULL
                                                                AND cashier_name != ''
                                                                GROUP BY cashier_name
                                                                ORDER BY total_sales DESC
                                                                LIMIT 1
                                                                `,
                                                                (err, rows) => {

                                                                    if (err) {
                                                                        console.error("Top Cashier Error:", err);
                                                                        return res.status(500).json({
                                                                            success: false,
                                                                            message: err.message
                                                                        });
                                                                    }

                                                                    dashboard.topCashier =
                                                                        rows.length > 0
                                                                            ? rows[0]
                                                                            : null;


                                                                    // ==================================================
                                                                    // 9. TOTAL PRODUCTS
                                                                    // ==================================================

                                                                    db.query(
                                                                        `
                                                                        SELECT COUNT(*) AS totalProducts
                                                                        FROM products
                                                                        `,
                                                                        (err, rows) => {

                                                                            if (err) {
                                                                                console.error("Total Products Error:", err);
                                                                                return res.status(500).json({
                                                                                    success: false,
                                                                                    message: err.message
                                                                                });
                                                                            }

                                                                            dashboard.totalProducts =
                                                                                rows[0].totalProducts;


                                                                            // ==================================================
                                                                            // 10. TOTAL CUSTOMERS
                                                                            // ==================================================

                                                                            db.query(
                                                                                `
                                                                                SELECT COUNT(*) AS totalCustomers
                                                                                FROM customers
                                                                                `,
                                                                                (err, rows) => {

                                                                                    if (err) {
                                                                                        console.error("Total Customers Error:", err);
                                                                                        return res.status(500).json({
                                                                                            success: false,
                                                                                            message: err.message
                                                                                        });
                                                                                    }

                                                                                    dashboard.totalCustomers =
                                                                                        rows[0].totalCustomers;


                                                                                    // ==================================================
                                                                                    // 11. THIS MONTH'S SALES
                                                                                    // ==================================================

                                                                                    db.query(
                                                                                        `
                                                                                        SELECT IFNULL(SUM(total), 0) AS monthlySales
                                                                                        FROM invoices
                                                                                        WHERE YEAR(invoice_date) = YEAR(CURDATE())
                                                                                        AND MONTH(invoice_date) = MONTH(CURDATE())
                                                                                        `,
                                                                                        (err, rows) => {

                                                                                            if (err) {
                                                                                                console.error("Monthly Sales Error:", err);
                                                                                                return res.status(500).json({
                                                                                                    success: false,
                                                                                                    message: err.message
                                                                                                });
                                                                                            }

                                                                                            dashboard.monthlySales =
                                                                                                rows[0].monthlySales;


                                                                                            // ==================================================
                                                                                            // 12. THIS MONTH'S ORDERS
                                                                                            // ==================================================

                                                                                            db.query(
                                                                                                `
                                                                                                SELECT COUNT(*) AS monthlyOrders
                                                                                                FROM invoices
                                                                                                WHERE YEAR(invoice_date) = YEAR(CURDATE())
                                                                                                AND MONTH(invoice_date) = MONTH(CURDATE())
                                                                                                `,
                                                                                                (err, rows) => {

                                                                                                    if (err) {
                                                                                                        console.error("Monthly Orders Error:", err);
                                                                                                        return res.status(500).json({
                                                                                                            success: false,
                                                                                                            message: err.message
                                                                                                        });
                                                                                                    }

                                                                                                    dashboard.monthlyOrders =
                                                                                                        rows[0].monthlyOrders;


                                                                                                    // ==================================================
                                                                                                    // FINAL RESPONSE
                                                                                                    // ==================================================

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

                                                                }
                                                            );

                                                        }
                                                    );

                                                }
                                            );

                                        }
                                    );

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
   DAILY SALES ANALYSIS
====================================================== */

app.get("/api/dashboard/daily-sales", (req, res) => {

    const sql = `
        SELECT
            DATE(invoice_date) AS saleDate,
            IFNULL(SUM(total), 0) AS sales,
            COUNT(*) AS orders
        FROM invoices
        GROUP BY DATE(invoice_date)
        ORDER BY saleDate ASC
    `;

    db.query(sql, (err, rows) => {

        if (err) {

            console.error("Daily Sales Error:", err);

            return res.status(500).json({
                success: false,
                message: err.message
            });

        }

        res.json({
            success: true,
            dailySales: rows
        });

    });

});
/* ======================================================
   GET ALL INVOICES
====================================================== */

app.get("/api/invoices", (req, res) => {

    const sql = `
    SELECT
        invoices.id,
        invoices.invoice_number,
        invoices.invoice_date,
        invoices.invoice_time,
        invoices.customer_name,
        invoices.cashier_name,
        customers.phone_number,
        invoices.total,
        invoices.payment_Method
    FROM invoices
    LEFT JOIN customers
        ON invoices.customer_id = customers.id
    ORDER BY invoices.id DESC
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
   GET SINGLE INVOICE
====================================================== */

app.get("/api/invoices/:id", (req, res) => {

    const invoiceId = req.params.id;

const invoiceSql = `
    SELECT
        invoices.*,
        customers.phone_number
    FROM invoices
    LEFT JOIN customers
        ON invoices.customer_id = customers.id
    WHERE invoices.id = ?
`;

    db.query(invoiceSql, [invoiceId], (err, invoiceRows) => {

        if (err) {

            return res.status(500).json({
                success: false,
                message: err.message
            });

        }

        if (invoiceRows.length === 0) {

            return res.json({
                success: false
            });

        }

        const itemSql = `
            SELECT *
            FROM invoice_items
            WHERE invoice_id = ?
        `;

        db.query(itemSql, [invoiceId], (err, itemRows) => {

            if (err) {

                return res.status(500).json({
                    success: false,
                    message: err.message
                });

            }

            res.json({

                success: true,

                invoice: invoiceRows[0],

                items: itemRows

            });

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
   DELETE INVOICE
====================================================== */

app.delete(
    "/api/invoices/:id",
    authenticateToken,
    (req, res) => {

        // Admin only
        if (req.user.role !== "Admin") {

            return res.status(403).json({
                success: false,
                message: "Only Admin can delete invoices"
            });

        }

        const invoiceId = req.params.id;

        // Delete invoice items first
        db.query(
            "DELETE FROM invoice_items WHERE invoice_id = ?",
            [invoiceId],
            (err) => {

                if (err) {

                    console.log(err);

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                // Now delete invoice
                db.query(
                    "DELETE FROM invoices WHERE id = ?",
                    [invoiceId],
                    (err, result) => {

                        if (err) {

                            console.log(err);

                            return res.status(500).json({
                                success: false,
                                message: err.message
                            });

                        }

                        res.json({
                            success: true,
                            message: "Invoice deleted successfully"
                        });

                    }
                );

            }
        );

    }
);
/* ======================================================
   LOGIN
====================================================== */

app.post("/api/login", (req, res) => {

    const { username, password } = req.body;

    const sql = `
        SELECT
            id,
            username,
            role
        FROM users
        WHERE username = ?
        AND password = ?
    `;

    db.query(sql, [username, password], (err, rows) => {

        if (err) {

            return res.status(500).json({
                success: false,
                message: err.message
            });

        }

        if (rows.length === 0) {

            return res.json({
                success: false,
                message: "Invalid Username or Password"
            });

        }

        const user = rows[0];

        // Create JWT token
        const token = jwt.sign(
            {
                id: user.id,
                username: user.username,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "8h"
            }
        );

        res.json({

            success: true,

            token: token,

            user: user

        });

    });

});
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