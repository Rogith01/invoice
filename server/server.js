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

            // ==================================================
            // STORE DATABASE FROM JWT
            // ==================================================

            if (!user.databaseName) {

                return res.status(403).json({
                    success: false,
                    message: "Store database not found in token"
                });
            }

            // ==================================================
            // GET CORRECT STORE DATABASE
            // ==================================================

            const storeDb =
                getDatabase(user.databaseName);

            // ==================================================
            // ATTACH USER + DATABASE TO REQUEST
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

        const storeDb = req.storeDb;

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
            }
        );
    }
);


// ======================================================
// GET CUSTOMER BY PHONE
// ======================================================

app.get(
    "/api/customer/:phone",
    authenticateToken,
    (req, res) => {

        const phone =
            req.params.phone;

        const storeDb =
            req.storeDb;

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
                        "Customer By Phone Error:",
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

        const customerId =
            req.params.id;

        const storeDb =
            req.storeDb;

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

                                        // ======================================================
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
);


// ======================================================
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

        const sql = `
            INSERT INTO products
            (
                product_name,
                price,
                barcode
            )
            VALUES
            (
                ?,
                ?,
                ?
            )
        `;

        storeDb.query(
            sql,
            [
                productName,
                price,
                barcode
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
                barcode,
                id
            ],
            (err) => {

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

        const storeDb =
            req.storeDb;

        const productId =
            req.params.id;

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

        storeDb.query(
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

        const storeDb =
            req.storeDb;

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

        storeDb.query(
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
    (req, res) => {

        const storeDb =
            req.storeDb;

        const id =
            req.params.id;

        const sql = `
            DELETE FROM products
            WHERE id = ?
        `;

        storeDb.query(
            sql,
            [id],
            (err) => {

                if (err) {

                    console.error(
                        "Delete Product Error:",
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
                password,
                role
            FROM users
            ORDER BY id
        `;

        storeDb.query(
            sql,
            (err, rows) => {

                if (err) {

                    console.error(
                        "Users Error:",
                        err
                    );

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

        const storeDb =
            req.storeDb;

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

        storeDb.query(
            sql,
            [
                username,
                password,
                role
            ],
            (err) => {

                if (err) {

                    console.error(
                        "Add User Error:",
                        err
                    );

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
    }
);


// ======================================================
// UPDATE USER
// ======================================================

app.put(
    "/api/users/:id",
    authenticateToken,
    (req, res) => {

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

                    console.error(
                        "Update User Error:",
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
            (err) => {

                if (err) {

                    console.error(
                        "Delete User Error:",
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

        const storeDb =
            req.storeDb;

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
    }
);
// ======================================================
// DAILY SALES ANALYSIS
// ======================================================

app.get(
    "/api/dashboard/daily-sales",
    authenticateToken,
    (req, res) => {

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

        storeDb.query(sql, (err, rows) => {

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
// REPORTS
// ======================================================

app.get(
    "/api/reports",
    authenticateToken,
    (req, res) => {

        // ======================================================
        // CURRENT STORE DATABASE
        // ======================================================

        const storeDb = req.storeDb;

        const {
            fromDate,
            toDate
        } = req.query;

        // ======================================================
        // VALIDATE DATES
        // ======================================================

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

        // ======================================================
        // 1. SALES SUMMARY
        // ======================================================

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

                // ======================================================
                // 2. REFUND SUMMARY
                // ======================================================

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

                        // ======================================================
                        // 3. DAILY SALES
                        // ======================================================

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

                                report.dailySales = rows;

                                // ======================================================
                                // 4. TOP SELLING PRODUCTS
                                // ======================================================

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

                                        report.products = rows;

                                        // ======================================================
                                        // 5. CASHIER SALES
                                        // ======================================================

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

                                                report.cashiers = rows;

                                                // ======================================================
                                                // 6. TOTAL ITEMS SOLD
                                                // ======================================================

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

                                                        // ======================================================
                                                        // 7. NET SALES
                                                        // ======================================================

                                                        report.netSales =
                                                            Number(
                                                                report.summary.totalSales || 0
                                                            ) -
                                                            Number(
                                                                report.refunds.totalRefunds || 0
                                                            );

                                                        // ======================================================
                                                        // FINAL RESPONSE
                                                        // ======================================================

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
// ======================================================

app.get(
    "/api/invoices",
    authenticateToken,
    (req, res) => {

        // ======================================================
        // CURRENT STORE DATABASE
        // ======================================================

        const storeDb = req.storeDb;

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

        // ======================================================
        // CURRENT STORE DATABASE
        // ======================================================

        const storeDb = req.storeDb;

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

                if (invoiceRows.length === 0) {

                    return res.json({
                        success: false,
                        message: "Invoice not found"
                    });
                }

                // ======================================================
                // GET INVOICE ITEMS
                // ======================================================

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
// SERVER.JS
// MULTI-STORE SUPERMARKET POS BACKEND
// ======================================================

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const jwt = require("jsonwebtoken");




// ======================================================
// MIDDLEWARE
// ======================================================

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));


// ======================================================
// DATABASE CONFIGURATION
// ======================================================
//
// MASTER DATABASE
// Contains:
// stores
//
// STORE DATABASES
// Each supermarket has its own database.
//
// Example:
//
// master_db
// supermarket_001
// supermarket_002
// supermarket_003
//
// ======================================================

const DB_HOST = process.env.DB_HOST;
const DB_PORT = Number(process.env.DB_PORT || 4000);
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;


// ======================================================
// MASTER DATABASE
// ======================================================

const masterDb = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,

    database:
        process.env.MASTER_DB_NAME || "master_db",

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    ssl: {
        rejectUnauthorized: false,
    },
});


// ======================================================
// STORE DATABASE CONNECTION CACHE
// ======================================================

const storeConnections = new Map();


// ======================================================
// GET DYNAMIC STORE DATABASE
// ======================================================
//
// IMPORTANT:
// databaseName comes ONLY from stores.database_name
// after looking it up using storeCode.
//
// We never allow the frontend to directly choose
// an arbitrary database name.
//
// ======================================================

function getDatabase(databaseName) {

    if (!databaseName) {
        throw new Error("Store database name is missing");
    }

    if (storeConnections.has(databaseName)) {
        return storeConnections.get(databaseName);
    }

    const storeDb = mysql.createPool({
        host: DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD,

        database: databaseName,

        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,

        ssl: {
            rejectUnauthorized: false,
        },
    });

    storeConnections.set(
        databaseName,
        storeDb
    );

    console.log(
        `Store database connection created: ${databaseName}`
    );

    return storeDb;
}


// ======================================================
// AUTHENTICATE TOKEN
// ======================================================
//
// JWT contains:
// user
// role
// storeId
// storeCode
// storeName
// databaseName
//
// Every protected API automatically gets:
//
// req.storeDb
//
// ======================================================

function authenticateToken(req, res, next) {

    const authHeader =
        req.headers.authorization;

    if (!authHeader) {

        return res.status(401).json({
            success: false,
            message: "Authorization token required",
        });
    }

    const parts =
        authHeader.split(" ");

    if (
        parts.length !== 2 ||
        parts[0] !== "Bearer"
    ) {

        return res.status(401).json({
            success: false,
            message: "Invalid authorization format",
        });
    }

    const token = parts[1];

    jwt.verify(
        token,
        process.env.JWT_SECRET,
        (err, decoded) => {

            if (err) {

                return res.status(403).json({
                    success: false,
                    message: "Invalid or expired token",
                });
            }

            try {

                req.user = decoded;

                // ==========================================
                // DYNAMIC STORE DATABASE
                // ==========================================

                req.storeDb =
                    getDatabase(
                        decoded.databaseName
                    );

                next();

            } catch (error) {

                console.error(
                    "Dynamic DB Error:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Unable to connect to store database",
                });
            }
        }
    );
}


// ======================================================
// ADMIN CHECK
// ======================================================

function adminOnly(req, res, next) {

    if (
        req.user.role !== "Admin"
    ) {

        return res.status(403).json({
            success: false,
            message:
                "Admin access required",
        });
    }

    next();
}


// ======================================================
// LOCAL DATE
// ======================================================
//
// India timezone
//
// ======================================================

function todaySql() {

    return `
        DATE(
            CONVERT_TZ(
                NOW(),
                '+00:00',
                '+05:30'
            )
        )
    `;
}


// ======================================================
// TEST SERVER
// ======================================================

app.get("/", (req, res) => {

    res.send(
        "Invoice Backend is Running..."
    );
});


// ======================================================
// LOGIN
// ======================================================
//
// MASTER DB:
// Find store
//
// STORE DB:
// Find user
//
// ======================================================

app.post(
    "/api/login",
    (req, res) => {

        const {
            storeCode,
            username,
            password,
        } = req.body;

        if (
            !storeCode ||
            !username ||
            !password
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Store Code, Username and Password are required",
            });
        }

        // ==============================================
        // FIND STORE IN MASTER DB
        // ==============================================

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
            [storeCode.trim()],
            (err, stores) => {

                if (err) {

                    console.error(
                        "Master DB Login Error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message: err.message,
                    });
                }

                if (
                    stores.length === 0
                ) {

                    return res.status(401).json({
                        success: false,
                        message:
                            "Invalid Store Code",
                    });
                }

                const store =
                    stores[0];

                // ======================================
                // CONNECT TO THAT STORE DATABASE
                // ======================================

                let storeDb;

                try {

                    storeDb =
                        getDatabase(
                            store.database_name
                        );

                } catch (error) {

                    return res.status(500).json({
                        success: false,
                        message:
                            "Store database connection failed",
                    });
                }

                // ======================================
                // FIND USER
                // ======================================

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
                        username.trim(),
                        password,
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
                                    err.message,
                            });
                        }

                        if (
                            rows.length === 0
                        ) {

                            return res.status(401).json({
                                success: false,
                                message:
                                    "Invalid Username or Password",
                            });
                        }

                        const user =
                            rows[0];

                        // ==================================
                        // JWT
                        // ==================================

                        const token =
                            jwt.sign(
                                {
                                    id: user.id,

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
                                        store.database_name,
                                },

                                process.env.JWT_SECRET,

                                {
                                    expiresIn:
                                        "8h",
                                }
                            );

                        return res.json({

                            success: true,

                            token,

                            store: {
                                id:
                                    store.id,

                                storeCode:
                                    store.store_code,

                                storeName:
                                    store.store_name,
                            },

                            user,

                        });
                    }
                );
            }
        );
    }
);


// ======================================================
// CURRENT USER / STORE
// ======================================================

app.get(
    "/api/me",
    authenticateToken,
    (req, res) => {

        res.json({
            success: true,

            store: {
                id:
                    req.user.storeId,

                storeCode:
                    req.user.storeCode,

                storeName:
                    req.user.storeName,

                databaseName:
                    req.user.databaseName,
            },

            user: {
                id:
                    req.user.id,

                username:
                    req.user.username,

                role:
                    req.user.role,
            },
        });
    }
);


// ======================================================
// NEXT INVOICE NUMBER
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

                    return res.status(500).json({
                        success: false,
                        message: err.message,
                    });
                }

                let nextNumber = 1;

                if (
                    rows.length > 0 &&
                    rows[0].invoice_number
                ) {

                    const number =
                        parseInt(
                            String(
                                rows[0]
                                    .invoice_number
                            ).replace(
                                "INV-",
                                ""
                            )
                        );

                    if (
                        Number.isFinite(number)
                    ) {
                        nextNumber =
                            number + 1;
                    }
                }

                const invoiceNumber =
                    "INV-" +
                    String(nextNumber)
                        .padStart(4, "0");

                res.json({
                    success: true,
                    invoiceNumber,
                });
            }
        );
    }
);


// ======================================================
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
            SELECT
                id,
                customer_name,
                phone_number,
                loyalty_points
            FROM customers
            WHERE phone_number = ?
            LIMIT 1
        `;

        storeDb.query(
            sql,
            [phone],
            (err, rows) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message: err.message,
                    });
                }

                if (
                    rows.length === 0
                ) {

                    return res.json({
                        success: true,
                        customer: null,
                    });
                }

                res.json({
                    success: true,
                    customer: rows[0],
                });
            }
        );
    }
);


// ======================================================
// SAVE INVOICE / NEW SALE
// ======================================================

app.post(
    "/api/invoices",
    authenticateToken,
    (req, res) => {

        const storeDb =
            req.storeDb;

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
            paymentMethod,
        } = req.body;

        // ==============================================
        // VALID ITEMS
        // ==============================================

        const validItems =
            (items || []).filter(
                item =>
                    item &&
                    item.name &&
                    item.name.trim() !== ""
            );

        if (
            validItems.length === 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "No products added to invoice",
            });
        }

        // ==============================================
        // USE LOGGED-IN CASHIER
        // ==============================================

        const actualCashier =
            req.user.username;

        // ==============================================
        // CHECK STOCK
        // ==============================================

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

                const quantity =
                    Number(item.qty);

                if (
                    !Number.isInteger(quantity) ||
                    quantity <= 0
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            `Invalid quantity for ${item.name}`,
                    });
                }

                const stockSql = `
                    SELECT
                        id,
                        product_name,
                        stock_quantity,
                        price
                    FROM products
                    WHERE product_name = ?
                    LIMIT 1
                `;

                storeDb.query(
                    stockSql,
                    [item.name.trim()],
                    (err, rows) => {

                        if (err) {

                            return res.status(500).json({
                                success: false,
                                message:
                                    err.message,
                            });
                        }

                        if (
                            rows.length === 0
                        ) {

                            return res.status(400).json({
                                success: false,
                                message:
                                    `${item.name} not found in products`,
                            });
                        }

                        const product =
                            rows[0];

                        const stock =
                            Number(
                                product.stock_quantity
                            ) || 0;

                        if (
                            quantity > stock
                        ) {

                            return res.status(400).json({
                                success: false,
                                message:
                                    `Insufficient stock for ${item.name}. Available: ${stock}, Requested: ${quantity}`,
                            });
                        }

                        checkStock(
                            index + 1
                        );
                    }
                );
            };


        // ==============================================
        // CUSTOMER
        // ==============================================

        const checkCustomer =
            () => {

                if (!phoneNumber) {

                    saveInvoice(
                        null,
                        0
                    );

                    return;
                }

                const sql = `
                    SELECT
                        id,
                        loyalty_points
                    FROM customers
                    WHERE phone_number = ?
                    LIMIT 1
                `;

                storeDb.query(
                    sql,
                    [phoneNumber],
                    (err, rows) => {

                        if (err) {

                            return res.status(500).json({
                                success: false,
                                message:
                                    err.message,
                            });
                        }

                        if (
                            rows.length > 0
                        ) {

                            saveInvoice(
                                rows[0].id,
                                Number(
                                    rows[0]
                                        .loyalty_points
                                ) || 0
                            );

                            return;
                        }

                        const insertSql = `
                            INSERT INTO customers
                            (
                                customer_name,
                                phone_number,
                                loyalty_points
                            )
                            VALUES
                            (?, ?, 0)
                        `;

                        storeDb.query(
                            insertSql,
                            [
                                customerName ||
                                    "Walk-in Customer",
                                phoneNumber,
                            ],
                            (err, result) => {

                                if (err) {

                                    return res.status(500).json({
                                        success: false,
                                        message:
                                            err.message,
                                    });
                                }

                                saveInvoice(
                                    result.insertId,
                                    0
                                );
                            }
                        );
                    }
                );
            };


        // ==============================================
        // SAVE INVOICE
        // ==============================================

        function saveInvoice(
            customerId,
            loyaltyPoints
        ) {

            const redeemedPoints =
                redeemPoints
                    ? loyaltyPoints
                    : 0;

            const earnedPoints =
                Math.floor(
                    Number(total) / 100
                );

            const invoiceNumberSql = `
                SELECT invoice_number
                FROM invoices
                ORDER BY id DESC
                LIMIT 1
            `;

            storeDb.query(
                invoiceNumberSql,
                (err, rows) => {

                    if (err) {

                        return res.status(500).json({
                            success: false,
                            message:
                                err.message,
                        });
                    }

                    let invoiceNumber =
                        "INV-0001";

                    if (
                        rows.length > 0
                    ) {

                        const last =
                            String(
                                rows[0]
                                    .invoice_number
                            );

                        const number =
                            parseInt(
                                last.replace(
                                    "INV-",
                                    ""
                                )
                            );

                        if (
                            Number.isFinite(number)
                        ) {

                            invoiceNumber =
                                "INV-" +
                                String(
                                    number + 1
                                ).padStart(
                                    4,
                                    "0"
                                );
                        }
                    }

                    // ==================================
                    // INSERT INVOICE
                    // ==================================

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
                            ${todaySql()},
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

                            actualCashier,

                            customerName ||
                                "Walk-in Customer",

                            Number(subtotal) || 0,

                            Number(
                                discountRate
                            ) || 0,

                            redeemedPoints,

                            Number(taxRate) || 0,

                            Number(total) || 0,

                            paymentMethod ||
                                "Cash",
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
                                        err.message,
                                });
                            }

                            const invoiceId =
                                result.insertId;

                            let completed =
                                0;

                            let failed =
                                false;


                            // ==================================
                            // ITEMS
                            // ==================================

                            validItems.forEach(
                                item => {

                                    const quantity =
                                        Number(
                                            item.qty
                                        );

                                    const price =
                                        Number(
                                            item.price
                                        ) || 0;

                                    const amount =
                                        quantity *
                                        price;

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
                                        (?, ?, ?, ?, ?)
                                    `;

                                    storeDb.query(
                                        itemSql,
                                        [
                                            invoiceId,
                                            item.name.trim(),
                                            quantity,
                                            price,
                                            amount,
                                        ],
                                        (err) => {

                                            if (err) {

                                                if (
                                                    failed
                                                ) return;

                                                failed =
                                                    true;

                                                return res.status(500).json({
                                                    success: false,
                                                    message:
                                                        err.message,
                                                });
                                            }


                                            // ==============================
                                            // STOCK BEFORE UPDATE
                                            // ==============================

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
                                                [
                                                    item.name.trim(),
                                                ],
                                                (err, productRows) => {

                                                    if (err) {

                                                        if (
                                                            failed
                                                        ) return;

                                                        failed =
                                                            true;

                                                        return res.status(500).json({
                                                            success: false,
                                                            message:
                                                                err.message,
                                                        });
                                                    }

                                                    const product =
                                                        productRows[0];

                                                    const stockBefore =
                                                        Number(
                                                            product.stock_quantity
                                                        ) || 0;

                                                    const stockAfter =
                                                        stockBefore -
                                                        quantity;


                                                    // ==========================
                                                    // UPDATE STOCK
                                                    // ==========================

                                                    const updateStockSql = `
                                                        UPDATE products
                                                        SET stock_quantity = ?
                                                        WHERE id = ?
                                                    `;

                                                    storeDb.query(
                                                        updateStockSql,
                                                        [
                                                            stockAfter,
                                                            product.id,
                                                        ],
                                                        (err) => {

                                                            if (err) {

                                                                if (
                                                                    failed
                                                                ) return;

                                                                failed =
                                                                    true;

                                                                return res.status(500).json({
                                                                    success: false,
                                                                    message:
                                                                        err.message,
                                                                });
                                                            }


                                                            // ======================
                                                            // STOCK MOVEMENT
                                                            // ======================

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

                                                            storeDb.query(
                                                                movementSql,
                                                                [
                                                                    product.id,
                                                                    product.product_name,
                                                                    quantity,
                                                                    stockBefore,
                                                                    stockAfter,
                                                                    invoiceId,
                                                                    actualCashier,
                                                                ],
                                                                (err) => {

                                                                    if (err) {

                                                                        if (
                                                                            failed
                                                                        ) return;

                                                                        failed =
                                                                            true;

                                                                        return res.status(500).json({
                                                                            success: false,
                                                                            message:
                                                                                err.message,
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


                            // ==================================
                            // LOYALTY POINTS
                            // ==================================

                            const updateLoyaltyPoints =
                                () => {

                                    if (
                                        !customerId
                                    ) {

                                        return res.json({
                                            success: true,
                                            message:
                                                "Invoice Saved Successfully",
                                            invoiceNumber,
                                            earnedPoints,
                                            redeemedPoints,
                                            finalPoints:
                                                earnedPoints,
                                        });
                                    }

                                    const finalPoints =
                                        Math.max(
                                            0,
                                            loyaltyPoints -
                                                redeemedPoints +
                                                earnedPoints
                                        );

                                    const sql = `
                                        UPDATE customers
                                        SET loyalty_points = ?
                                        WHERE id = ?
                                    `;

                                    storeDb.query(
                                        sql,
                                        [
                                            finalPoints,
                                            customerId,
                                        ],
                                        (err) => {

                                            if (err) {

                                                return res.status(500).json({
                                                    success: false,
                                                    message:
                                                        err.message,
                                                });
                                            }

                                            return res.json({
                                                success: true,

                                                message:
                                                    "Invoice Saved Successfully",

                                                invoiceId,

                                                invoiceNumber,

                                                earnedPoints,

                                                redeemedPoints,

                                                finalPoints,
                                            });
                                        }
                                    );
                                };
                        }
                    );
                }
            );
        }

        checkStock();
    }
);


// ======================================================
// GET ALL INVOICES / INVOICE HISTORY
// ======================================================

app.get(
    "/api/invoices",
    authenticateToken,
    (req, res) => {

        const storeDb =
            req.storeDb;

        const sql = `
            SELECT
                i.*,
                c.phone_number
            FROM invoices i
            LEFT JOIN customers c
                ON i.customer_id = c.id
            ORDER BY i.id DESC
        `;

        storeDb.query(
            sql,
            (err, rows) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            err.message,
                    });
                }

                res.json({
                    success: true,
                    invoices: rows,
                });
            }
        );
    }
);


// ======================================================
// INVOICE HISTORY ALIAS
// ======================================================

app.get(
    "/api/invoice-history",
    authenticateToken,
    (req, res) => {

        const storeDb =
            req.storeDb;

        const sql = `
            SELECT
                i.*,
                c.phone_number
            FROM invoices i
            LEFT JOIN customers c
                ON i.customer_id = c.id
            ORDER BY i.id DESC
        `;

        storeDb.query(
            sql,
            (err, rows) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            err.message,
                    });
                }

                res.json({
                    success: true,
                    invoices: rows,
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

        const storeDb =
            req.storeDb;

        const invoiceId =
            req.params.id;

        storeDb.query(
            `
            SELECT
                i.*,
                c.phone_number
            FROM invoices i
            LEFT JOIN customers c
                ON i.customer_id = c.id
            WHERE i.id = ?
            `,
            [invoiceId],
            (err, invoiceRows) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            err.message,
                    });
                }

                if (
                    invoiceRows.length === 0
                ) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Invoice not found",
                    });
                }

                storeDb.query(
                    `
                    SELECT *
                    FROM invoice_items
                    WHERE invoice_id = ?
                    ORDER BY id ASC
                    `,
                    [invoiceId],
                    (err, itemRows) => {

                        if (err) {

                            return res.status(500).json({
                                success: false,
                                message:
                                    err.message,
                            });
                        }

                        res.json({
                            success: true,
                            invoice:
                                invoiceRows[0],
                            items:
                                itemRows,
                        });
                    }
                );
            }
        );
    }
);


// ======================================================
// DELETE INVOICE
// ADMIN ONLY
// ======================================================

app.delete(
    "/api/invoices/:id",
    authenticateToken,
    adminOnly,
    (req, res) => {

        const storeDb =
            req.storeDb;

        const invoiceId =
            req.params.id;

        storeDb.query(
            `
            DELETE FROM invoice_items
            WHERE invoice_id = ?
            `,
            [invoiceId],
            (err) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            err.message,
                    });
                }

                storeDb.query(
                    `
                    DELETE FROM invoices
                    WHERE id = ?
                    `,
                    [invoiceId],
                    (err, result) => {

                        if (err) {

                            return res.status(500).json({
                                success: false,
                                message:
                                    err.message,
                            });
                        }

                        if (
                            result.affectedRows === 0
                        ) {

                            return res.status(404).json({
                                success: false,
                                message:
                                    "Invoice not found",
                            });
                        }

                        res.json({
                            success: true,
                            message:
                                "Invoice deleted successfully",
                        });
                    }
                );
            }
        );
    }
);


// ======================================================
// REFUND / RETURN HISTORY
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
                        message:
                            err.message,
                    });
                }

                res.json({
                    success: true,
                    refunds: rows,
                });
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

        const storeDb =
            req.storeDb;

        const invoiceId =
            req.params.invoiceId;

        const {
            productName,
            returnQty,
            reason,
        } = req.body;

        if (
            !productName ||
            !productName.trim()
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Product name is required",
            });
        }

        const quantity =
            Number(returnQty);

        if (
            !Number.isInteger(quantity) ||
            quantity <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Return quantity must be a positive whole number",
            });
        }

        // ==============================================
        // GET INVOICE ITEM
        // ==============================================

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
            LIMIT 1
        `;

        storeDb.query(
            invoiceItemSql,
            [
                invoiceId,
                productName.trim(),
            ],
            (err, rows) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            err.message,
                    });
                }

                if (
                    rows.length === 0
                ) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Product was not found in this invoice",
                    });
                }

                const invoiceItem =
                    rows[0];

                const originalQty =
                    Number(
                        invoiceItem.qty
                    );

                // ==========================================
                // PREVIOUS RETURNS
                // ==========================================

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
                        productName.trim(),
                    ],
                    (err, returnedRows) => {

                        if (err) {

                            return res.status(500).json({
                                success: false,
                                message:
                                    err.message,
                            });
                        }

                        const alreadyReturned =
                            Number(
                                returnedRows[0]
                                    .returned_qty
                            ) || 0;

                        const remainingQty =
                            originalQty -
                            alreadyReturned;

                        if (
                            quantity >
                            remainingQty
                        ) {

                            return res.status(400).json({
                                success: false,
                                message:
                                    `Cannot return ${quantity}. Only ${remainingQty} item(s) remaining for return.`,
                            });
                        }

                        // ==================================
                        // REFUND
                        // ==================================

                        const price =
                            Number(
                                invoiceItem.price
                            ) || 0;

                        const refundAmount =
                            quantity *
                            price;

                        // ==================================
                        // PRODUCT
                        // ==================================

                        const productSql = `
                            SELECT
                                id,
                                product_name,
                                stock_quantity
                            FROM products
                            WHERE product_name = ?
                            LIMIT 1
                        `;

                        storeDb.query(
                            productSql,
                            [
                                productName.trim(),
                            ],
                            (err, productRows) => {

                                if (err) {

                                    return res.status(500).json({
                                        success: false,
                                        message:
                                            err.message,
                                    });
                                }

                                if (
                                    productRows.length === 0
                                ) {

                                    return res.status(404).json({
                                        success: false,
                                        message:
                                            "Product not found in products table",
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

                                // ==============================
                                // UPDATE STOCK
                                // ==============================

                                storeDb.query(
                                    `
                                    UPDATE products
                                    SET stock_quantity = ?
                                    WHERE id = ?
                                    `,
                                    [
                                        stockAfter,
                                        product.id,
                                    ],
                                    (err) => {

                                        if (err) {

                                            return res.status(500).json({
                                                success: false,
                                                message:
                                                    err.message,
                                            });
                                        }

                                        // ==========================
                                        // RETURN RECORD
                                        // ==========================

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
                                            (?, ?, ?, ?, ?, ?, ?, ?, ?)
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

                                                req.user.username,
                                            ],
                                            (err) => {

                                                if (err) {

                                                    return res.status(500).json({
                                                        success: false,
                                                        message:
                                                            err.message,
                                                    });
                                                }

                                                // ======================
                                                // STOCK MOVEMENT
                                                // ======================

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
                                                    (?, ?, 'STOCK_IN', ?, ?, ?, 'RETURN', ?, ?)
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

                                                        req.user.username,
                                                    ],
                                                    (err) => {

                                                        if (err) {

                                                            return res.status(500).json({
                                                                success: false,
                                                                message:
                                                                    err.message,
                                                            });
                                                        }

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
                                                                req.user.username,
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
// PRODUCTS
// ======================================================

// GET PRODUCTS

app.get(
    "/api/products",
    authenticateToken,
    (req, res) => {

        const storeDb =
            req.storeDb;

        storeDb.query(
            `
            SELECT *
            FROM products
            ORDER BY id DESC
            `,
            (err, rows) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            err.message,
                    });
                }

                res.json({
                    success: true,
                    products: rows,
                });
            }
        );
    }
);


// ======================================================
// GET SINGLE PRODUCT
// ======================================================

app.get(
    "/api/products/:id",
    authenticateToken,
    (req, res) => {

        const storeDb =
            req.storeDb;

        storeDb.query(
            `
            SELECT *
            FROM products
            WHERE id = ?
            `,
            [req.params.id],
            (err, rows) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            err.message,
                    });
                }

                if (
                    rows.length === 0
                ) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Product not found",
                    });
                }

                res.json({
                    success: true,
                    product: rows[0],
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
    adminOnly,
    (req, res) => {

        const storeDb =
            req.storeDb;

        const {
            productName,
            barcode,
            price,
            stockQuantity,
            category,
        } = req.body;

        if (
            !productName ||
            !productName.trim()
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Product name is required",
            });
        }

        const sql = `
            INSERT INTO products
            (
                product_name,
                barcode,
                price,
                stock_quantity,
                category
            )
            VALUES
            (?, ?, ?, ?, ?)
        `;

        storeDb.query(
            sql,
            [
                productName.trim(),

                barcode ||
                    null,

                Number(price) || 0,

                Number(stockQuantity) || 0,

                category ||
                    null,
            ],
            (err, result) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            err.message,
                    });
                }

                res.json({
                    success: true,
                    message:
                        "Product added successfully",
                    productId:
                        result.insertId,
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
    adminOnly,
    (req, res) => {

        const storeDb =
            req.storeDb;

        const {
            productName,
            barcode,
            price,
            stockQuantity,
            category,
        } = req.body;

        const sql = `
            UPDATE products
            SET
                product_name = ?,
                barcode = ?,
                price = ?,
                stock_quantity = ?,
                category = ?
            WHERE id = ?
        `;

        storeDb.query(
            sql,
            [
                productName,
                barcode ||
                    null,
                Number(price) || 0,
                Number(stockQuantity) || 0,
                category ||
                    null,
                req.params.id,
            ],
            (err, result) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            err.message,
                    });
                }

                res.json({
                    success: true,
                    message:
                        "Product updated successfully",
                    affectedRows:
                        result.affectedRows,
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
    adminOnly,
    (req, res) => {

        const storeDb =
            req.storeDb;

        storeDb.query(
            `
            DELETE FROM products
            WHERE id = ?
            `,
            [req.params.id],
            (err, result) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            err.message,
                    });
                }

                res.json({
                    success: true,
                    message:
                        "Product deleted successfully",
                    affectedRows:
                        result.affectedRows,
                });
            }
        );
    }
);


// ======================================================
// INVENTORY
// ======================================================

app.get(
    "/api/inventory",
    authenticateToken,
    (req, res) => {

        const storeDb =
            req.storeDb;

        const sql = `
            SELECT
                *
            FROM products
            ORDER BY product_name ASC
        `;

        storeDb.query(
            sql,
            (err, rows) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            err.message,
                    });
                }

                res.json({
                    success: true,
                    inventory: rows,
                });
            }
        );
    }
);


// ======================================================
// STOCK MOVEMENTS
// ======================================================

app.get(
    "/api/stock-movements",
    authenticateToken,
    (req, res) => {

        const storeDb =
            req.storeDb;

        const sql = `
            SELECT *
            FROM stock_movements
            ORDER BY id DESC
        `;

        storeDb.query(
            sql,
            (err, rows) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            err.message,
                    });
                }

                res.json({
                    success: true,
                    movements: rows,
                });
            }
        );
    }
);


// ======================================================
// PRODUCT MOVEMENTS ALIAS
// ======================================================

app.get(
    "/api/product-movements",
    authenticateToken,
    (req, res) => {

        const storeDb =
            req.storeDb;

        storeDb.query(
            `
            SELECT *
            FROM stock_movements
            ORDER BY id DESC
            `,
            (err, rows) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            err.message,
                    });
                }

                res.json({
                    success: true,
                    movements: rows,
                });
            }
        );
    }
);


// ======================================================
// RESTOCK PRODUCT
// ======================================================

app.post(
    "/api/products/:id/restock",
    authenticateToken,
    (req, res) => {

        const storeDb =
            req.storeDb;

        const quantity =
            Number(
                req.body.quantity
            );

        if (
            !Number.isInteger(quantity) ||
            quantity <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid restock quantity",
            });
        }

        storeDb.query(
            `
            SELECT
                id,
                product_name,
                stock_quantity
            FROM products
            WHERE id = ?
            `,
            [req.params.id],
            (err, rows) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            err.message,
                    });
                }

                if (
                    rows.length === 0
                ) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Product not found",
                    });
                }

                const product =
                    rows[0];

                const before =
                    Number(
                        product.stock_quantity
                    ) || 0;

                const after =
                    before +
                    quantity;

                storeDb.query(
                    `
                    UPDATE products
                    SET stock_quantity = ?
                    WHERE id = ?
                    `,
                    [
                        after,
                        product.id,
                    ],
                    (err) => {

                        if (err) {

                            return res.status(500).json({
                                success: false,
                                message:
                                    err.message,
                            });
                        }

                        storeDb.query(
                            `
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
                            `,
                            [
                                product.id,
                                product.product_name,
                                quantity,
                                before,
                                after,
                                req.user.username,
                            ],
                            (err) => {

                                if (err) {

                                    return res.status(500).json({
                                        success: false,
                                        message:
                                            err.message,
                                    });
                                }

                                res.json({
                                    success: true,

                                    message:
                                        "Product restocked successfully",

                                    stockBefore:
                                        before,

                                    stockAfter:
                                        after,
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
// CUSTOMERS
// ======================================================

app.get(
    "/api/customers",
    authenticateToken,
    (req, res) => {

        const storeDb =
            req.storeDb;

        storeDb.query(
            `
            SELECT *
            FROM customers
            ORDER BY id DESC
            `,
            (err, rows) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            err.message,
                    });
                }

                res.json({
                    success: true,
                    customers: rows,
                });
            }
        );
    }
);


// ======================================================
// ADD CUSTOMER
// ======================================================

app.post(
    "/api/customers",
    authenticateToken,
    (req, res) => {

        const storeDb =
            req.storeDb;

        const {
            customerName,
            phoneNumber,
        } = req.body;

        if (
            !customerName ||
            !phoneNumber
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Customer name and phone number are required",
            });
        }

        storeDb.query(
            `
            INSERT INTO customers
            (
                customer_name,
                phone_number,
                loyalty_points
            )
            VALUES
            (?, ?, 0)
            `,
            [
                customerName,
                phoneNumber,
            ],
            (err, result) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            err.message,
                    });
                }

                res.json({
                    success: true,
                    customerId:
                        result.insertId,
                });
            }
        );
    }
);


// ======================================================
// UPDATE CUSTOMER
// ======================================================

app.put(
    "/api/customers/:id",
    authenticateToken,
    (req, res) => {

        const storeDb =
            req.storeDb;

        const {
            customerName,
            phoneNumber,
        } = req.body;

        storeDb.query(
            `
            UPDATE customers
            SET
                customer_name = ?,
                phone_number = ?
            WHERE id = ?
            `,
            [
                customerName,
                phoneNumber,
                req.params.id,
            ],
            (err) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            err.message,
                    });
                }

                res.json({
                    success: true,
                    message:
                        "Customer updated successfully",
                });
            }
        );
    }
);


// ======================================================
// USERS
// ======================================================
//
// USERS BELONG TO STORE DB
//
// ======================================================

app.get(
    "/api/users",
    authenticateToken,
    adminOnly,
    (req, res) => {

        const storeDb =
            req.storeDb;

        storeDb.query(
            `
            SELECT
                id,
                username,
                role
            FROM users
            ORDER BY id DESC
            `,
            (err, rows) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            err.message,
                    });
                }

                res.json({
                    success: true,
                    users: rows,
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
    adminOnly,
    (req, res) => {

        const storeDb =
            req.storeDb;

        const {
            username,
            password,
            role,
        } = req.body;

        if (
            !username ||
            !password ||
            !role
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Username, password and role are required",
            });
        }

        storeDb.query(
            `
            INSERT INTO users
            (
                username,
                password,
                role
            )
            VALUES
            (?, ?, ?)
            `,
            [
                username,
                password,
                role,
            ],
            (err, result) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            err.message,
                    });
                }

                res.json({
                    success: true,
                    message:
                        "User created successfully",
                    userId:
                        result.insertId,
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
    adminOnly,
    (req, res) => {

        const storeDb =
            req.storeDb;

        const {
            username,
            password,
            role,
        } = req.body;

        let sql;
        let params;

        if (password) {

            sql = `
                UPDATE users
                SET
                    username = ?,
                    password = ?,
                    role = ?
                WHERE id = ?
            `;

            params = [
                username,
                password,
                role,
                req.params.id,
            ];

        } else {

            sql = `
                UPDATE users
                SET
                    username = ?,
                    role = ?
                WHERE id = ?
            `;

            params = [
                username,
                role,
                req.params.id,
            ];
        }

        storeDb.query(
            sql,
            params,
            (err) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            err.message,
                    });
                }

                res.json({
                    success: true,
                    message:
                        "User updated successfully",
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
    adminOnly,
    (req, res) => {

        const storeDb =
            req.storeDb;

        if (
            String(req.user.id) ===
            String(req.params.id)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "You cannot delete your own account",
            });
        }

        storeDb.query(
            `
            DELETE FROM users
            WHERE id = ?
            `,
            [req.params.id],
            (err) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            err.message,
                    });
                }

                res.json({
                    success: true,
                    message:
                        "User deleted successfully",
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

        const storeDb =
            req.storeDb;

        const today =
            todaySql();

        const dashboard = {};

        // ==============================================
        // TODAY SALES
        // ==============================================

        storeDb.query(
            `
            SELECT
                COALESCE(
                    SUM(total),
                    0
                ) AS todaySales,

                COUNT(*) AS todayOrders
            FROM invoices
            WHERE invoice_date = ${today}
            `,
            (err, rows) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            err.message,
                    });
                }

                dashboard.todaySales =
                    Number(
                        rows[0].todaySales
                    ) || 0;

                dashboard.todayOrders =
                    Number(
                        rows[0].todayOrders
                    ) || 0;


                // ======================================
                // CASH SALES
                // ======================================

                storeDb.query(
                    `
                    SELECT
                        COALESCE(
                            SUM(total),
                            0
                        ) AS cashSales
                    FROM invoices
                    WHERE payment_Method = 'Cash'
                    AND invoice_date = ${today}
                    `,
                    (err, rows) => {

                        if (err) {

                            return res.status(500).json({
                                success: false,
                                message:
                                    err.message,
                            });
                        }

                        dashboard.cashSales =
                            Number(
                                rows[0].cashSales
                            ) || 0;


                        // ==============================
                        // ONLINE SALES
                        // ==============================

                        storeDb.query(
                            `
                            SELECT
                                COALESCE(
                                    SUM(total),
                                    0
                                ) AS onlineSales
                            FROM invoices
                            WHERE payment_Method = 'Online'
                            AND invoice_date = ${today}
                            `,
                            (err, rows) => {

                                if (err) {

                                    return res.status(500).json({
                                        success: false,
                                        message:
                                            err.message,
                                    });
                                }

                                dashboard.onlineSales =
                                    Number(
                                        rows[0]
                                            .onlineSales
                                    ) || 0;


                                // ==========================
                                // PRODUCTS
                                // ==========================

                                storeDb.query(
                                    `
                                    SELECT
                                        COUNT(*) AS totalProducts,
                                        COALESCE(
                                            SUM(stock_quantity),
                                            0
                                        ) AS totalStock
                                    FROM products
                                    `,
                                    (err, rows) => {

                                        if (err) {

                                            return res.status(500).json({
                                                success: false,
                                                message:
                                                    err.message,
                                            });
                                        }

                                        dashboard.totalProducts =
                                            Number(
                                                rows[0]
                                                    .totalProducts
                                            ) || 0;

                                        dashboard.totalStock =
                                            Number(
                                                rows[0]
                                                    .totalStock
                                            ) || 0;


                                        res.json({
                                            success: true,
                                            dashboard,
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
// REPORTS
// ======================================================

app.get(
    "/api/reports",
    authenticateToken,
    (req, res) => {

        const storeDb =
            req.storeDb;

        const {
            fromDate,
            toDate,
        } = req.query;

        let where = "";

        const params = [];

        if (
            fromDate &&
            toDate
        ) {

            where = `
                WHERE invoice_date
                BETWEEN ? AND ?
            `;

            params.push(
                fromDate,
                toDate
            );

        } else {

            where = `
                WHERE invoice_date =
                ${todaySql()}
            `;
        }

        const sql = `
            SELECT
                COALESCE(
                    SUM(total),
                    0
                ) AS totalSales,

                COUNT(*) AS totalOrders,

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
            ${where}
        `;

        storeDb.query(
            sql,
            params,
            (err, summaryRows) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            err.message,
                    });
                }

                const dailySql = `
                    SELECT
                        invoice_date AS saleDate,

                        COALESCE(
                            SUM(total),
                            0
                        ) AS sales,

                        COUNT(*) AS orders

                    FROM invoices
                    ${where}

                    GROUP BY invoice_date

                    ORDER BY invoice_date DESC
                `;

                storeDb.query(
                    dailySql,
                    params,
                    (err, dailyRows) => {

                        if (err) {

                            return res.status(500).json({
                                success: false,
                                message:
                                    err.message,
                            });
                        }

                        res.json({
                            success: true,

                            summary:
                                summaryRows[0],

                            dailySales:
                                dailyRows,
                        });
                    }
                );
            }
        );
    }
);


// ======================================================
// CASH REGISTER - TODAY SUMMARY
// ======================================================

app.get(
    "/api/cash-register/summary",
    authenticateToken,
    (req, res) => {

        const storeDb =
            req.storeDb;

        const cashierName =
            req.user.username;

        const today =
            todaySql();

        const summary = {};

        // ==============================================
        // CASH SALES
        // ==============================================

        storeDb.query(
            `
            SELECT
                COALESCE(
                    SUM(total),
                    0
                ) AS cashSales
            FROM invoices
            WHERE payment_Method = 'Cash'
            AND cashier_name = ?
            AND invoice_date = ${today}
            `,
            [cashierName],
            (err, rows) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            err.message,
                    });
                }

                summary.cashSales =
                    Number(
                        rows[0].cashSales
                    ) || 0;


                // ======================================
                // ONLINE
                // ======================================

                storeDb.query(
                    `
                    SELECT
                        COALESCE(
                            SUM(total),
                            0
                        ) AS onlineSales
                    FROM invoices
                    WHERE payment_Method = 'Online'
                    AND cashier_name = ?
                    AND invoice_date = ${today}
                    `,
                    [cashierName],
                    (err, rows) => {

                        if (err) {

                            return res.status(500).json({
                                success: false,
                                message:
                                    err.message,
                            });
                        }

                        summary.onlineSales =
                            Number(
                                rows[0].onlineSales
                            ) || 0;


                        // ==============================
                        // REFUNDS
                        // ==============================

                        const refundsSql = `
                            SELECT
                                COALESCE(
                                    SUM(
                                        ir.refund_amount
                                    ),
                                    0
                                ) AS refunds

                            FROM invoice_returns ir

                            INNER JOIN invoices i
                                ON ir.invoice_id = i.id

                            WHERE i.cashier_name = ?

                            AND DATE(
                                CONVERT_TZ(
                                    ir.created_at,
                                    '+00:00',
                                    '+05:30'
                                )
                            ) =
                            ${today}
                        `;

                        storeDb.query(
                            refundsSql,
                            [cashierName],
                            (err, rows) => {

                                if (err) {

                                    return res.status(500).json({
                                        success: false,
                                        message:
                                            err.message,
                                    });
                                }

                                summary.refunds =
                                    Number(
                                        rows[0]
                                            .refunds
                                    ) || 0;

                                res.json({
                                    success: true,
                                    cashierName,
                                    summary,
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
// CASH REGISTER CURRENT
// ======================================================

app.get(
    "/api/cash-register/current",
    authenticateToken,
    (req, res) => {

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

                    return res.status(500).json({
                        success: false,
                        message:
                            err.message,
                    });
                }

                if (
                    rows.length === 0
                ) {

                    return res.json({
                        success: true,
                        registerOpen: false,
                        register: null,
                    });
                }

                res.json({
                    success: true,
                    registerOpen: true,
                    register: rows[0],
                });
            }
        );
    }
);


// ======================================================
// CASH REGISTER HISTORY
// ======================================================

app.get(
    "/api/cash-register/history",
    authenticateToken,
    (req, res) => {

        const storeDb =
            req.storeDb;

        const cashierName =
            req.user.username;

        storeDb.query(
            `
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
            `,
            [cashierName],
            (err, rows) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            err.message,
                    });
                }

                res.json({
                    success: true,
                    cashierName,
                    history: rows,
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

        const storeDb =
            req.storeDb;

        const amount =
            Number(
                req.body.openingCash
            );

        if (
            !Number.isFinite(amount) ||
            amount < 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid opening cash amount",
            });
        }

        const cashierName =
            req.user.username;

        storeDb.query(
            `
            SELECT id
            FROM cash_registers
            WHERE cashier_name = ?
            AND status = 'OPEN'
            LIMIT 1
            `,
            [cashierName],
            (err, rows) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            err.message,
                    });
                }

                if (
                    rows.length > 0
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "You already have an open cash register",
                    });
                }

                storeDb.query(
                    `
                    INSERT INTO cash_registers
                    (
                        cashier_name,
                        opening_cash,
                        opening_time,
                        status
                    )
                    VALUES
                    (?, ?, NOW(), 'OPEN')
                    `,
                    [
                        cashierName,
                        amount,
                    ],
                    (err, result) => {

                        if (err) {

                            return res.status(500).json({
                                success: false,
                                message:
                                    err.message,
                            });
                        }

                        res.json({
                            success: true,
                            message:
                                "Cash register opened successfully",
                            registerId:
                                result.insertId,
                            cashierName,
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

        const storeDb =
            req.storeDb;

        const amount =
            Number(
                req.body.actualCash
            );

        const ownerTakenAmount =
            Number(
                req.body.ownerTaken || 0
            );

        if (
            !Number.isFinite(amount) ||
            amount < 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid actual cash amount",
            });
        }

        if (
            !Number.isFinite(
                ownerTakenAmount
            ) ||
            ownerTakenAmount < 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid owner taken amount",
            });
        }

        if (
            ownerTakenAmount >
            amount
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Owner taken amount cannot be greater than actual cash",
            });
        }

        const cashierName =
            req.user.username;

        storeDb.query(
            `
            SELECT
                id,
                opening_cash

            FROM cash_registers

            WHERE cashier_name = ?

            AND status = 'OPEN'

            ORDER BY id DESC

            LIMIT 1
            `,
            [cashierName],
            (err, rows) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            err.message,
                    });
                }

                if (
                    rows.length === 0
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "No open cash register found",
                    });
                }

                const register =
                    rows[0];

                const openingCash =
                    Number(
                        register.opening_cash
                    ) || 0;

                const today =
                    todaySql();

                // ======================================
                // CASH SALES
                // ======================================

                storeDb.query(
                    `
                    SELECT
                        COALESCE(
                            SUM(total),
                            0
                        ) AS cashSales

                    FROM invoices

                    WHERE payment_Method = 'Cash'

                    AND cashier_name = ?

                    AND invoice_date = ${today}
                    `,
                    [cashierName],
                    (err, cashRows) => {

                        if (err) {

                            return res.status(500).json({
                                success: false,
                                message:
                                    err.message,
                            });
                        }

                        const cashSales =
                            Number(
                                cashRows[0]
                                    .cashSales
                            ) || 0;


                        // ==================================
                        // REFUNDS
                        // ==================================

                        const refundsSql = `
                            SELECT
                                COALESCE(
                                    SUM(
                                        ir.refund_amount
                                    ),
                                    0
                                ) AS refunds

                            FROM invoice_returns ir

                            INNER JOIN invoices i
                                ON ir.invoice_id = i.id

                            WHERE i.cashier_name = ?

                            AND DATE(
                                CONVERT_TZ(
                                    ir.created_at,
                                    '+00:00',
                                    '+05:30'
                                )
                            ) =
                            ${today}
                        `;

                        storeDb.query(
                            refundsSql,
                            [cashierName],
                            (err, refundRows) => {

                                if (err) {

                                    return res.status(500).json({
                                        success: false,
                                        message:
                                            err.message,
                                    });
                                }

                                // ==================================
                                // FIXED BUG:
                                // refundRows, NOT rows
                                // ==================================

                                const refunds =
                                    Number(
                                        refundRows[0]
                                            .refunds
                                    ) || 0;

                                const expectedCash =
                                    openingCash +
                                    cashSales -
                                    refunds;

                                const difference =
                                    amount -
                                    expectedCash;

                                const remainingCash =
                                    amount -
                                    ownerTakenAmount;

                                // ==================================
                                // UPDATE REGISTER
                                // ==================================

                                storeDb.query(
                                    `
                                    UPDATE cash_registers

                                    SET
                                        actual_cash = ?,
                                        expected_cash = ?,
                                        difference = ?,
                                        owner_taken = ?,
                                        closing_time = NOW(),
                                        status = 'CLOSED'

                                    WHERE id = ?
                                    `,
                                    [
                                        amount,
                                        expectedCash,
                                        difference,
                                        ownerTakenAmount,
                                        register.id,
                                    ],
                                    (err) => {

                                        if (err) {

                                            return res.status(500).json({
                                                success: false,
                                                message:
                                                    err.message,
                                            });
                                        }

                                        res.json({
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

                                            remainingCash,
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
// MASTER DB TEST
// ======================================================

app.get(
    "/api/test-store",
    (req, res) => {

        masterDb.query(
            `
            SELECT
                id,
                store_code,
                store_name,
                database_name
            FROM stores
            WHERE store_code = ?
            `,
            ["STORE001"],
            (err, rows) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message:
                            err.message,
                    });
                }

                res.json({
                    success: true,
                    store:
                        rows[0] || null,
                });
            }
        );
    }
);


// ======================================================
// DYNAMIC DB TEST
// ======================================================

app.get(
    "/api/test-dynamic-db/:storeCode",
    (req, res) => {

        const storeCode =
            req.params.storeCode;

        masterDb.query(
            `
            SELECT
                id,
                store_code,
                store_name,
                database_name
            FROM stores
            WHERE store_code = ?
            `,
            [storeCode],
            (err, stores) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        step:
                            "master_db",
                        message:
                            err.message,
                    });
                }

                if (
                    stores.length === 0
                ) {

                    return res.status(404).json({
                        success: false,
                        message:
                            "Store not found",
                    });
                }

                const store =
                    stores[0];

                let storeDb;

                try {

                    storeDb =
                        getDatabase(
                            store.database_name
                        );

                } catch (error) {

                    return res.status(500).json({
                        success: false,
                        step:
                            "store_database",
                        message:
                            error.message,
                    });
                }

                storeDb.query(
                    `
                    SELECT
                        DATABASE()
                        AS databaseName
                    `,
                    (err, rows) => {

                        if (err) {

                            return res.status(500).json({
                                success: false,
                                step:
                                    "store_database",
                                message:
                                    err.message,
                            });
                        }

                        res.json({
                            success: true,

                            store: {
                                id:
                                    store.id,

                                storeCode:
                                    store.store_code,

                                storeName:
                                    store.store_name,

                                databaseName:
                                    store.database_name,
                            },

                            connectedDatabase:
                                rows[0]
                                    .databaseName,
                        });
                    }
                );
            }
        );
    }
);


// ======================================================
// 404
// ======================================================

app.use(
    (req, res) => {

        res.status(404).json({
            success: false,
            message:
                `API route not found: ${req.method} ${req.originalUrl}`,
        });
    }
);


// ======================================================
// GLOBAL ERROR HANDLER
// ======================================================

app.use(
    (err, req, res, next) => {

        console.error(
            "Global Server Error:",
            err
        );

        res.status(500).json({
            success: false,
            message:
                "Internal server error",
        });
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
            "=========================================="
        );

        console.log(
            "INVOICE / SUPERMARKET BACKEND"
        );

        console.log(
            "=========================================="
        );

        console.log(
            `Server running on port ${PORT}`
        );

        console.log(
            `Master Database: ${
                process.env.MASTER_DB_NAME ||
                "master_db"
            }`
        );

        console.log(
            "Dynamic Store DB: ENABLED"
        );

        console.log(
            "=========================================="
        );
    }
);