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
                String(lastNumber + 1).padStart(4, "0");
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

// ======================================================
// GET CUSTOMER PURCHASE HISTORY
// ======================================================

app.get(
    "/api/customers/:id/purchases",
    authenticateToken,
    (req, res) => {

        const customerId = req.params.id;

        // ======================================================
        // GET CUSTOMER DETAILS
        // ======================================================

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

                // ======================================================
                // GET CUSTOMER INVOICES
                // ======================================================

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

                        // ======================================================
                        // GET ITEMS FOR ALL INVOICES
                        // ======================================================

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

                                // ======================================================
                                // NEW:
                                // GET RETURN / REFUND HISTORY
                                // ======================================================

                                const returnSql = `
                                    SELECT
                                        id,
                                        invoice_id,
                                        invoice_number,
                                        product_id,
                                        product_name,
                                        original_qty,
                                        return_qty,
                                        refund_amount,
                                        reason,
                                        returned_by,
                                        created_at
                                    FROM invoice_returns
                                    WHERE invoice_id IN (?)
                                    ORDER BY created_at DESC
                                `;

                                db.query(
                                    returnSql,
                                    [invoiceIds],
                                    (err, returnRows) => {

                                        if (err) {

                                            console.error(
                                                "Customer Return History Error:",
                                                err
                                            );

                                            return res.status(500).json({
                                                success: false,
                                                message: err.message
                                            });
                                        }

                                        // ======================================================
                                        // NEW:
                                        // COMBINE INVOICES + ITEMS + RETURNS
                                        // ======================================================

                                        const purchases =
                                            invoiceRows.map(
                                                invoice => {

                                                    const invoiceReturns =
                                                        returnRows.filter(
                                                            returnItem =>
                                                                Number(
                                                                    returnItem.invoice_id
                                                                ) ===
                                                                Number(
                                                                    invoice.id
                                                                )
                                                        );

                                                    const totalRefund =
                                                        invoiceReturns.reduce(
                                                            (sum, returnItem) =>
                                                                sum +
                                                                Number(
                                                                    returnItem.refund_amount || 0
                                                                ),
                                                            0
                                                        );

                                                    const totalReturnedQty =
                                                        invoiceReturns.reduce(
                                                            (sum, returnItem) =>
                                                                sum +
                                                                Number(
                                                                    returnItem.return_qty || 0
                                                                ),
                                                            0
                                                        );

                                                    return {
                                                        ...invoice,

                                                        items:
                                                            itemRows.filter(
                                                                item =>
                                                                    Number(
                                                                        item.invoice_id
                                                                    ) ===
                                                                    Number(
                                                                        invoice.id
                                                                    )
                                                            ),

                                                        // NEW:
                                                        // All return records for this invoice
                                                        returns:
                                                            invoiceReturns,

                                                        // NEW:
                                                        // Total refunded amount
                                                        totalRefund,

                                                        // NEW:
                                                        // Total quantity returned
                                                        totalReturnedQty,

                                                        // NEW:
                                                        // Invoice status
                                                        refundStatus:
                                                            invoiceReturns.length > 0
                                                                ? "Refunded"
                                                                : "Completed"
                                                    };
                                                }
                                            );

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

                MAX(i.invoice_date) AS last_purchase

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

        db.query(sql, (err, rows) => {

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
        });
    }
);

// ======================================================
// GET ALL PRODUCTS
// ======================================================

app.get("/api/products", (req, res) => {

    const sql = `
        SELECT
            id,
            product_name,
            price,
            stock_quantity
        FROM products
        ORDER BY product_name
    `;

    db.query(sql, (err, rows) => {

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
    });
});

// ======================================================
// ADD PRODUCT
// ======================================================

app.post("/api/products", (req, res) => {

    const {
        productName,
        price
    } = req.body;

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
                message: "Product Added Successfully"
            });
        }
    );
});

// ======================================================
// UPDATE PRODUCT
// ======================================================

app.put("/api/products/:id", (req, res) => {

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
                message: "Product Updated Successfully"
            });
        }
    );
});

// ======================================================
// ADD / RESTOCK PRODUCT
// ======================================================

app.put(
    "/api/products/:id/restock",
    authenticateToken,
    (req, res) => {

        const productId = req.params.id;

        const {
            quantity
        } = req.body;

        if (
            !quantity ||
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

        // ======================================================
        // GET CURRENT PRODUCT
        // ======================================================

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
                        message: "Product not found"
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

                // ======================================================
                // UPDATE STOCK
                // ======================================================

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

                        // ======================================================
                        // STOCK MOVEMENT
                        // ======================================================

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
    (req, res) => {

        if (req.user.role !== "Admin") {

            return res.status(403).json({
                success: false,
                message:
                    "Only Admin can adjust stock"
            });
        }

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
                        message: "Product not found"
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
                                "Adjustment Update Error:",
                                err
                            );

                            return res.status(500).json({
                                success: false,
                                message: err.message
                            });
                        }

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

                                    console.error(
                                        "Adjustment History Error:",
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

        db.query(sql, (err, rows) => {

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
        });
    }
);

// ======================================================
// DELETE PRODUCT
// ======================================================

app.delete(
    "/api/products/:id",
    (req, res) => {

        const id = req.params.id;

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

// ======================================================
// ADD USER
// ======================================================

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

// ======================================================
// UPDATE USER
// ======================================================

app.put("/api/users/:id", (req, res) => {

    const {
        username,
        password,
        role
    } = req.body;

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
                message:
                    "User Updated Successfully"
            });
        }
    );
});

// ======================================================
// DELETE USER
// ======================================================

app.delete("/api/users/:id", (req, res) => {

    const id = req.params.id;

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
});

// ======================================================
// DASHBOARD
// ======================================================

app.get("/api/dashboard", (req, res) => {

    const dashboard = {};

    // ==================================================
    // TOTAL SALES
    // ==================================================

    db.query(
        `
        SELECT IFNULL(SUM(total), 0) AS totalSales
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
            // TODAY SALES
            // ==================================================

            db.query(
                `
                SELECT IFNULL(SUM(total), 0) AS todaySales
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
                    // TODAY ORDERS
                    // ==================================================

                    db.query(
                        `
                        SELECT COUNT(*) AS todayOrders
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
                            // CASH SALES
                            // ==================================================

                            db.query(
                                `
                                SELECT
                                    IFNULL(
                                        SUM(total),
                                        0
                                    ) AS cashSales
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
                                    // ONLINE SALES
                                    // ==================================================

                                    db.query(
                                        `
                                        SELECT
                                            IFNULL(
                                                SUM(total),
                                                0
                                            ) AS onlineSales
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
                                            // TOP PRODUCT
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
                                                    // TOP CUSTOMER
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
                                                        WHERE customer_name
                                                            IS NOT NULL
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
                                                            // TOP CASHIER
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
                                                                WHERE cashier_name
                                                                    IS NOT NULL
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
                                                                    // TOTAL PRODUCTS
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
                                                                            // TOTAL CUSTOMERS
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
                                                                                    // MONTHLY SALES
                                                                                    // ==================================================

                                                                                    db.query(
                                                                                        `
                                                                                        SELECT
                                                                                            IFNULL(
                                                                                                SUM(total),
                                                                                                0
                                                                                            ) AS monthlySales
                                                                                        FROM invoices
                                                                                        WHERE YEAR(invoice_date)
                                                                                            = YEAR(CURDATE())
                                                                                        AND MONTH(invoice_date)
                                                                                            = MONTH(CURDATE())
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
                                                                                            // MONTHLY ORDERS
                                                                                            // ==================================================

                                                                                            db.query(
                                                                                                `
                                                                                                SELECT
                                                                                                    COUNT(*)
                                                                                                    AS monthlyOrders
                                                                                                FROM invoices
                                                                                                WHERE YEAR(invoice_date)
                                                                                                    = YEAR(CURDATE())
                                                                                                AND MONTH(invoice_date)
                                                                                                    = MONTH(CURDATE())
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

// ======================================================
// DAILY SALES ANALYSIS
// ======================================================

app.get(
    "/api/dashboard/daily-sales",
    (req, res) => {

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
        });
    }
);

// ======================================================
// GET ALL INVOICES
// ======================================================

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
    });
});

// ======================================================
// GET SINGLE INVOICE
// ======================================================

app.get(
    "/api/invoices/:id",
    (req, res) => {

        const invoiceId =
            req.params.id;

        const invoiceSql = `
            SELECT
                invoices.*,
                customers.phone_number
            FROM invoices
            LEFT JOIN customers
                ON invoices.customer_id = customers.id
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
                    SELECT
                        ii.*,

                        COALESCE(
                            (
                                SELECT SUM(ir.return_qty)
                                FROM invoice_returns ir
                                WHERE ir.invoice_id = ii.invoice_id
                                AND ir.product_name = ii.item_name
                            ),
                            0
                        ) AS returned_qty,

                        (
                            ii.qty -
                            COALESCE(
                                (
                                    SELECT SUM(ir.return_qty)
                                    FROM invoice_returns ir
                                    WHERE ir.invoice_id = ii.invoice_id
                                    AND ir.product_name = ii.item_name
                                ),
                                0
                            )
                        ) AS remaining_qty

                    FROM invoice_items ii

                    WHERE ii.invoice_id = ?
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

app.post("/api/invoices", (req, res) => {

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

    // ======================================================
    // VALID ITEMS
    // ======================================================

    const validItems =
        (items || []).filter(
            item =>
                item.name &&
                item.name.trim() !== ""
        );

    if (validItems.length === 0) {

        return res.status(400).json({
            success: false,
            message:
                "No products added to invoice"
        });
    }

    // ======================================================
    // CHECK STOCK
    // ======================================================

    const checkStock =
        (index = 0) => {

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
            `;

            db.query(
                stockSql,
                [item.name],
                (err, rows) => {

                    if (err) {

                        console.error(
                            "Stock Check Error:",
                            err
                        );

                        return res.status(500).json({
                            success: false,
                            message: err.message
                        });
                    }

                    if (rows.length === 0) {

                        return res.status(400).json({
                            success: false,
                            message:
                                `${item.name} not found in products`
                        });
                    }

                    const product =
                        rows[0];

                    const currentStock =
                        Number(
                            product.stock_quantity
                        ) || 0;

                    const requestedQuantity =
                        Number(item.qty) || 0;

                    if (
                        requestedQuantity >
                        currentStock
                    ) {

                        return res.status(400).json({
                            success: false,
                            message:
                                `Insufficient stock for ${item.name}. Available: ${currentStock}, Requested: ${requestedQuantity}`
                        });
                    }

                    checkStock(
                        index + 1
                    );
                }
            );
        };

    // ======================================================
    // CUSTOMER CHECK
    // ======================================================

    const checkCustomer = () => {

        const checkCustomerSql = `
            SELECT
                id,
                loyalty_points
            FROM customers
            WHERE phone_number = ?
        `;

        db.query(
            checkCustomerSql,
            [phoneNumber],
            (err, rows) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });
                }

                if (rows.length > 0) {

                    const customerId =
                        rows[0].id;

                    const loyaltyPoints =
                        Number(
                            rows[0].loyalty_points
                        ) || 0;

                    saveInvoice(
                        customerId,
                        loyaltyPoints
                    );

                } else {

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

                            const customerId =
                                result.insertId;

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

    // ======================================================
    // SAVE INVOICE
    // ======================================================

    function saveInvoice(
        customerId,
        loyaltyPoints
    ) {

        const getLastInvoice = `
            SELECT invoice_number
            FROM invoices
            ORDER BY id DESC
            LIMIT 1
        `;

        db.query(
            getLastInvoice,
            (err, rows) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });
                }

                let invoiceNumber =
                    "INV-0001";

                if (rows.length > 0) {

                    const lastInvoice =
                        rows[0].invoice_number;

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
                        ).padStart(4, "0");
                }

                // ======================================================
                // INSERT INVOICE
                // ======================================================

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

                        redeemPoints
                            ? loyaltyPoints
                            : 0,

                        taxRate,
                        total,
                        paymentMethod
                    ],
                    (err, result) => {

                        if (err) {

                            console.error(
                                "Invoice Insert Error:",
                                err
                            );

                            return res.status(500).json({
                                success: false,
                                message: err.message
                            });
                        }

                        const invoiceId =
                            result.insertId;

                        let completed = 0;

                        // ======================================================
                        // UPDATE LOYALTY POINTS
                        // ======================================================

                        const updateLoyaltyPoints =
                            () => {

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

                                            console.error(
                                                "Loyalty Points Error:",
                                                err
                                            );
                                        }

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
                            };

                        // ======================================================
                        // INSERT ITEMS + DEDUCT STOCK
                        // ======================================================

                        validItems.forEach(
                            item => {

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
                                        Number(item.qty) *
                                            Number(item.price)
                                    ],
                                    (err) => {

                                        if (err) {

                                            console.error(
                                                "Invoice Item Error:",
                                                err
                                            );

                                            return res.status(500).json({
                                                success: false,
                                                message:
                                                    err.message
                                            });
                                        }

                                        // ======================================================
                                        // DEDUCT STOCK
                                        // ======================================================

                                        const updateStockSql = `
                                            UPDATE products
                                            SET stock_quantity =
                                                COALESCE(
                                                    stock_quantity,
                                                    0
                                                ) - ?
                                            WHERE product_name = ?
                                        `;

                                        db.query(
                                            updateStockSql,
                                            [
                                                Number(item.qty),
                                                item.name
                                            ],
                                            (err) => {

                                                if (err) {

                                                    console.error(
                                                        "Stock Update Error:",
                                                        err
                                                    );

                                                    return res.status(500).json({
                                                        success: false,
                                                        message:
                                                            err.message
                                                    });
                                                }

                                                // ======================================================
                                                // STOCK MOVEMENT
                                                // ======================================================

                                                const stockMovementSql = `
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
                                                    SELECT
                                                        id,
                                                        product_name,
                                                        'STOCK_OUT',
                                                        ?,
                                                        stock_quantity + ?,
                                                        stock_quantity,
                                                        'SALE',
                                                        ?,
                                                        ?
                                                    FROM products
                                                    WHERE product_name = ?
                                                `;

                                                db.query(
                                                    stockMovementSql,
                                                    [
                                                        Number(item.qty),
                                                        Number(item.qty),
                                                        invoiceId,
                                                        cashierName,
                                                        item.name
                                                    ],
                                                    (err) => {

                                                        if (err) {

                                                            console.error(
                                                                "Stock Movement Error:",
                                                                err
                                                            );

                                                            return res.status(500).json({
                                                                success: false,
                                                                message:
                                                                    err.message
                                                            });
                                                        }

                                                        completed++;

                                                        if (
                                                            completed ===
                                                            validItems.length
                                                        ) {

                                                            updateLoyaltyPoints();
                                                        }
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

    checkStock();
});

// ======================================================
// DELETE INVOICE
// ======================================================

app.delete(
    "/api/invoices/:id",
    authenticateToken,
    (req, res) => {

        // Admin only
        if (
            req.user.role !== "Admin"
        ) {

            return res.status(403).json({
                success: false,
                message:
                    "Only Admin can delete invoices"
            });
        }

        const invoiceId =
            req.params.id;

        // ======================================================
        // DELETE INVOICE ITEMS
        // ======================================================

        db.query(
            `
            DELETE FROM invoice_items
            WHERE invoice_id = ?
            `,
            [invoiceId],
            (err) => {

                if (err) {

                    console.log(err);

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });
                }

                // ======================================================
                // DELETE INVOICE
                // ======================================================

                db.query(
                    `
                    DELETE FROM invoices
                    WHERE id = ?
                    `,
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
// RETURN / REFUND INVOICE ITEM
// ======================================================
//
// IMPORTANT:
// This is the existing return route.
// NO CHANGE HERE.
//
// It:
// 1. Checks the original invoice item
// 2. Checks how many were already returned
// 3. Prevents returning more than purchased
// 4. Calculates refund
// 5. Adds returned quantity back to stock
// 6. Creates invoice_returns record
// 7. Creates STOCK_IN movement
//
// ======================================================

app.post(
    "/api/invoices/:invoiceId/return",
    authenticateToken,
    (req, res) => {

        const invoiceId =
            req.params.invoiceId;

        const {
            productName,
            returnQty,
            reason
        } = req.body;

        // ======================================================
        // VALIDATE PRODUCT
        // ======================================================

        if (
            !productName ||
            !productName.trim()
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Product name is required"
            });
        }

        // ======================================================
        // VALIDATE QUANTITY
        // ======================================================

        const quantity =
            Number(returnQty);

        if (
            !Number.isInteger(quantity) ||
            quantity <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Return quantity must be a positive whole number"
            });
        }

        // ======================================================
        // GET ORIGINAL INVOICE ITEM
        // ======================================================

        const invoiceItemSql = `
            SELECT
                i.id AS invoice_id,
                i.invoice_number,
                i.customer_id,

                ii.item_name,
                ii.qty,
                ii.price,
                ii.amount

            FROM invoices i

            INNER JOIN invoice_items ii
                ON i.id = ii.invoice_id

            WHERE i.id = ?
            AND ii.item_name = ?
        `;

        db.query(
            invoiceItemSql,
            [
                invoiceId,
                productName.trim()
            ],
            (err, rows) => {

                if (err) {

                    console.error(
                        "Return Invoice Item Error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });
                }

                // ======================================================
                // INVOICE ITEM NOT FOUND
                // ======================================================

                if (rows.length === 0) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Product was not found in this invoice"
                    });
                }

                const invoiceItem =
                    rows[0];

                const originalQty =
                    Number(
                        invoiceItem.qty
                    );

                // ======================================================
                // GET PREVIOUSLY RETURNED QUANTITY
                // ======================================================

                const returnedSql = `
                    SELECT
                        COALESCE(
                            SUM(return_qty),
                            0
                        ) AS returned_qty
                    FROM invoice_returns
                    WHERE invoice_id = ?
                    AND product_name = ?
                `;

                db.query(
                    returnedSql,
                    [
                        invoiceId,
                        productName.trim()
                    ],
                    (err, returnedRows) => {

                        if (err) {

                            console.error(
                                "Previous Return Check Error:",
                                err
                            );

                            return res.status(500).json({
                                success: false,
                                message: err.message
                            });
                        }

                        const alreadyReturned =
                            Number(
                                returnedRows[0]
                                    .returned_qty
                            ) || 0;

                        // ======================================================
                        // REMAINING QUANTITY
                        // ======================================================

                        const remainingQty =
                            originalQty -
                            alreadyReturned;

                        // ======================================================
                        // PREVENT OVER-RETURN
                        // ======================================================

                        if (
                            quantity >
                            remainingQty
                        ) {

                            return res.status(400).json({
                                success: false,

                                message:
                                    `Cannot return ${quantity}. ` +
                                    `Only ${remainingQty} item(s) remaining for return.`
                            });
                        }

                        // ======================================================
                        // REFUND CALCULATION
                        // ======================================================

                        const price =
                            Number(
                                invoiceItem.price
                            ) || 0;

                        const refundAmount =
                            quantity * price;

                        // ======================================================
                        // GET PRODUCT STOCK
                        // ======================================================

                        const productSql = `
                            SELECT
                                id,
                                product_name,
                                stock_quantity
                            FROM products
                            WHERE product_name = ?
                        `;

                        db.query(
                            productSql,
                            [productName.trim()],
                            (err, productRows) => {

                                if (err) {

                                    console.error(
                                        "Return Product Error:",
                                        err
                                    );

                                    return res.status(500).json({
                                        success: false,
                                        message: err.message
                                    });
                                }

                                if (
                                    productRows.length === 0
                                ) {

                                    return res.status(404).json({
                                        success: false,
                                        message:
                                            "Product not found in products table"
                                    });
                                }

                                const product =
                                    productRows[0];

                                const stockBefore =
                                    Number(
                                        product.stock_quantity
                                    ) || 0;

                                const stockAfter =
                                    stockBefore +
                                    quantity;

                                // ======================================================
                                // UPDATE STOCK
                                // ======================================================

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

                                            console.error(
                                                "Return Stock Update Error:",
                                                err
                                            );

                                            return res.status(500).json({
                                                success: false,
                                                message:
                                                    err.message
                                            });
                                        }

                                        // ======================================================
                                        // INSERT RETURN RECORD
                                        // ======================================================

                                        const returnSql = `
                                            INSERT INTO invoice_returns
                                            (
                                                invoice_id,
                                                invoice_number,
                                                product_id,
                                                product_name,
                                                original_qty,
                                                return_qty,
                                                refund_amount,
                                                reason,
                                                returned_by
                                            )
                                            VALUES
                                            (
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
                                            returnSql,
                                            [
                                                invoiceId,
                                                invoiceItem.invoice_number,
                                                product.id,
                                                product.product_name,
                                                originalQty,
                                                quantity,
                                                refundAmount,
                                                reason
                                                    ? reason.trim()
                                                    : null,
                                                req.user.username
                                            ],
                                            (err) => {

                                                if (err) {

                                                    console.error(
                                                        "Return Insert Error:",
                                                        err
                                                    );

                                                    return res.status(500).json({
                                                        success: false,
                                                        message:
                                                            err.message
                                                    });
                                                }

                                                // ======================================================
                                                // STOCK MOVEMENT
                                                // ======================================================

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
                                                        'RETURN',
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
                                                        req.user.username
                                                    ],
                                                    (err) => {

                                                        if (err) {

                                                            console.error(
                                                                "Return Stock Movement Error:",
                                                                err
                                                            );

                                                            return res.status(500).json({
                                                                success: false,
                                                                message:
                                                                    err.message
                                                            });
                                                        }

                                                        // ======================================================
                                                        // FINAL RESPONSE
                                                        // ======================================================

                                                        res.json({
                                                            success: true,

                                                            message:
                                                                "Product returned successfully",

                                                            invoiceId,

                                                            invoiceNumber:
                                                                invoiceItem.invoice_number,

                                                            productName:
                                                                product.product_name,

                                                            originalQty,

                                                            alreadyReturned,

                                                            returnedQty:
                                                                quantity,

                                                            remainingQty:
                                                                remainingQty -
                                                                quantity,

                                                            price,

                                                            refundAmount,

                                                            stockBefore,

                                                            stockAfter,

                                                            reason:
                                                                reason
                                                                    ? reason.trim()
                                                                    : null,

                                                            returnedBy:
                                                                req.user.username
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

// ======================================================
// LOGIN
// ======================================================

app.post("/api/login", (req, res) => {

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

            if (rows.length === 0) {

                return res.json({
                    success: false,
                    message:
                        "Invalid Username or Password"
                });
            }

            const user =
                rows[0];

            // ======================================================
            // CREATE JWT TOKEN
            // ======================================================

            const token =
                jwt.sign(
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
        }
    );
});

// ======================================================
// TEST ROUTE
// ======================================================

app.get("/", (req, res) => {

    res.send(
        "Invoice Backend is Running..."
    );
});

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