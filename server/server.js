require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const db = require("./db");
const masterDb = require("./masterDb");
const getDatabase = require("./databaseManager");

const app = express();

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(cors());
app.use(express.json());
// ======================================================
// JWT AUTHENTICATION + STORE DATABASE MIDDLEWARE
// ======================================================

const authenticateToken = (req, res, next) => {

    const authHeader =
        req.headers["authorization"];

    const token =
        authHeader &&
        authHeader.split(" ")[1];

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

            // ==================================================
            // STORE DATABASE NAME FROM JWT
            // ==================================================

            if (!user.databaseName) {

                return res.status(403).json({
                    success: false,
                    message:
                        "Store database not found in token"
                });

            }

            // ==================================================
            // GET CORRECT STORE DATABASE
            // ==================================================

            const storeDb =
                getDatabase(
                    user.databaseName
                );

            // ==================================================
            // ATTACH USER + DATABASE
            // ==================================================

            req.user = user;

            req.storeDb = storeDb;

            next();

        }
    );
};

// ======================================================
// GET NEXT INVOICE NUMBER
// ======================================================

app.get(
    "/api/next-invoice-number",
    authenticateToken,
    (req, res) => {

        const storeDb =
            req.storeDb;

        const sql = `
            SELECT invoice_number
            FROM invoices
            ORDER BY id DESC
            LIMIT 1
        `;

        storeDb.query(
            sql,
            (err, rows) => {

                if (err) {

                    console.error(
                        "Next Invoice Number Error:",
                        err
                    );

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
                            String(lastInvoice)
                                .replace("INV-", "")
                        ) || 0;

                    invoiceNumber =
                        "INV-" +
                        String(
                            lastNumber + 1
                        ).padStart(4, "0");
                }

                res.json({
                    success: true,
                    invoiceNumber
                });
            }
        );
    }
);// ======================================================
// GET CUSTOMER BY PHONE
// ======================================================

app.get(
    "/api/customer/:phone",
    authenticateToken,
    (req, res) => {

        const storeDb =
            req.storeDb;

        const phone =
            req.params.phone;

        const sql = `
            SELECT *
            FROM customers
            WHERE phone_number = ?
        `;

        storeDb.query(
            sql,
            [phone],
            (err, rows) => {

                if (err) {

                    console.error(
                        "Get Customer Error:",
                        err
                    );

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
    }
);
// ======================================================
// GET CUSTOMER PURCHASE HISTORY
// ======================================================

app.get(
    "/api/customers/:id/purchases",
    authenticateToken,
    (req, res) => {

        const storeDb =
            req.storeDb;

        const customerId =
            req.params.id;

        // ======================================================
        // CUSTOMER DETAILS
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

        storeDb.query(
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

                if (
                    customerRows.length === 0
                ) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Customer not found"
                    });
                }

                const customer =
                    customerRows[0];

                // ======================================================
                // CUSTOMER INVOICES
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

                storeDb.query(
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

                        if (
                            invoiceRows.length === 0
                        ) {

                            return res.json({
                                success: true,
                                customer,
                                purchases: []
                            });
                        }

                        const invoiceIds =
                            invoiceRows.map(
                                invoice =>
                                    invoice.id
                            );

                        // ======================================================
                        // INVOICE ITEMS
                        // ======================================================

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

                        storeDb.query(
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
                                // RETURNS
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

                                storeDb.query(
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
                                                            (
                                                                sum,
                                                                returnItem
                                                            ) =>
                                                                sum +
                                                                Number(
                                                                    returnItem.refund_amount || 0
                                                                ),
                                                            0
                                                        );

                                                    const totalReturnedQty =
                                                        invoiceReturns.reduce(
                                                            (
                                                                sum,
                                                                returnItem
                                                            ) =>
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

                                                        returns:
                                                            invoiceReturns,

                                                        totalRefund,

                                                        totalReturnedQty,

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
);// ======================================================
// GET ALL CUSTOMERS
// ======================================================

app.get(
    "/api/customers",
    authenticateToken,
    (req, res) => {

        const storeDb =
            req.storeDb;

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

        storeDb.query(
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

        const storeDb =
            req.storeDb;

        const sql = `
            SELECT
                id,
                product_name,
                price,
                stock_quantity,
                barcode
            FROM products
            ORDER BY product_name
        `;

        storeDb.query(
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
    (req, res) => {

        const storeDb =
            req.storeDb;

        const {
            productName,
            price,
            barcode
        } = req.body;

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

        const sql = `
            INSERT INTO products
            (
                product_name,
                price,
                barcode
            )
            VALUES (?, ?, ?)
        `;

        storeDb.query(
            sql,
            [
                productName.trim(),
                price,
                barcode || null
            ],
            (err, result) => {

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
                        "Product Added Successfully",
                    productId:
                        result.insertId
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
    (req, res) => {

        const storeDb =
            req.storeDb;

        const {
            productName,
            price,
            barcode
        } = req.body;

        const id =
            req.params.id;

        const sql = `
            UPDATE products
            SET
                product_name = ?,
                price = ?,
                barcode = ?
            WHERE id = ?
        `;

        storeDb.query(
            sql,
            [
                productName,
                price,
                barcode || null,
                id
            ],
            (err, result) => {

                if (err) {

                    console.error(
                        "Update Product Error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });
                }

                if (
                    result.affectedRows === 0
                ) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Product not found"
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
);// ======================================================
// ADD / RESTOCK PRODUCT
// ======================================================

app.put(
    "/api/products/:id/restock",
    authenticateToken,
    (req, res) => {

        const storeDb =
            req.storeDb;

        const productId =
            req.params.id;

        const {
            quantity
        } = req.body;

        const stockToAdd =
            Number(quantity);

        if (
            !Number.isInteger(stockToAdd) ||
            stockToAdd <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid stock quantity"
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

        storeDb.query(
            getProductSql,
            [productId],
            (err, rows) => {

                if (err) {

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

                const updateStockSql = `
                    UPDATE products
                    SET stock_quantity = ?
                    WHERE id = ?
                `;

                storeDb.query(
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

                        storeDb.query(
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

        const storeDb =
            req.storeDb;

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

        storeDb.query(
            getProductSql,
            [productId],
            (err, rows) => {

                if (err) {

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

                const updateStockSql = `
                    UPDATE products
                    SET stock_quantity = ?
                    WHERE id = ?
                `;

                storeDb.query(
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

                        storeDb.query(
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
);// ======================================================
// GET STOCK MOVEMENT HISTORY
// ======================================================

app.get(
    "/api/stock-movements",
    authenticateToken,
    (req, res) => {

        const storeDb =
            req.storeDb;

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

        storeDb.query(
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

app.get(
    "/api/users",
    authenticateToken,
    (req, res) => {

        const storeDb =
            req.storeDb;

        const sql = `
            SELECT
                id,
                username,
                role
            FROM users
            ORDER BY id
        `;

        storeDb.query(
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
    (req, res) => {

        if (req.user.role !== "Admin") {

            return res.status(403).json({
                success: false,
                message:
                    "Only Admin can add users"
            });
        }

        const storeDb =
            req.storeDb;

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
            VALUES (?, ?, ?)
        `;

        storeDb.query(
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
                        "User added successfully"
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
    (req, res) => {

        if (req.user.role !== "Admin") {

            return res.status(403).json({
                success: false,
                message:
                    "Only Admin can update users"
            });
        }

        const storeDb =
            req.storeDb;

        const {
            username,
            password,
            role
        } = req.body;

        const id =
            req.params.id;

        const sql = `
            UPDATE users
            SET
                username = ?,
                password = ?,
                role = ?
            WHERE id = ?
        `;

        storeDb.query(
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
    }
);

// ======================================================
// DELETE USER
// ======================================================

app.delete(
    "/api/users/:id",
    authenticateToken,
    (req, res) => {

        if (req.user.role !== "Admin") {

            return res.status(403).json({
                success: false,
                message:
                    "Only Admin can delete users"
            });
        }

        const storeDb =
            req.storeDb;

        const id =
            req.params.id;

        const sql = `
            DELETE FROM users
            WHERE id = ?
        `;

        storeDb.query(
            sql,
            [id],
            (err, result) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });
                }

                if (
                    result.affectedRows === 0
                ) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "User not found"
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
);// ======================================================
// DASHBOARD
// ======================================================

app.get(
    "/api/dashboard",
    authenticateToken,
    (req, res) => {

        // ==================================================
        // STORE DATABASE
        // ==================================================

        const storeDb = req.storeDb;

        const dashboard = {};

        // ==================================================
        // TOTAL SALES
        // ==================================================

        storeDb.query(
            `
            SELECT
                IFNULL(SUM(total), 0) AS totalSales
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

                storeDb.query(
                    `
                    SELECT
                        IFNULL(SUM(total), 0) AS todaySales
                    FROM invoices
                    WHERE invoice_date = CURDATE()
                    `,
                    (err, rows) => {

                        if (err) {

                            console.error(
                                "Today Sales Error:",
                                err
                            );

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

                        storeDb.query(
                            `
                            SELECT
                                COUNT(*) AS todayOrders
                            FROM invoices
                            WHERE invoice_date = CURDATE()
                            `,
                            (err, rows) => {

                                if (err) {

                                    console.error(
                                        "Today Orders Error:",
                                        err
                                    );

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

                                storeDb.query(
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

                                            console.error(
                                                "Cash Sales Error:",
                                                err
                                            );

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

                                        storeDb.query(
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

                                                    console.error(
                                                        "Online Sales Error:",
                                                        err
                                                    );

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

                                                storeDb.query(
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

                                                            console.error(
                                                                "Top Product Error:",
                                                                err
                                                            );

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

                                                        storeDb.query(
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

                                                                    console.error(
                                                                        "Top Customer Error:",
                                                                        err
                                                                    );

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

                                                                storeDb.query(
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

                                                                            console.error(
                                                                                "Top Cashier Error:",
                                                                                err
                                                                            );

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

                                                                        storeDb.query(
                                                                            `
                                                                            SELECT
                                                                                COUNT(*)
                                                                                    AS totalProducts
                                                                            FROM products
                                                                            `,
                                                                            (err, rows) => {

                                                                                if (err) {

                                                                                    console.error(
                                                                                        "Total Products Error:",
                                                                                        err
                                                                                    );

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

                                                                                storeDb.query(
                                                                                    `
                                                                                    SELECT
                                                                                        COUNT(*)
                                                                                            AS totalCustomers
                                                                                    FROM customers
                                                                                    `,
                                                                                    (err, rows) => {

                                                                                        if (err) {

                                                                                            console.error(
                                                                                                "Total Customers Error:",
                                                                                                err
                                                                                            );

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

                                                                                        storeDb.query(
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

                                                                                                    console.error(
                                                                                                        "Monthly Sales Error:",
                                                                                                        err
                                                                                                    );

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

                                                                                                storeDb.query(
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

                                                                                                            console.error(
                                                                                                                "Monthly Orders Error:",
                                                                                                                err
                                                                                                            );

                                                                                                            return res.status(500).json({
                                                                                                                success: false,
                                                                                                                message: err.message
                                                                                                            });
                                                                                                        }

                                                                                                        dashboard.monthlyOrders =
                                                                                                            rows[0].monthlyOrders;


                                                                                                        // ==================================================
                                                                                                        // FINAL DASHBOARD RESPONSE
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

        // ==================================================
        // STORE DATABASE
        // ==================================================

        const storeDb = req.storeDb;

        const sql = `
            SELECT
                DATE(invoice_date) AS saleDate,
                IFNULL(SUM(total), 0) AS sales,
                COUNT(*) AS orders
            FROM invoices
            GROUP BY DATE(invoice_date)
            ORDER BY saleDate ASC
        `;

        storeDb.query(
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
// REPORTS
// ======================================================

app.get(
    "/api/reports",
    authenticateToken,
    (req, res) => {

        // ==================================================
        // STORE DATABASE
        // ==================================================

        const storeDb = req.storeDb;

        const {
            fromDate,
            toDate
        } = req.query;


        // ==================================================
        // VALIDATE DATES
        // ==================================================

        if (!fromDate || !toDate) {

            return res.status(400).json({
                success: false,
                message:
                    "From date and To date are required"
            });

        }


        if (fromDate > toDate) {

            return res.status(400).json({
                success: false,
                message:
                    "From date cannot be after To date"
            });

        }


        const report = {};


        // ==================================================
        // 1. SALES SUMMARY
        // ==================================================

        const salesSql = `
            SELECT

                COUNT(*) AS totalOrders,

                COALESCE(
                    SUM(subtotal),
                    0
                ) AS grossSales,

                COALESCE(
                    SUM(discount),
                    0
                ) AS totalDiscount,

                COALESCE(
                    SUM(loyalty_discount),
                    0
                ) AS totalLoyaltyDiscount,

                COALESCE(
                    SUM(tax),
                    0
                ) AS totalTax,

                COALESCE(
                    SUM(total),
                    0
                ) AS totalSales,

                COALESCE(
                    SUM(
                        CASE
                            WHEN payment_Method = 'Cash'
                            THEN total
                            ELSE 0
                        END
                    ),
                    0
                ) AS cashSales,

                COALESCE(
                    SUM(
                        CASE
                            WHEN payment_Method = 'Online'
                            THEN total
                            ELSE 0
                        END
                    ),
                    0
                ) AS onlineSales

            FROM invoices

            WHERE invoice_date
            BETWEEN ? AND ?
        `;


        storeDb.query(
            salesSql,
            [
                fromDate,
                toDate
            ],
            (err, rows) => {

                if (err) {

                    console.error(
                        "Reports Sales Error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }


                report.summary = rows[0];


                // ==================================================
                // 2. REFUND SUMMARY
                // ==================================================

                const refundSql = `
                    SELECT

                        COUNT(*) AS refundRecords,

                        COALESCE(
                            SUM(return_qty),
                            0
                        ) AS returnedQuantity,

                        COALESCE(
                            SUM(refund_amount),
                            0
                        ) AS totalRefunds

                    FROM invoice_returns

                    WHERE DATE(created_at)
                    BETWEEN ? AND ?
                `;


                storeDb.query(
                    refundSql,
                    [
                        fromDate,
                        toDate
                    ],
                    (err, rows) => {

                        if (err) {

                            console.error(
                                "Reports Refund Error:",
                                err
                            );

                            return res.status(500).json({
                                success: false,
                                message: err.message
                            });

                        }


                        report.refunds = rows[0];


                        // ==================================================
                        // 3. DAILY SALES
                        // ==================================================

                        const dailySalesSql = `
                            SELECT

                                DATE(invoice_date)
                                    AS saleDate,

                                COUNT(*) AS orders,

                                COALESCE(
                                    SUM(total),
                                    0
                                ) AS sales

                            FROM invoices

                            WHERE invoice_date
                            BETWEEN ? AND ?

                            GROUP BY
                                DATE(invoice_date)

                            ORDER BY
                                saleDate ASC
                        `;


                        storeDb.query(
                            dailySalesSql,
                            [
                                fromDate,
                                toDate
                            ],
                            (err, rows) => {

                                if (err) {

                                    console.error(
                                        "Reports Daily Sales Error:",
                                        err
                                    );

                                    return res.status(500).json({
                                        success: false,
                                        message: err.message
                                    });

                                }


                                report.dailySales =
                                    rows;


                                // ==================================================
                                // 4. TOP SELLING PRODUCTS
                                // ==================================================

                                const productsSql = `
                                    SELECT

                                        ii.item_name
                                            AS productName,

                                        SUM(ii.qty)
                                            AS quantitySold,

                                        COALESCE(
                                            SUM(ii.amount),
                                            0
                                        ) AS sales

                                    FROM invoice_items ii

                                    INNER JOIN invoices i
                                        ON ii.invoice_id = i.id

                                    WHERE i.invoice_date
                                    BETWEEN ? AND ?

                                    GROUP BY
                                        ii.item_name

                                    ORDER BY
                                        quantitySold DESC
                                `;


                                storeDb.query(
                                    productsSql,
                                    [
                                        fromDate,
                                        toDate
                                    ],
                                    (err, rows) => {

                                        if (err) {

                                            console.error(
                                                "Reports Products Error:",
                                                err
                                            );

                                            return res.status(500).json({
                                                success: false,
                                                message: err.message
                                            });

                                        }


                                        report.products =
                                            rows;


                                        // ==================================================
                                        // 5. CASHIER SALES
                                        // ==================================================

                                        const cashierSql = `
                                            SELECT

                                                cashier_name
                                                    AS cashierName,

                                                COUNT(*) AS orders,

                                                COALESCE(
                                                    SUM(total),
                                                    0
                                                ) AS sales

                                            FROM invoices

                                            WHERE invoice_date
                                            BETWEEN ? AND ?

                                            GROUP BY
                                                cashier_name

                                            ORDER BY
                                                sales DESC
                                        `;


                                        storeDb.query(
                                            cashierSql,
                                            [
                                                fromDate,
                                                toDate
                                            ],
                                            (err, rows) => {

                                                if (err) {

                                                    console.error(
                                                        "Reports Cashier Error:",
                                                        err
                                                    );

                                                    return res.status(500).json({
                                                        success: false,
                                                        message: err.message
                                                    });

                                                }


                                                report.cashiers =
                                                    rows;


                                                // ==================================================
                                                // 6. TOTAL ITEMS SOLD
                                                // ==================================================

                                                const itemsSql = `
                                                    SELECT

                                                        COALESCE(
                                                            SUM(ii.qty),
                                                            0
                                                        ) AS totalItemsSold

                                                    FROM invoice_items ii

                                                    INNER JOIN invoices i
                                                        ON ii.invoice_id = i.id

                                                    WHERE i.invoice_date
                                                    BETWEEN ? AND ?
                                                `;


                                                storeDb.query(
                                                    itemsSql,
                                                    [
                                                        fromDate,
                                                        toDate
                                                    ],
                                                    (err, rows) => {

                                                        if (err) {

                                                            console.error(
                                                                "Reports Items Error:",
                                                                err
                                                            );

                                                            return res.status(500).json({
                                                                success: false,
                                                                message: err.message
                                                            });

                                                        }


                                                        report.totalItemsSold =
                                                            rows[0].totalItemsSold;


                                                        // ==================================================
                                                        // 7. NET SALES
                                                        // ==================================================

                                                        report.netSales =
                                                            Number(
                                                                report.summary.totalSales || 0
                                                            ) -
                                                            Number(
                                                                report.refunds.totalRefunds || 0
                                                            );


                                                        // ==================================================
                                                        // FINAL REPORT RESPONSE
                                                        // ==================================================

                                                        res.json({

                                                            success: true,

                                                            fromDate,

                                                            toDate,

                                                            report

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
// GET ALL INVOICES
// CURRENT STORE ONLY
// ======================================================

app.get(
    "/api/invoices",
    authenticateToken,
    (req, res) => {

        // ======================================================
        // STORE DATABASE
        // ======================================================

        const storeDb = req.storeDb;

        // ======================================================
        // SQL
        // ======================================================

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

        // ======================================================
        // QUERY CURRENT STORE DATABASE
        // ======================================================

        storeDb.query(
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

                return res.json({
                    success: true,
                    invoices: rows
                });

            }
        );

    }
);


// ======================================================
// GET SINGLE INVOICE
// CURRENT STORE ONLY
// ======================================================

app.get(
    "/api/invoices/:id",
    authenticateToken,
    (req, res) => {

        // ======================================================
        // STORE DATABASE
        // ======================================================

        const storeDb = req.storeDb;

        // ======================================================
        // INVOICE ID
        // ======================================================

        const invoiceId = req.params.id;

        // ======================================================
        // GET INVOICE
        // ======================================================

        const invoiceSql = `
            SELECT
                invoices.*,
                customers.phone_number
            FROM invoices
            LEFT JOIN customers
                ON invoices.customer_id = customers.id
            WHERE invoices.id = ?
            LIMIT 1
        `;

        storeDb.query(
            invoiceSql,
            [invoiceId],
            (err, invoiceRows) => {

                if (err) {

                    console.error(
                        "Single Invoice Error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });
                }

                // ==================================================
                // INVOICE NOT FOUND
                // ==================================================

                if (invoiceRows.length === 0) {

                    return res.status(404).json({
                        success: false,
                        message: "Invoice not found"
                    });

                }

                // ==================================================
                // GET INVOICE ITEMS
                // ==================================================

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

                storeDb.query(
                    itemSql,
                    [invoiceId],
                    (err, itemRows) => {

                        if (err) {

                            console.error(
                                "Invoice Items Error:",
                                err
                            );

                            return res.status(500).json({
                                success: false,
                                message: err.message
                            });

                        }

                        return res.json({
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
// GET ALL REFUND / RETURN HISTORY
// ======================================================

app.get(
    "/api/refund-history",
    authenticateToken,
    (req, res) => {

        const storeDb =
            req.storeDb;

        const sql = `
            SELECT
                ir.id,
                ir.invoice_id,
                ir.invoice_number,
                ir.product_id,
                ir.product_name,
                ir.original_qty,
                ir.return_qty,
                ir.refund_amount,
                ir.reason,
                ir.returned_by,
                ir.created_at,

                i.customer_name,
                i.cashier_name,
                i.invoice_date,
                i.payment_Method,

                c.phone_number

            FROM invoice_returns ir

            LEFT JOIN invoices i
                ON ir.invoice_id = i.id

            LEFT JOIN customers c
                ON i.customer_id = c.id

            ORDER BY ir.created_at DESC
        `;

        storeDb.query(
            sql,
            (err, rows) => {

                if (err) {

                    console.error(
                        "Refund History Error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });
                }

                res.json({
                    success: true,
                    refunds: rows
                });
            }
        );
    }
);
// ======================================================
// SAVE INVOICE
// CURRENT STORE ONLY
// ======================================================

app.post(
    "/api/invoices",
    authenticateToken,
    (req, res) => {

        console.log(
            "POST /api/invoices called"
        );

        console.log(
            req.body
        );

        // ======================================================
        // CURRENT STORE DATABASE
        // ======================================================

        const storeDb = req.storeDb;

        // ======================================================
        // REQUEST DATA
        // ======================================================

        const {
            phoneNumber,
            customerName,
            subtotal,
            discountRate,
            taxRate,
            total,
            items,
            redeemPoints,
            paymentMethod
        } = req.body;

        // ======================================================
        // CASHIER FROM JWT
        // NEVER TRUST FRONTEND CASHIER NAME
        // ======================================================

        const cashierName =
            req.user.username;

        console.log(
            "Logged-in Cashier:",
            cashierName
        );

        console.log(
            "Store Database:",
            req.user.databaseName
        );

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

        if (
            validItems.length === 0
        ) {

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
                    LIMIT 1
                `;

                storeDb.query(
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
                                message:
                                    err.message
                            });

                        }

                        if (
                            rows.length === 0
                        ) {

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
                            Number(
                                item.qty
                            ) || 0;

                        if (
                            requestedQuantity <= 0
                        ) {

                            return res.status(400).json({
                                success: false,
                                message:
                                    `Invalid quantity for ${item.name}`
                            });

                        }

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
                LIMIT 1
            `;

            storeDb.query(
                checkCustomerSql,
                [phoneNumber],
                (err, rows) => {

                    if (err) {

                        console.error(
                            "Customer Check Error:",
                            err
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                err.message
                        });

                    }

                    if (
                        rows.length > 0
                    ) {

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

                        storeDb.query(
                            insertCustomerSql,
                            [
                                customerName,
                                phoneNumber
                            ],
                            (err, result) => {

                                if (err) {

                                    console.error(
                                        "Customer Insert Error:",
                                        err
                                    );

                                    return res.status(500).json({
                                        success: false,
                                        message:
                                            err.message
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
                SELECT
                    invoice_number
                FROM invoices
                ORDER BY id DESC
                LIMIT 1
            `;

            storeDb.query(
                getLastInvoice,
                (err, rows) => {

                    if (err) {

                        return res.status(500).json({
                            success: false,
                            message:
                                err.message
                        });

                    }

                    let invoiceNumber =
                        "INV-0001";

                    if (
                        rows.length > 0
                    ) {

                        const lastInvoice =
                            rows[0].invoice_number;

                        const lastNumber =
                            parseInt(
                                lastInvoice.replace(
                                    "INV-",
                                    ""
                                )
                            ) || 0;

                        invoiceNumber =
                            "INV-" +
                            String(
                                lastNumber + 1
                            ).padStart(
                                4,
                                "0"
                            );

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

                    storeDb.query(
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
                                    message:
                                        err.message
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
                                        Math.max(
                                            0,
                                            loyaltyPoints -
                                            redeemedPoints +
                                            earnedPoints
                                        );

                                    const updatePointsSql = `
                                        UPDATE customers
                                        SET loyalty_points = ?
                                        WHERE id = ?
                                    `;

                                    storeDb.query(
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

                                                return res.status(500).json({
                                                    success: false,
                                                    message:
                                                        err.message
                                                });

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

                                    storeDb.query(
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
                                            // GET STOCK BEFORE UPDATE
                                            // ======================================================

                                            const stockBeforeSql = `
                                                SELECT
                                                    id,
                                                    product_name,
                                                    stock_quantity
                                                FROM products
                                                WHERE product_name = ?
                                                LIMIT 1
                                            `;

                                            storeDb.query(
                                                stockBeforeSql,
                                                [item.name],
                                                (err, stockRows) => {

                                                    if (err) {

                                                        return res.status(500).json({
                                                            success: false,
                                                            message:
                                                                err.message
                                                        });

                                                    }

                                                    if (
                                                        stockRows.length === 0
                                                    ) {

                                                        return res.status(404).json({
                                                            success: false,
                                                            message:
                                                                `${item.name} not found`
                                                        });

                                                    }

                                                    const product =
                                                        stockRows[0];

                                                    const stockBefore =
                                                        Number(
                                                            product.stock_quantity
                                                        ) || 0;

                                                    const quantity =
                                                        Number(
                                                            item.qty
                                                        );

                                                    const stockAfter =
                                                        stockBefore -
                                                        quantity;


                                                    // ======================================================
                                                    // DEDUCT STOCK
                                                    // ======================================================

                                                    const updateStockSql = `
                                                        UPDATE products
                                                        SET stock_quantity = ?
                                                        WHERE id = ?
                                                    `;

                                                    storeDb.query(
                                                        updateStockSql,
                                                        [
                                                            stockAfter,
                                                            product.id
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

                                                            storeDb.query(
                                                                stockMovementSql,
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
            );

        }


        // ======================================================
        // START PROCESS
        // ======================================================

        checkStock();

    }
);


// ======================================================
// DELETE INVOICE
// ADMIN ONLY
// CURRENT STORE ONLY
// ======================================================

app.delete(
    "/api/invoices/:id",
    authenticateToken,
    (req, res) => {

        // ======================================================
        // ADMIN ONLY
        // ======================================================

        if (
            req.user.role !== "Admin"
        ) {

            return res.status(403).json({
                success: false,
                message:
                    "Only Admin can delete invoices"
            });

        }

        // ======================================================
        // STORE DATABASE
        // ======================================================

        const storeDb = req.storeDb;

        const invoiceId =
            req.params.id;

        // ======================================================
        // CHECK INVOICE EXISTS
        // ======================================================

        const checkInvoiceSql = `
            SELECT
                id,
                invoice_number
            FROM invoices
            WHERE id = ?
            LIMIT 1
        `;

        storeDb.query(
            checkInvoiceSql,
            [invoiceId],
            (err, invoiceRows) => {

                if (err) {

                    console.error(
                        "Check Invoice Error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            err.message
                    });

                }

                if (
                    invoiceRows.length === 0
                ) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Invoice not found"
                    });

                }


                // ======================================================
                // DELETE RETURN HISTORY
                // ======================================================

                const deleteReturnsSql = `
                    DELETE FROM invoice_returns
                    WHERE invoice_id = ?
                `;

                storeDb.query(
                    deleteReturnsSql,
                    [invoiceId],
                    (err) => {

                        if (err) {

                            console.error(
                                "Delete Invoice Returns Error:",
                                err
                            );

                            return res.status(500).json({
                                success: false,
                                message:
                                    err.message
                            });

                        }


                        // ======================================================
                        // DELETE INVOICE ITEMS
                        // ======================================================

                        const deleteItemsSql = `
                            DELETE FROM invoice_items
                            WHERE invoice_id = ?
                        `;

                        storeDb.query(
                            deleteItemsSql,
                            [invoiceId],
                            (err) => {

                                if (err) {

                                    console.error(
                                        "Delete Invoice Items Error:",
                                        err
                                    );

                                    return res.status(500).json({
                                        success: false,
                                        message:
                                            err.message
                                    });

                                }


                                // ======================================================
                                // DELETE INVOICE
                                // ======================================================

                                const deleteInvoiceSql = `
                                    DELETE FROM invoices
                                    WHERE id = ?
                                `;

                                storeDb.query(
                                    deleteInvoiceSql,
                                    [invoiceId],
                                    (err, result) => {

                                        if (err) {

                                            console.error(
                                                "Delete Invoice Error:",
                                                err
                                            );

                                            return res.status(500).json({
                                                success: false,
                                                message:
                                                    err.message
                                            });

                                        }

                                        if (
                                            result.affectedRows === 0
                                        ) {

                                            return res.status(404).json({
                                                success: false,
                                                message:
                                                    "Invoice not found"
                                            });

                                        }


                                        // ======================================================
                                        // SUCCESS
                                        // ======================================================

                                        return res.json({
                                            success: true,

                                            message:
                                                "Invoice deleted successfully",

                                            invoiceId
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
// RETURN / REFUND INVOICE ITEM
// ======================================================

app.post(
    "/api/invoices/:invoiceId/return",
    authenticateToken,
    (req, res) => {

        // ======================================================
        // STORE DATABASE
        // ======================================================

        const storeDb =
            req.storeDb;

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

        storeDb.query(
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
                        message:
                            err.message
                    });
                }

                // ======================================================
                // INVOICE ITEM NOT FOUND
                // ======================================================

                if (
                    rows.length === 0
                ) {

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

                storeDb.query(
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
                                message:
                                    err.message
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
                            quantity *
                            price;

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

                        storeDb.query(
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
                                        message:
                                            err.message
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

                                storeDb.query(
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

                                        storeDb.query(
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

                                                storeDb.query(
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
// GET STORE INFORMATION BY STORE CODE
// ======================================================

app.get("/api/store/:storeCode", (req, res) => {

    const { storeCode } = req.params;

    if (!storeCode || !storeCode.trim()) {

        return res.status(400).json({
            success: false,
            message: "Store code is required"
        });

    }

    masterDb.query(
        `
        SELECT
            store_code,
            store_name
        FROM stores
        WHERE store_code = ?
        LIMIT 1
        `,
        [storeCode.trim().toUpperCase()],
        (err, rows) => {

            if (err) {

                console.error(
                    "Store Lookup Error:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Failed to find store."
                });

            }

            if (!rows || rows.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Store not found."
                });

            }

            return res.json({
                success: true,
                store: rows[0]
            });

        }
    );

});
// ======================================================
// LOGIN
// ======================================================

app.post(
    "/api/login",
    (req, res) => {

        const {
            storeCode,
            username,
            password
        } = req.body;

        // ======================================================
        // VALIDATE INPUT
        // ======================================================

        if (
            !storeCode ||
            !username ||
            !password
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Store Code, Username and Password are required"
            });
        }

        // ======================================================
        // NORMALIZE STORE CODE
        // ======================================================

        const normalizedStoreCode =
            String(storeCode)
                .trim()
                .toUpperCase();

        // ======================================================
        // STEP 1: FIND STORE IN MASTER DATABASE
        // ======================================================

        const storeSql = `
            SELECT
                id,
                store_code,
                store_name,
                database_name
            FROM stores
            WHERE store_code = ?
            LIMIT 1
        `;

        masterDb.query(
            storeSql,
            [normalizedStoreCode],
            (err, stores) => {

                if (err) {

                    console.error(
                        "Master Database Error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            err.message
                    });
                }

                // ======================================================
                // STORE NOT FOUND
                // ======================================================

                if (
                    stores.length === 0
                ) {

                    return res.status(401).json({
                        success: false,
                        message:
                            "Invalid Store Code"
                    });
                }

                const store =
                    stores[0];

                // ======================================================
                // STEP 2: CONNECT TO STORE DATABASE
                // ======================================================

                let storeDb;

                try {

                    storeDb =
                        getDatabase(
                            store.database_name
                        );

                } catch (error) {

                    console.error(
                        "Store Database Connection Error:",
                        error
                    );

                    return res.status(500).json({
                        success: false,
                        message:
                            "Unable to connect to store database"
                    });
                }

                // ======================================================
                // STEP 3: CHECK USER IN STORE DATABASE
                // ======================================================

                const userSql = `
                    SELECT
                        id,
                        username,
                        role
                    FROM users
                    WHERE username = ?
                    AND password = ?
                    LIMIT 1
                `;

                storeDb.query(
                    userSql,
                    [
                        username,
                        password
                    ],
                    (err, rows) => {

                        if (err) {

                            console.error(
                                "Store User Login Error:",
                                err
                            );

                            return res.status(500).json({
                                success: false,
                                message:
                                    err.message
                            });
                        }

                        // ======================================================
                        // INVALID USER
                        // ======================================================

                        if (
                            rows.length === 0
                        ) {

                            return res.status(401).json({
                                success: false,
                                message:
                                    "Invalid Username or Password"
                            });
                        }

                        const user =
                            rows[0];

                        // ======================================================
                        // STEP 4: CREATE JWT
                        // ======================================================

                        const token =
                            jwt.sign(
                                {
                                    id:
                                        user.id,

                                    username:
                                        user.username,

                                    role:
                                        user.role,

                                    storeId:
                                        store.id,

                                    storeCode:
                                        store.store_code,

                                    storeName:
                                        store.store_name,

                                    databaseName:
                                        store.database_name
                                },

                                process.env.JWT_SECRET,

                                {
                                    expiresIn:
                                        "8h"
                                }
                            );

                        // ======================================================
                        // STEP 5: LOGIN SUCCESS
                        // ======================================================

                        return res.json({

                            success:
                                true,

                            token:

                                token,

                            store: {

                                id:
                                    store.id,

                                storeCode:
                                    store.store_code,

                                storeName:
                                    store.store_name

                            },

                            user: {

                                id:
                                    user.id,

                                username:
                                    user.username,

                                role:
                                    user.role

                            }

                        });

                    }
                );

            }
        );

    }
);
/// ======================================================
// TEST ROUTE
// ======================================================

app.get("/", (req, res) => {

    res.send(
        "Invoice Backend is Running..."
    );

});// ======================================================
// CASH REGISTER - TODAY'S SUMMARY
// ======================================================

app.get(
    "/api/cash-register/summary",
    authenticateToken,
    (req, res) => {

        // ======================================================
        // STORE DATABASE
        // ======================================================

        const storeDb =
            req.storeDb;

        // ======================================================
        // LOGGED-IN CASHIER
        // ======================================================

        const cashierName =
            req.user.username;

        const summary = {};

        // ======================================================
        // CASH SALES - ONLY LOGGED-IN CASHIER
        // ======================================================

        const cashSalesSql = `
            SELECT
                COALESCE(
                    SUM(total),
                    0
                ) AS cashSales
            FROM invoices
            WHERE payment_Method = 'Cash'
            AND cashier_name = ?
            AND DATE(invoice_date) = CURDATE()
        `;

        storeDb.query(
            cashSalesSql,
            [cashierName],
            (err, rows) => {

                if (err) {

                    console.error(
                        "Cash Register Cash Sales Error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });
                }

                summary.cashSales =
                    Number(
                        rows[0].cashSales || 0
                    );

                // ======================================================
                // ONLINE SALES - ONLY LOGGED-IN CASHIER
                // ======================================================

                const onlineSalesSql = `
                    SELECT
                        COALESCE(
                            SUM(total),
                            0
                        ) AS onlineSales
                    FROM invoices
                    WHERE payment_Method = 'Online'
                    AND cashier_name = ?
                    AND DATE(invoice_date) = CURDATE()
                `;

                storeDb.query(
                    onlineSalesSql,
                    [cashierName],
                    (err, rows) => {

                        if (err) {

                            console.error(
                                "Cash Register Online Sales Error:",
                                err
                            );

                            return res.status(500).json({
                                success: false,
                                message: err.message
                            });
                        }

                        summary.onlineSales =
                            Number(
                                rows[0].onlineSales || 0
                            );

                        // ======================================================
                        // REFUNDS
                        // ======================================================

                        const refundsSql = `
                            SELECT
                                COALESCE(
                                    SUM(ir.refund_amount),
                                    0
                                ) AS refunds
                            FROM invoice_returns ir
                            INNER JOIN invoices i
                                ON ir.invoice_id = i.id
                            WHERE i.cashier_name = ?
                            AND DATE(ir.created_at) = CURDATE()
                        `;

                        storeDb.query(
                            refundsSql,
                            [cashierName],
                            (err, rows) => {

                                if (err) {

                                    console.error(
                                        "Cash Register Refund Error:",
                                        err
                                    );

                                    return res.status(500).json({
                                        success: false,
                                        message: err.message
                                    });
                                }

                                summary.refunds =
                                    Number(
                                        rows[0].refunds || 0
                                    );

                                // ======================================================
                                // SEND RESULT
                                // ======================================================

                                return res.json({

                                    success: true,

                                    cashierName,

                                    summary

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
// CASH REGISTER - CURRENT OPEN REGISTER
// ======================================================

app.get(
    "/api/cash-register/current",
    authenticateToken,
    (req, res) => {

        // ======================================================
        // STORE DATABASE
        // ======================================================

        const storeDb =
            req.storeDb;

        const cashierName =
            req.user.username;

        const sql = `
            SELECT
                id,
                cashier_name,
                opening_cash,
                opening_time,
                actual_cash,
                expected_cash,
                difference,
                owner_taken,
                closing_time,
                status
            FROM cash_registers
            WHERE cashier_name = ?
            AND status = 'OPEN'
            ORDER BY id DESC
            LIMIT 1
        `;

        storeDb.query(
            sql,
            [cashierName],
            (err, rows) => {

                if (err) {

                    console.error(
                        "Current Cash Register Error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                if (rows.length === 0) {

                    return res.json({
                        success: true,
                        registerOpen: false,
                        register: null
                    });

                }

                return res.json({
                    success: true,
                    registerOpen: true,
                    register: rows[0]
                });

            }
        );

    }
);


// ======================================================
// CASH REGISTER - HISTORY
// ONLY LOGGED-IN CASHIER
// ======================================================

app.get(
    "/api/cash-register/history",
    authenticateToken,
    (req, res) => {

        // ======================================================
        // STORE DATABASE
        // ======================================================

        const storeDb =
            req.storeDb;

        const cashierName =
            req.user.username;

        const sql = `
            SELECT
                id,
                cashier_name,
                opening_cash,
                opening_time,
                actual_cash,
                expected_cash,
                difference,
                owner_taken,
                closing_time,
                status
            FROM cash_registers
            WHERE cashier_name = ?
            ORDER BY id DESC
        `;

        storeDb.query(
            sql,
            [cashierName],
            (err, rows) => {

                if (err) {

                    console.error(
                        "Cash Register History Error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                return res.json({
                    success: true,
                    cashierName,
                    history: rows
                });

            }
        );

    }
);


// ======================================================
// OPEN CASH REGISTER
// ======================================================

app.post(
    "/api/cash-register/open",
    authenticateToken,
    (req, res) => {

        // ======================================================
        // STORE DATABASE
        // ======================================================

        const storeDb =
            req.storeDb;

        const {
            openingCash
        } = req.body;

        const amount =
            Number(openingCash);

        // ======================================================
        // VALIDATE OPENING CASH
        // ======================================================

        if (
            !Number.isFinite(amount) ||
            amount < 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid opening cash amount"
            });

        }

        // ======================================================
        // LOGGED-IN CASHIER
        // ======================================================

        const cashierName =
            req.user.username;

        // ======================================================
        // CHECK EXISTING OPEN REGISTER
        // ONLY THIS CASHIER
        // ======================================================

        const checkSql = `
            SELECT *
            FROM cash_registers
            WHERE cashier_name = ?
            AND status = 'OPEN'
            LIMIT 1
        `;

        storeDb.query(
            checkSql,
            [cashierName],
            (err, rows) => {

                if (err) {

                    console.error(
                        "Cash Register Check Error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                if (rows.length > 0) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "You already have an open cash register"
                    });

                }

                // ======================================================
                // CREATE REGISTER FOR THIS CASHIER
                // ======================================================

                const insertSql = `
                    INSERT INTO cash_registers
                    (
                        cashier_name,
                        opening_cash,
                        opening_time,
                        status
                    )
                    VALUES
                    (
                        ?,
                        ?,
                        NOW(),
                        'OPEN'
                    )
                `;

                storeDb.query(
                    insertSql,
                    [
                        cashierName,
                        amount
                    ],
                    (err, result) => {

                        if (err) {

                            console.error(
                                "Cash Register Open Error:",
                                err
                            );

                            return res.status(500).json({
                                success: false,
                                message: err.message
                            });

                        }

                        return res.json({
                            success: true,

                            message:
                                "Cash register opened successfully",

                            registerId:
                                result.insertId,

                            cashierName
                        });

                    }
                );

            }
        );

    }
);


// ======================================================
// CLOSE CASH REGISTER
// ======================================================

app.post(
    "/api/cash-register/close",
    authenticateToken,
    (req, res) => {

        // ======================================================
        // STORE DATABASE
        // ======================================================

        const storeDb =
            req.storeDb;

        const {
            actualCash,
            ownerTaken
        } = req.body;

        const amount =
            Number(actualCash);

        const ownerTakenAmount =
            Number(ownerTaken || 0);

        // ======================================================
        // VALIDATE ACTUAL CASH
        // ======================================================

        if (
            !Number.isFinite(amount) ||
            amount < 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid actual cash amount"
            });

        }

        // ======================================================
        // VALIDATE OWNER TAKEN
        // ======================================================

        if (
            !Number.isFinite(ownerTakenAmount) ||
            ownerTakenAmount < 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid owner taken amount"
            });

        }

        // ======================================================
        // OWNER CANNOT TAKE MORE THAN ACTUAL CASH
        // ======================================================

        if (
            ownerTakenAmount >
            amount
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Owner taken amount cannot be greater than actual cash"
            });

        }

        // ======================================================
        // LOGGED-IN CASHIER
        // ======================================================

        const cashierName =
            req.user.username;

        // ======================================================
        // FIND THIS CASHIER'S OPEN REGISTER
        // ======================================================

        const findSql = `
            SELECT
                id,
                opening_cash
            FROM cash_registers
            WHERE cashier_name = ?
            AND status = 'OPEN'
            ORDER BY id DESC
            LIMIT 1
        `;

        storeDb.query(
            findSql,
            [cashierName],
            (err, rows) => {

                if (err) {

                    console.error(
                        "Cash Register Find Error:",
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
                            "No open cash register found"
                    });

                }

                const register =
                    rows[0];

                const openingCash =
                    Number(
                        register.opening_cash || 0
                    );

                // ======================================================
                // CASH SALES
                // ONLY THIS CASHIER
                // ======================================================

                const cashSalesSql = `
                    SELECT
                        COALESCE(
                            SUM(total),
                            0
                        ) AS cashSales
                    FROM invoices
                    WHERE payment_Method = 'Cash'
                    AND cashier_name = ?
                    AND DATE(invoice_date) = CURDATE()
                `;

                storeDb.query(
                    cashSalesSql,
                    [cashierName],
                    (err, cashRows) => {

                        if (err) {

                            console.error(
                                "Cash Sales Error:",
                                err
                            );

                            return res.status(500).json({
                                success: false,
                                message: err.message
                            });

                        }

                        const cashSales =
                            Number(
                                cashRows[0].cashSales || 0
                            );

                        // ======================================================
                        // REFUNDS
                        // ======================================================

                        const refundsSql = `
                            SELECT
                                COALESCE(
                                    SUM(ir.refund_amount),
                                    0
                                ) AS refunds
                            FROM invoice_returns ir
                            INNER JOIN invoices i
                                ON ir.invoice_id = i.id
                            WHERE i.cashier_name = ?
                            AND DATE(ir.created_at) = CURDATE()
                        `;

                        storeDb.query(
                            refundsSql,
                            [cashierName],
                            (err, refundRows) => {

                                if (err) {

                                    console.error(
                                        "Refund Error:",
                                        err
                                    );

                                    return res.status(500).json({
                                        success: false,
                                        message: err.message
                                    });

                                }

                                // ======================================================
                                // FIXED: USE refundRows
                                // ======================================================

                                const refunds =
                                    Number(
                                        refundRows[0].refunds || 0
                                    );

                                // ======================================================
                                // EXPECTED CASH
                                // ======================================================

                                const expectedCash =
                                    openingCash +
                                    cashSales -
                                    refunds;

                                // ======================================================
                                // DIFFERENCE
                                // ======================================================

                                const difference =
                                    amount -
                                    expectedCash;

                                // ======================================================
                                // REMAINING CASH
                                // ======================================================

                                const remainingCash =
                                    amount -
                                    ownerTakenAmount;

                                // ======================================================
                                // UPDATE REGISTER
                                // ======================================================

                                const updateSql = `
                                    UPDATE cash_registers
                                    SET
                                        actual_cash = ?,
                                        expected_cash = ?,
                                        difference = ?,
                                        owner_taken = ?,
                                        closing_time = NOW(),
                                        status = 'CLOSED'
                                    WHERE id = ?
                                `;

                                storeDb.query(
                                    updateSql,
                                    [
                                        amount,
                                        expectedCash,
                                        difference,
                                        ownerTakenAmount,
                                        register.id
                                    ],
                                    (err) => {

                                        if (err) {

                                            console.error(
                                                "Cash Register Close Error:",
                                                err
                                            );

                                            return res.status(500).json({
                                                success: false,
                                                message: err.message
                                            });

                                        }

                                        // ======================================================
                                        // FINAL RESPONSE
                                        // ======================================================

                                        return res.json({
                                            success: true,

                                            message:
                                                "Cash register closed successfully",

                                            cashierName,

                                            expectedCash,

                                            actualCash:
                                                amount,

                                            difference,

                                            ownerTaken:
                                                ownerTakenAmount,

                                            remainingCash
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
// TEST MASTER DATABASE
// ======================================================

app.get(
    "/api/test-store",
    (req, res) => {

        const sql = `
            SELECT
                id,
                store_code,
                store_name,
                database_name
            FROM stores
            WHERE store_code = ?
        `;

        masterDb.query(
            sql,
            ["001"],
            (err, rows) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });

                }

                return res.json({
                    success: true,
                    store:
                        rows[0] || null
                });

            }
        );

    }
);


// ======================================================
// TEST DYNAMIC STORE DATABASE
// ======================================================

app.get(
    "/api/test-dynamic-db/:storeCode",
    (req, res) => {

        const {
            storeCode
        } = req.params;

        // ======================================================
        // STEP 1: FIND STORE
        // ======================================================

        const storeSql = `
            SELECT
                id,
                store_code,
                store_name,
                database_name
            FROM stores
            WHERE store_code = ?
        `;

        masterDb.query(
            storeSql,
            [storeCode],
            (err, stores) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        step: "master_db",
                        message: err.message
                    });

                }

                if (stores.length === 0) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Store not found"
                    });

                }

                const store =
                    stores[0];

                // ======================================================
                // STEP 2: CONNECT TO STORE DATABASE
                // ======================================================

                const storeDb =
                    getDatabase(
                        store.database_name
                    );

                // ======================================================
                // STEP 3: CHECK DATABASE
                // ======================================================

                storeDb.query(
                    "SELECT DATABASE() AS databaseName",
                    (err, rows) => {

                        if (err) {

                            return res.status(500).json({
                                success: false,
                                step:
                                    "store_database",
                                message:
                                    err.message
                            });

                        }

                        return res.json({

                            success: true,

                            store: {
                                id:
                                    store.id,

                                storeCode:
                                    store.store_code,

                                storeName:
                                    store.store_name,

                                databaseName:
                                    store.database_name
                            },

                            connectedDatabase:
                                rows[0].databaseName

                        });

                    }
                );

            }
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