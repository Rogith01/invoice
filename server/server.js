require("dotenv").config();

const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const db = require("./db");

const app = express();

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(cors());
app.use(express.json());

// ======================================================
// JWT AUTHENTICATION MIDDLEWARE
// ======================================================

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];

    const token =
        authHeader && authHeader.split(" ")[1];

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

// ======================================================
// ADMIN MIDDLEWARE
// ======================================================

const authenticateAdmin = (req, res, next) => {

    if (!req.user || req.user.role !== "Admin") {

        return res.status(403).json({
            success: false,
            message: "Admin access required"
        });

    }

    next();
};

// ======================================================
// GET NEXT INVOICE NUMBER
// ======================================================

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

            const lastInvoice =
                rows[0].invoice_number;

            const lastNumber =
                parseInt(
                    lastInvoice.replace("INV-", "")
                );

            invoiceNumber =
                "INV-" +
                String(lastNumber + 1)
                    .padStart(4, "0");
        }

        res.json({
            success: true,
            invoiceNumber
        });

    });

});

// ======================================================
// GET CUSTOMER BY PHONE
// ======================================================

app.get("/api/customer/:phone", (req, res) => {

    const phone = req.params.phone;

    const sql = `
        SELECT *
        FROM customers
        WHERE phone_number = ?
    `;

    db.query(
        sql,
        [phone],
        (err, rows) => {

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

        }
    );

});

// ======================================================
// GET CUSTOMER PURCHASE HISTORY
// ======================================================

app.get(
    "/api/customers/:id/purchases",
    authenticateToken,
    (req, res) => {

        const customerId = req.params.id;

        // ==================================================
        // CUSTOMER DETAILS
        // ==================================================

        const customerSql = `
            SELECT
                id,
                customer_name,
                phone_number,
                loyalty_points
            FROM customers
            WHERE id = ?
        `;

        db.query(
            customerSql,
            [customerId],
            (err, customerRows) => {

                if (err) {

                    console.error(
                        "Customer Details Error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                if (customerRows.length === 0) {

                    return res.status(404).json({
                        success: false,
                        message: "Customer not found"
                    });

                }

                const customer =
                    customerRows[0];

                // ==================================================
                // CUSTOMER INVOICES
                // ==================================================

                const invoiceSql = `
                    SELECT
                        id,
                        invoice_number,
                        invoice_date,
                        invoice_time,
                        subtotal,
                        discount,
                        loyalty_discount,
                        tax,
                        total,
                        payment_Method,
                        cashier_name
                    FROM invoices
                    WHERE customer_id = ?
                    ORDER BY id DESC
                `;

                db.query(
                    invoiceSql,
                    [customerId],
                    (err, invoiceRows) => {

                        if (err) {

                            console.error(
                                "Customer Invoice History Error:",
                                err
                            );

                            return res.status(500).json({
                                success: false,
                                message: err.message
                            });

                        }

                        if (invoiceRows.length === 0) {

                            return res.json({
                                success: true,
                                customer,
                                purchases: []
                            });

                        }

                        // ==================================================
                        // GET ITEMS
                        // ==================================================

                        const invoiceIds =
                            invoiceRows.map(
                                invoice => invoice.id
                            );

                        const itemSql = `
                            SELECT
                                invoice_id,
                                item_name,
                                qty,
                                price,
                                amount
                            FROM invoice_items
                            WHERE invoice_id IN (?)
                            ORDER BY invoice_id DESC
                        `;

                        db.query(
                            itemSql,
                            [invoiceIds],
                            (err, itemRows) => {

                                if (err) {

                                    console.error(
                                        "Customer Invoice Items Error:",
                                        err
                                    );

                                    return res.status(500).json({
                                        success: false,
                                        message: err.message
                                    });

                                }

                                // ==================================================
                                // COMBINE
                                // ==================================================

                                const purchases =
                                    invoiceRows.map(
                                        invoice => {

                                            return {
                                                ...invoice,

                                                items:
                                                    itemRows.filter(
                                                        item =>
                                                            item.invoice_id ===
                                                            invoice.id
                                                    )
                                            };

                                        }
                                    );

                                // ==================================================
                                // RESPONSE
                                // ==================================================

                                res.json({
                                    success: true,
                                    customer,
                                    purchases
                                });

                            }
                        );

                    }
                );

            }
        );

    }
);

// ======================================================
// GET ALL CUSTOMERS
// ======================================================

app.get(
    "/api/customers",
    authenticateToken,
    (req, res) => {

        const sql = `
            SELECT
                c.id,
                c.customer_name,
                c.phone_number,
                c.loyalty_points,

                COUNT(i.id) AS total_orders,

                COALESCE(
                    SUM(i.total),
                    0
                ) AS total_spent,

                MAX(i.invoice_date)
                    AS last_purchase

            FROM customers c

            LEFT JOIN invoices i
                ON c.id = i.customer_id

            GROUP BY
                c.id,
                c.customer_name,
                c.phone_number,
                c.loyalty_points

            ORDER BY c.id DESC
        `;

        db.query(
            sql,
            (err, rows) => {

                if (err) {

                    console.error(
                        "Customers Error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                res.json({
                    success: true,
                    customers: rows
                });

            }
        );

    }
);

// ======================================================
// GET ALL PRODUCTS
// ======================================================

app.get(
    "/api/products",
    authenticateToken,
    (req, res) => {

        const sql = `
            SELECT
                id,
                product_name,
                price,
                stock_quantity
            FROM products
            ORDER BY product_name
        `;

        db.query(
            sql,
            (err, rows) => {

                if (err) {

                    console.error(
                        "Products Error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                res.json({
                    success: true,
                    products: rows
                });

            }
        );

    }
);

// ======================================================
// ADD PRODUCT
// ======================================================

app.post(
    "/api/products",
    authenticateToken,
    authenticateAdmin,
    (req, res) => {

        const {
            productName,
            price
        } = req.body;

        if (
            !productName ||
            price === undefined ||
            Number(price) < 0
        ) {

            return res.status(400).json({
                success: false,
                message: "Invalid product details"
            });

        }

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
            (err) => {

                if (err) {

                    console.error(
                        "Add Product Error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                res.json({
                    success: true,
                    message:
                        "Product Added Successfully"
                });

            }
        );

    }
);

// ======================================================
// UPDATE PRODUCT
// ======================================================

app.put(
    "/api/products/:id",
    authenticateToken,
    authenticateAdmin,
    (req, res) => {

        const {
            productName,
            price
        } = req.body;

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
                    message:
                        "Product Updated Successfully"
                });

            }
        );

    }
);

// ======================================================
// ADD / RESTOCK PRODUCT
// ======================================================

app.put(
    "/api/products/:id/restock",
    authenticateToken,
    (req, res) => {

        const productId =
            req.params.id;

        const {
            quantity
        } = req.body;

        if (
            !Number.isInteger(
                Number(quantity)
            ) ||
            Number(quantity) <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid stock quantity"
            });

        }

        const stockToAdd =
            Number(quantity);

        // ==================================================
        // GET CURRENT PRODUCT
        // ==================================================

        const getProductSql = `
            SELECT
                id,
                product_name,
                stock_quantity
            FROM products
            WHERE id = ?
        `;

        db.query(
            getProductSql,
            [productId],
            (err, rows) => {

                if (err) {

                    console.error(
                        "Get Product Error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                if (rows.length === 0) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Product not found"
                    });

                }

                const product =
                    rows[0];

                const stockBefore =
                    Number(
                        product.stock_quantity
                    ) || 0;

                const stockAfter =
                    stockBefore +
                    stockToAdd;

                // ==================================================
                // UPDATE STOCK
                // ==================================================

                const updateStockSql = `
                    UPDATE products
                    SET stock_quantity = ?
                    WHERE id = ?
                `;

                db.query(
                    updateStockSql,
                    [
                        stockAfter,
                        productId
                    ],
                    (err) => {

                        if (err) {

                            console.error(
                                "Restock Update Error:",
                                err
                            );

                            return res.status(500).json({
                                success: false,
                                message: err.message
                            });

                        }

                        // ==================================================
                        // STOCK MOVEMENT
                        // ==================================================

                        const movementSql = `
                            INSERT INTO stock_movements
                            (
                                product_id,
                                product_name,
                                movement_type,
                                quantity,
                                stock_before,
                                stock_after,
                                reference_type,
                                reference_id,
                                performed_by
                            )
                            VALUES
                            (
                                ?,
                                ?,
                                'STOCK_IN',
                                ?,
                                ?,
                                ?,
                                'RESTOCK',
                                NULL,
                                ?
                            )
                        `;

                        db.query(
                            movementSql,
                            [
                                productId,
                                product.product_name,
                                stockToAdd,
                                stockBefore,
                                stockAfter,
                                req.user.username
                            ],
                            (err) => {

                                if (err) {

                                    console.error(
                                        "Stock Movement Error:",
                                        err
                                    );

                                    return res.status(500).json({
                                        success: false,
                                        message: err.message
                                    });

                                }

                                res.json({
                                    success: true,
                                    message:
                                        "Stock added successfully",
                                    stockBefore,
                                    stockAdded:
                                        stockToAdd,
                                    stockAfter
                                });

                            }
                        );

                    }
                );

            }
        );

    }
);

// ======================================================
// STOCK ADJUSTMENT
// ======================================================

app.put(
    "/api/products/:id/adjust-stock",
    authenticateToken,
    authenticateAdmin,
    (req, res) => {

        const productId =
            req.params.id;

        const {
            quantity,
            reason
        } = req.body;

        const adjustment =
            Number(quantity);

        if (
            !Number.isInteger(adjustment) ||
            adjustment === 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Adjustment quantity must be a non-zero whole number"
            });

        }

        if (
            !reason ||
            !reason.trim()
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Please provide a reason for the adjustment"
            });

        }

        // ==================================================
        // GET PRODUCT
        // ==================================================

        const getProductSql = `
            SELECT
                id,
                product_name,
                stock_quantity
            FROM products
            WHERE id = ?
        `;

        db.query(
            getProductSql,
            [productId],
            (err, rows) => {

                if (err) {

                    console.error(
                        "Adjustment Product Error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                if (rows.length === 0) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Product not found"
                    });

                }

                const product =
                    rows[0];

                const stockBefore =
                    Number(
                        product.stock_quantity
                    ) || 0;

                const stockAfter =
                    stockBefore +
                    adjustment;

                if (stockAfter < 0) {

                    return res.status(400).json({
                        success: false,
                        message:
                            `Stock cannot become negative. Current stock: ${stockBefore}`
                    });

                }

                // ==================================================
                // UPDATE STOCK
                // ==================================================

                const updateStockSql = `
                    UPDATE products
                    SET stock_quantity = ?
                    WHERE id = ?
                `;

                db.query(
                    updateStockSql,
                    [
                        stockAfter,
                        productId
                    ],
                    (err) => {

                        if (err) {

                            return res.status(500).json({
                                success: false,
                                message: err.message
                            });

                        }

                        // ==================================================
                        // RECORD MOVEMENT
                        // ==================================================

                        const movementSql = `
                            INSERT INTO stock_movements
                            (
                                product_id,
                                product_name,
                                movement_type,
                                quantity,
                                stock_before,
                                stock_after,
                                reference_type,
                                performed_by
                            )
                            VALUES
                            (
                                ?,
                                ?,
                                'ADJUSTMENT',
                                ?,
                                ?,
                                ?,
                                ?,
                                ?
                            )
                        `;

                        db.query(
                            movementSql,
                            [
                                product.id,
                                product.product_name,
                                Math.abs(adjustment),
                                stockBefore,
                                stockAfter,
                                reason.trim(),
                                req.user.username
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
                                    message:
                                        "Stock adjusted successfully",
                                    productName:
                                        product.product_name,
                                    stockBefore,
                                    adjustment,
                                    stockAfter,
                                    reason:
                                        reason.trim()
                                });

                            }
                        );

                    }
                );

            }
        );

    }
);

// ======================================================
// GET STOCK MOVEMENT HISTORY
// ======================================================

app.get(
    "/api/stock-movements",
    authenticateToken,
    (req, res) => {

        const sql = `
            SELECT
                id,
                product_id,
                product_name,
                movement_type,
                quantity,
                stock_before,
                stock_after,
                reference_type,
                reference_id,
                performed_by,
                created_at
            FROM stock_movements
            ORDER BY created_at DESC
        `;

        db.query(
            sql,
            (err, rows) => {

                if (err) {

                    console.error(
                        "Stock Movements Error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                res.json({
                    success: true,
                    movements: rows
                });

            }
        );

    }
);

// ======================================================
// DELETE PRODUCT
// ======================================================

app.delete(
    "/api/products/:id",
    authenticateToken,
    authenticateAdmin,
    (req, res) => {

        const id =
            req.params.id;

        const sql = `
            DELETE FROM products
            WHERE id = ?
        `;

        db.query(
            sql,
            [id],
            (err) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                res.json({
                    success: true,
                    message:
                        "Product Deleted Successfully"
                });

            }
        );

    }
);

// ======================================================
// GET ALL USERS
// ======================================================

app.get(
    "/api/users",
    authenticateToken,
    authenticateAdmin,
    (req, res) => {

        // Password deliberately NOT returned
        const sql = `
            SELECT
                id,
                username,
                role
            FROM users
            ORDER BY id
        `;

        db.query(
            sql,
            (err, rows) => {

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

            }
        );

    }
);

// ======================================================
// ADD USER
// ======================================================

app.post(
    "/api/users",
    authenticateToken,
    authenticateAdmin,
    (req, res) => {

        const {
            username,
            password,
            role
        } = req.body;

        if (
            !username ||
            !password ||
            !role
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Username, password and role are required"
            });

        }

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
                    success: true,
                    message:
                        "User Added Successfully"
                });

            }
        );

    }
);

// ======================================================
// UPDATE USER
// ======================================================

app.put(
    "/api/users/:id",
    authenticateToken,
    authenticateAdmin,
    (req, res) => {

        const {
            username,
            password,
            role
        } = req.body;

        const id =
            req.params.id;

        let sql;
        let values;

        // If password is empty,
        // don't change existing password.

        if (
            password &&
            password.trim() !== ""
        ) {

            sql = `
                UPDATE users
                SET
                    username = ?,
                    password = ?,
                    role = ?
                WHERE id = ?
            `;

            values = [
                username,
                password,
                role,
                id
            ];

        } else {

            sql = `
                UPDATE users
                SET
                    username = ?,
                    role = ?
                WHERE id = ?
            `;

            values = [
                username,
                role,
                id
            ];

        }

        db.query(
            sql,
            values,
            (err) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                res.json({
                    success: true,
                    message:
                        "User Updated Successfully"
                });

            }
        );

    }
);

// ======================================================
// DELETE USER
// ======================================================

app.delete(
    "/api/users/:id",
    authenticateToken,
    authenticateAdmin,
    (req, res) => {

        const id =
            req.params.id;

        const sql = `
            DELETE FROM users
            WHERE id = ?
        `;

        db.query(
            sql,
            [id],
            (err) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                res.json({
                    success: true,
                    message:
                        "User Deleted Successfully"
                });

            }
        );

    }
);

// ======================================================
// DASHBOARD
// ======================================================

app.get(
    "/api/dashboard",
    authenticateToken,
    (req, res) => {

        const dashboard = {};

        // ==================================================
        // 1. TOTAL SALES
        // ==================================================

        db.query(
            `
            SELECT
                IFNULL(SUM(total), 0)
                AS totalSales
            FROM invoices
            `,
            (err, rows) => {

                if (err) {

                    console.error(
                        "Total Sales Error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                dashboard.totalSales =
                    rows[0].totalSales;

                // ==================================================
                // 2. TODAY SALES
                // ==================================================

                db.query(
                    `
                    SELECT
                        IFNULL(SUM(total), 0)
                        AS todaySales
                    FROM invoices
                    WHERE invoice_date = CURDATE()
                    `,
                    (err, rows) => {

                        if (err) {

                            return res.status(500).json({
                                success: false,
                                message: err.message
                            });

                        }

                        dashboard.todaySales =
                            rows[0].todaySales;

                        // ==================================================
                        // 3. TODAY ORDERS
                        // ==================================================

                        db.query(
                            `
                            SELECT
                                COUNT(*)
                                AS todayOrders
                            FROM invoices
                            WHERE invoice_date = CURDATE()
                            `,
                            (err, rows) => {

                                if (err) {

                                    return res.status(500).json({
                                        success: false,
                                        message: err.message
                                    });

                                }

                                dashboard.todayOrders =
                                    rows[0].todayOrders;

                                // ==================================================
                                // 4. CASH SALES
                                // ==================================================

                                db.query(
                                    `
                                    SELECT
                                        IFNULL(SUM(total), 0)
                                        AS cashSales
                                    FROM invoices
                                    WHERE payment_Method = 'Cash'
                                    AND invoice_date = CURDATE()
                                    `,
                                    (err, rows) => {

                                        if (err) {

                                            return res.status(500).json({
                                                success: false,
                                                message: err.message
                                            });

                                        }

                                        dashboard.cashSales =
                                            rows[0].cashSales;

                                        // ==================================================
                                        // 5. ONLINE SALES
                                        // ==================================================

                                        db.query(
                                            `
                                            SELECT
                                                IFNULL(SUM(total), 0)
                                                AS onlineSales
                                            FROM invoices
                                            WHERE payment_Method = 'Online'
                                            AND invoice_date = CURDATE()
                                            `,
                                            (err, rows) => {

                                                if (err) {

                                                    return res.status(500).json({
                                                        success: false,
                                                        message: err.message
                                                    });

                                                }

                                                dashboard.onlineSales =
                                                    rows[0].onlineSales;

                                                // ==================================================
                                                // 6. TOP PRODUCT
                                                // ==================================================

                                                db.query(
                                                    `
                                                    SELECT
                                                        item_name,
                                                        SUM(qty)
                                                        AS total_quantity_sold
                                                    FROM invoice_items
                                                    GROUP BY item_name
                                                    ORDER BY
                                                        total_quantity_sold DESC
                                                    LIMIT 1
                                                    `,
                                                    (err, rows) => {

                                                        if (err) {

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
                                                                COUNT(*)
                                                                AS total_orders,
                                                                SUM(total)
                                                                AS total_spent
                                                            FROM invoices
                                                            WHERE customer_name IS NOT NULL
                                                            AND customer_name != ''
                                                            GROUP BY customer_name
                                                            ORDER BY total_spent DESC
                                                            LIMIT 1
                                                            `,
                                                            (err, rows) => {

                                                                if (err) {

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
                                                                        COUNT(*)
                                                                        AS total_orders,
                                                                        SUM(total)
                                                                        AS total_sales
                                                                    FROM invoices
                                                                    WHERE cashier_name IS NOT NULL
                                                                    AND cashier_name != ''
                                                                    GROUP BY cashier_name
                                                                    ORDER BY total_sales DESC
                                                                    LIMIT 1
                                                                    `,
                                                                    (err, rows) => {

                                                                        if (err) {

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
                                                                            SELECT
                                                                                COUNT(*)
                                                                                AS totalProducts
                                                                            FROM products
                                                                            `,
                                                                            (err, rows) => {

                                                                                if (err) {

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
                                                                                    SELECT
                                                                                        COUNT(*)
                                                                                        AS totalCustomers
                                                                                    FROM customers
                                                                                    `,
                                                                                    (err, rows) => {

                                                                                        if (err) {

                                                                                            return res.status(500).json({
                                                                                                success: false,
                                                                                                message: err.message
                                                                                            });

                                                                                        }

                                                                                        dashboard.totalCustomers =
                                                                                            rows[0].totalCustomers;

                                                                                        // ==================================================
                                                                                        // 11. MONTHLY SALES
                                                                                        // ==================================================

                                                                                        db.query(
                                                                                            `
                                                                                            SELECT
                                                                                                IFNULL(SUM(total), 0)
                                                                                                AS monthlySales
                                                                                            FROM invoices
                                                                                            WHERE YEAR(invoice_date) =
                                                                                                YEAR(CURDATE())
                                                                                            AND MONTH(invoice_date) =
                                                                                                MONTH(CURDATE())
                                                                                            `,
                                                                                            (err, rows) => {

                                                                                                if (err) {

                                                                                                    return res.status(500).json({
                                                                                                        success: false,
                                                                                                        message: err.message
                                                                                                    });

                                                                                                }

                                                                                                dashboard.monthlySales =
                                                                                                    rows[0].monthlySales;

                                                                                                // ==================================================
                                                                                                // 12. MONTHLY ORDERS
                                                                                                // ==================================================

                                                                                                db.query(
                                                                                                    `
                                                                                                    SELECT
                                                                                                        COUNT(*)
                                                                                                        AS monthlyOrders
                                                                                                    FROM invoices
                                                                                                    WHERE YEAR(invoice_date) =
                                                                                                        YEAR(CURDATE())
                                                                                                    AND MONTH(invoice_date) =
                                                                                                        MONTH(CURDATE())
                                                                                                    `,
                                                                                                    (err, rows) => {

                                                                                                        if (err) {

                                                                                                            return res.status(500).json({
                                                                                                                success: false,
                                                                                                                message: err.message
                                                                                                            });

                                                                                                        }

                                                                                                        dashboard.monthlyOrders =
                                                                                                            rows[0].monthlyOrders;

                                                                                                        // ==================================================
                                                                                                        // RESPONSE
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

    }
);

// ======================================================
// DAILY SALES ANALYSIS
// ======================================================

app.get(
    "/api/dashboard/daily-sales",
    authenticateToken,
    (req, res) => {

        const sql = `
            SELECT
                DATE(invoice_date)
                    AS saleDate,

                IFNULL(
                    SUM(total),
                    0
                ) AS sales,

                COUNT(*) AS orders

            FROM invoices

            GROUP BY DATE(invoice_date)

            ORDER BY saleDate ASC
        `;

        db.query(
            sql,
            (err, rows) => {

                if (err) {

                    console.error(
                        "Daily Sales Error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                res.json({
                    success: true,
                    dailySales: rows
                });

            }
        );

    }
);

// ======================================================
// GET ALL INVOICES
// ======================================================

app.get(
    "/api/invoices",
    authenticateToken,
    (req, res) => {

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
                ON invoices.customer_id =
                    customers.id
            ORDER BY invoices.id DESC
        `;

        db.query(
            sql,
            (err, rows) => {

                if (err) {

                    console.error(
                        "Invoice History Error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                res.json({
                    success: true,
                    invoices: rows
                });

            }
        );

    }
);

// ======================================================
// GET SINGLE INVOICE
// ======================================================

app.get(
    "/api/invoices/:id",
    authenticateToken,
    (req, res) => {

        const invoiceId =
            req.params.id;

        const invoiceSql = `
            SELECT
                invoices.*,
                customers.phone_number
            FROM invoices
            LEFT JOIN customers
                ON invoices.customer_id =
                    customers.id
            WHERE invoices.id = ?
        `;

        db.query(
            invoiceSql,
            [invoiceId],
            (err, invoiceRows) => {

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

                db.query(
                    itemSql,
                    [invoiceId],
                    (err, itemRows) => {

                        if (err) {

                            return res.status(500).json({
                                success: false,
                                message: err.message
                            });

                        }

                        res.json({
                            success: true,
                            invoice:
                                invoiceRows[0],
                            items:
                                itemRows
                        });

                    }
                );

            }
        );

    }
);

// ======================================================
// SAVE INVOICE
// ======================================================
// IMPORTANT:
// This is the ONLY /api/invoices POST route.
// ======================================================

app.post(
    "/api/invoices",
    authenticateToken,
    (req, res) => {

        console.log(
            "POST /api/invoices called"
        );

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

        console.log(
            "Redeem Points:",
            redeemPoints
        );

        // ==================================================
        // VALIDATE ITEMS
        // ==================================================

        const validItems =
            (items || []).filter(
                item =>
                    item.name &&
                    item.name.trim() !== ""
            );

        if (
            validItems.length === 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "No products added to invoice"
            });

        }

        // ==================================================
        // START TRANSACTION
        // ==================================================

        db.beginTransaction(
            (err) => {

                if (err) {

                    console.error(
                        "Transaction Start Error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                // ==================================================
                // ROLLBACK HELPER
                // ==================================================

                const rollback = (
                    error,
                    message,
                    statusCode = 500
                ) => {

                    console.error(
                        "Transaction Error:",
                        error
                    );

                    db.rollback(
                        () => {

                            return res.status(
                                statusCode
                            ).json({
                                success: false,
                                message
                            });

                        }
                    );

                };

                // ==================================================
                // CHECK STOCK
                // ==================================================

                const checkStock = (
                    index = 0
                ) => {

                    if (
                        index >=
                        validItems.length
                    ) {

                        checkCustomer();

                        return;

                    }

                    const item =
                        validItems[index];

                    const stockSql = `
                        SELECT
                            id,
                            product_name,
                            stock_quantity
                        FROM products
                        WHERE product_name = ?
                        FOR UPDATE
                    `;

                    db.query(
                        stockSql,
                        [item.name],
                        (err, rows) => {

                            if (err) {

                                return rollback(
                                    err,
                                    "Stock check failed"
                                );

                            }

                            if (
                                rows.length === 0
                            ) {

                                return rollback(
                                    new Error(
                                        `${item.name} not found`
                                    ),
                                    `${item.name} not found in products`,
                                    400
                                );

                            }

                            const product =
                                rows[0];

                            const currentStock =
                                Number(
                                    product.stock_quantity
                                ) || 0;

                            const requestedQuantity =
                                Number(item.qty);

                            // ==================================================
                            // VALIDATE QUANTITY
                            // ==================================================

                            if (
                                !Number.isInteger(
                                    requestedQuantity
                                ) ||
                                requestedQuantity <= 0
                            ) {

                                return rollback(
                                    new Error(
                                        `Invalid quantity for ${item.name}`
                                    ),
                                    `Invalid quantity for ${item.name}`,
                                    400
                                );

                            }

                            // ==================================================
                            // CHECK STOCK
                            // ==================================================

                            if (
                                requestedQuantity >
                                currentStock
                            ) {

                                return rollback(
                                    new Error(
                                        `Insufficient stock for ${item.name}`
                                    ),
                                    `Insufficient stock for ${item.name}. Available: ${currentStock}, Requested: ${requestedQuantity}`,
                                    400
                                );

                            }

                            checkStock(
                                index + 1
                            );

                        }
                    );

                };

                // ==================================================
                // CHECK CUSTOMER
                // ==================================================

                const checkCustomer = () => {

                    const customerSql = `
                        SELECT
                            id,
                            loyalty_points
                        FROM customers
                        WHERE phone_number = ?
                        FOR UPDATE
                    `;

                    db.query(
                        customerSql,
                        [phoneNumber],
                        (err, rows) => {

                            if (err) {

                                return rollback(
                                    err,
                                    "Customer check failed"
                                );

                            }

                            // ==================================================
                            // EXISTING CUSTOMER
                            // ==================================================

                            if (
                                rows.length > 0
                            ) {

                                const customerId =
                                    rows[0].id;

                                const loyaltyPoints =
                                    Number(
                                        rows[0]
                                            .loyalty_points
                                    ) || 0;

                                console.log(
                                    "Existing Customer ID:",
                                    customerId
                                );

                                saveInvoice(
                                    customerId,
                                    loyaltyPoints
                                );

                            }

                            // ==================================================
                            // NEW CUSTOMER
                            // ==================================================

                            else {

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
                                    (
                                        err,
                                        result
                                    ) => {

                                        if (err) {

                                            return rollback(
                                                err,
                                                "Customer creation failed"
                                            );

                                        }

                                        const customerId =
                                            result.insertId;

                                        console.log(
                                            "New Customer ID:",
                                            customerId
                                        );

                                        saveInvoice(
                                            customerId,
                                            0
                                        );

                                    }
                                );

                            }

                        }
                    );

                };

                // ==================================================
                // SAVE INVOICE
                // ==================================================

                const saveInvoice = (
                    customerId,
                    loyaltyPoints
                ) => {

                    // ==================================================
                    // GET LAST INVOICE NUMBER
                    // ==================================================

                    const getLastInvoiceSql = `
                        SELECT
                            invoice_number
                        FROM invoices
                        ORDER BY id DESC
                        LIMIT 1
                        FOR UPDATE
                    `;

                    db.query(
                        getLastInvoiceSql,
                        (err, rows) => {

                            if (err) {

                                return rollback(
                                    err,
                                    "Invoice number generation failed"
                                );

                            }

                            let invoiceNumber =
                                "INV-0001";

                            if (
                                rows.length > 0
                            ) {

                                const lastInvoice =
                                    rows[0]
                                        .invoice_number;

                                const lastNumber =
                                    parseInt(
                                        lastInvoice.replace(
                                            "INV-",
                                            ""
                                        )
                                    );

                                invoiceNumber =
                                    "INV-" +
                                    String(
                                        lastNumber + 1
                                    ).padStart(
                                        4,
                                        "0"
                                    );

                            }

                            // ==================================================
                            // LOYALTY
                            // ==================================================

                            const redeemedPoints =
                                redeemPoints
                                    ? loyaltyPoints
                                    : 0;

                            const earnedPoints =
                                Math.floor(
                                    Number(total) /
                                    100
                                );

                            const finalPoints =
                                loyaltyPoints -
                                redeemedPoints +
                                earnedPoints;

                            // ==================================================
                            // INSERT INVOICE
                            // ==================================================

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
                                    TIME(
                                        CONVERT_TZ(
                                            NOW(),
                                            '+00:00',
                                            '+05:30'
                                        )
                                    ),
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
                                    redeemedPoints,
                                    taxRate,
                                    total,
                                    paymentMethod
                                ],
                                (
                                    err,
                                    result
                                ) => {

                                    if (err) {

                                        return rollback(
                                            err,
                                            "Invoice creation failed"
                                        );

                                    }

                                    const invoiceId =
                                        result.insertId;

                                    processItem(
                                        0,
                                        invoiceId,
                                        customerId,
                                        loyaltyPoints,
                                        redeemedPoints,
                                        earnedPoints,
                                        finalPoints,
                                        invoiceNumber
                                    );

                                }
                            );

                        }
                    );

                };

                // ==================================================
                // PROCESS ITEMS
                // ==================================================

                const processItem = (
                    index,
                    invoiceId,
                    customerId,
                    loyaltyPoints,
                    redeemedPoints,
                    earnedPoints,
                    finalPoints,
                    invoiceNumber
                ) => {

                    if (
                        index >=
                        validItems.length
                    ) {

                        updateLoyaltyPoints(
                            customerId,
                            finalPoints,
                            invoiceNumber,
                            earnedPoints,
                            redeemedPoints
                        );

                        return;

                    }

                    const item =
                        validItems[index];

                    // ==================================================
                    // GET PRODUCT
                    // ==================================================

                    const getProductSql = `
                        SELECT
                            id,
                            product_name,
                            stock_quantity
                        FROM products
                        WHERE product_name = ?
                        FOR UPDATE
                    `;

                    db.query(
                        getProductSql,
                        [item.name],
                        (err, rows) => {

                            if (err) {

                                return rollback(
                                    err,
                                    "Product stock retrieval failed"
                                );

                            }

                            if (
                                rows.length === 0
                            ) {

                                return rollback(
                                    new Error(
                                        `${item.name} not found`
                                    ),
                                    `${item.name} not found`,
                                    400
                                );

                            }

                            const product =
                                rows[0];

                            const stockBefore =
                                Number(
                                    product.stock_quantity
                                ) || 0;

                            const quantity =
                                Number(item.qty);

                            const stockAfter =
                                stockBefore -
                                quantity;

                            if (
                                stockAfter < 0
                            ) {

                                return rollback(
                                    new Error(
                                        `Insufficient stock for ${item.name}`
                                    ),
                                    `Insufficient stock for ${item.name}. Available: ${stockBefore}, Requested: ${quantity}`,
                                    400
                                );

                            }

                            // ==================================================
                            // INSERT INVOICE ITEM
                            // ==================================================

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
                                    quantity,
                                    item.price,
                                    quantity *
                                        Number(
                                            item.price
                                        )
                                ],
                                (err) => {

                                    if (err) {

                                        return rollback(
                                            err,
                                            "Invoice item creation failed"
                                        );

                                    }

                                    // ==================================================
                                    // UPDATE STOCK
                                    // ==================================================

                                    const updateStockSql = `
                                        UPDATE products
                                        SET stock_quantity = ?
                                        WHERE id = ?
                                    `;

                                    db.query(
                                        updateStockSql,
                                        [
                                            stockAfter,
                                            product.id
                                        ],
                                        (err) => {

                                            if (err) {

                                                return rollback(
                                                    err,
                                                    "Stock update failed"
                                                );

                                            }

                                            // ==================================================
                                            // STOCK MOVEMENT
                                            // ==================================================

                                            const movementSql = `
                                                INSERT INTO stock_movements
                                                (
                                                    product_id,
                                                    product_name,
                                                    movement_type,
                                                    quantity,
                                                    stock_before,
                                                    stock_after,
                                                    reference_type,
                                                    reference_id,
                                                    performed_by
                                                )
                                                VALUES
                                                (
                                                    ?,
                                                    ?,
                                                    'STOCK_OUT',
                                                    ?,
                                                    ?,
                                                    ?,
                                                    'SALE',
                                                    ?,
                                                    ?
                                                )
                                            `;

                                            db.query(
                                                movementSql,
                                                [
                                                    product.id,
                                                    product.product_name,
                                                    quantity,
                                                    stockBefore,
                                                    stockAfter,
                                                    invoiceId,
                                                    cashierName
                                                ],
                                                (err) => {

                                                    if (err) {

                                                        return rollback(
                                                            err,
                                                            "Stock movement creation failed"
                                                        );

                                                    }

                                                    // ==================================================
                                                    // NEXT ITEM
                                                    // ==================================================

                                                    processItem(
                                                        index + 1,
                                                        invoiceId,
                                                        customerId,
                                                        loyaltyPoints,
                                                        redeemedPoints,
                                                        earnedPoints,
                                                        finalPoints,
                                                        invoiceNumber
                                                    );

                                                }
                                            );

                                        }
                                    );

                                }
                            );

                        }
                    );

                };

                // ==================================================
                // UPDATE LOYALTY POINTS
                // ==================================================

                const updateLoyaltyPoints = (
                    customerId,
                    finalPoints,
                    invoiceNumber,
                    earnedPoints,
                    redeemedPoints
                ) => {

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

                                return rollback(
                                    err,
                                    "Loyalty points update failed"
                                );

                            }

                            // ==================================================
                            // COMMIT
                            // ==================================================

                            db.commit(
                                (err) => {

                                    if (err) {

                                        return db.rollback(
                                            () => {

                                                console.error(
                                                    "Commit Error:",
                                                    err
                                                );

                                                return res.status(
                                                    500
                                                ).json({
                                                    success: false,
                                                    message:
                                                        "Failed to commit invoice"
                                                });

                                            }
                                        );

                                    }

                                    console.log(
                                        "Invoice transaction committed:",
                                        invoiceNumber
                                    );

                                    return res.json({

                                        success: true,

                                        message:
                                            "Invoice Saved Successfully",

                                        invoiceNumber,

                                        earnedPoints,

                                        redeemedPoints,

                                        finalPoints

                                    });

                                }
                            );

                        }
                    );

                };

                // ==================================================
                // START STOCK VALIDATION
                // ==================================================

                checkStock();

            }
        );

    }
);

// ======================================================
// DELETE INVOICE
// ======================================================

app.delete(
    "/api/invoices/:id",
    authenticateToken,
    authenticateAdmin,
    (req, res) => {

        const invoiceId =
            req.params.id;

        // ==================================================
        // DELETE ITEMS
        // ==================================================

        db.query(
            `
            DELETE FROM invoice_items
            WHERE invoice_id = ?
            `,
            [invoiceId],
            (err) => {

                if (err) {

                    console.error(err);

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                // ==================================================
                // DELETE INVOICE
                // ==================================================

                db.query(
                    `
                    DELETE FROM invoices
                    WHERE id = ?
                    `,
                    [invoiceId],
                    (err) => {

                        if (err) {

                            console.error(err);

                            return res.status(500).json({
                                success: false,
                                message: err.message
                            });

                        }

                        res.json({
                            success: true,
                            message:
                                "Invoice deleted successfully"
                        });

                    }
                );

            }
        );

    }
);
// ======================================================
// GET INVOICE FOR RETURN / REFUND
// ======================================================

app.get(
    "/api/returns/invoice/:invoiceNumber",
    authenticateToken,
    (req, res) => {

        const invoiceNumber = req.params.invoiceNumber;

        // ==================================================
        // GET INVOICE
        // ==================================================

        const invoiceSql = `
            SELECT
                id,
                invoice_number,
                invoice_date,
                invoice_time,
                customer_id,
                customer_name,
                cashier_name,
                subtotal,
                discount,
                loyalty_discount,
                tax,
                total,
                payment_method
            FROM invoices
            WHERE invoice_number = ?
        `;

        db.query(
            invoiceSql,
            [invoiceNumber],
            (err, invoiceRows) => {

                if (err) {

                    console.error(
                        "Return Invoice Search Error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                if (invoiceRows.length === 0) {

                    return res.status(404).json({
                        success: false,
                        message: "Invoice not found"
                    });

                }

                const invoice = invoiceRows[0];

                // ==================================================
                // GET ORIGINAL INVOICE ITEMS
                // ==================================================

                const itemSql = `
                    SELECT
                        item_name,
                        qty,
                        price,
                        amount
                    FROM invoice_items
                    WHERE invoice_id = ?
                `;

                db.query(
                    itemSql,
                    [invoice.id],
                    (err, itemRows) => {

                        if (err) {

                            console.error(
                                "Return Invoice Items Error:",
                                err
                            );

                            return res.status(500).json({
                                success: false,
                                message: err.message
                            });

                        }

                        // ==================================================
                        // GET ALREADY RETURNED QUANTITIES
                        // ==================================================

                        const returnedSql = `
                            SELECT
                                product_name,
                                SUM(returned_quantity) AS returned_quantity
                            FROM return_items
                            WHERE invoice_id = ?
                            GROUP BY product_name
                        `;

                        db.query(
                            returnedSql,
                            [invoice.id],
                            (err, returnedRows) => {

                                if (err) {

                                    console.error(
                                        "Returned Quantity Error:",
                                        err
                                    );

                                    return res.status(500).json({
                                        success: false,
                                        message: err.message
                                    });

                                }

                                // ==================================================
                                // CREATE RETURNED QUANTITY MAP
                                // ==================================================

                                const returnedMap = {};

                                returnedRows.forEach(row => {

                                    returnedMap[row.product_name] =
                                        Number(
                                            row.returned_quantity
                                        ) || 0;

                                });

                                // ==================================================
                                // CALCULATE RETURNABLE QUANTITY
                                // ==================================================

                                const items = itemRows.map(item => {

                                    const originalQuantity =
                                        Number(item.qty) || 0;

                                    const alreadyReturned =
                                        returnedMap[item.item_name] || 0;

                                    const returnableQuantity =
                                        originalQuantity -
                                        alreadyReturned;

                                    return {

                                        productName:
                                            item.item_name,

                                        originalQuantity,

                                        alreadyReturned,

                                        returnableQuantity,

                                        price:
                                            Number(item.price),

                                        originalAmount:
                                            Number(item.amount)

                                    };

                                });

                                // ==================================================
                                // FINAL RESPONSE
                                // ==================================================

                                return res.json({

                                    success: true,

                                    invoice: {

                                        id:
                                            invoice.id,

                                        invoiceNumber:
                                            invoice.invoice_number,

                                        invoiceDate:
                                            invoice.invoice_date,

                                        invoiceTime:
                                            invoice.invoice_time,

                                        customerId:
                                            invoice.customer_id,

                                        customerName:
                                            invoice.customer_name,

                                        cashierName:
                                            invoice.cashier_name,

                                        subtotal:
                                            Number(invoice.subtotal),

                                        discount:
                                            Number(invoice.discount || 0),

                                        loyaltyDiscount:
                                            Number(
                                                invoice.loyalty_discount || 0
                                            ),

                                        tax:
                                            Number(invoice.tax || 0),

                                        total:
                                            Number(invoice.total),

                                        paymentMethod:
                                            invoice.payment_method

                                    },

                                    items

                                });

                            }
                        );

                    }
                );

            }
        );

    }
);
// ======================================================
// LOGIN
// ======================================================

app.post(
    "/api/login",
    (req, res) => {

        const {
            username,
            password
        } = req.body;

        const sql = `
            SELECT
                id,
                username,
                role
            FROM users
            WHERE username = ?
            AND password = ?
        `;

        db.query(
            sql,
            [
                username,
                password
            ],
            (err, rows) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                if (
                    rows.length === 0
                ) {

                    return res.json({
                        success: false,
                        message:
                            "Invalid Username or Password"
                    });

                }

                const user =
                    rows[0];

                // ==================================================
                // CREATE JWT
                // ==================================================

                const token =
                    jwt.sign(
                        {
                            id: user.id,
                            username:
                                user.username,
                            role:
                                user.role
                        },
                        process.env.JWT_SECRET,
                        {
                            expiresIn:
                                "8h"
                        }
                    );

                res.json({

                    success: true,

                    token,

                    user

                });

            }
        );

    }
);

// ======================================================
// TEST ROUTE
// ======================================================

app.get(
    "/",
    (req, res) => {

        res.send(
            "Invoice Backend is Running..."
        );

    }
);

// ======================================================
// START SERVER
// ======================================================

const PORT =
    process.env.PORT || 5000;

app.listen(
    PORT,
    () => {

        console.log(
            `Server running on port ${PORT}`
        );

    }
);