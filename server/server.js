require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(
    cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"]
    })
);

app.use(express.json());


// ======================================================
// MASTER DATABASE
// ======================================================

const masterDb = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 4000,

    database: process.env.MASTER_DB,

    ssl: {
        rejectUnauthorized: false
    },

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


// ======================================================
// STORE DATABASE CACHE
// ======================================================

const storeDatabases = {};


// ======================================================
// GET STORE DATABASE
// ======================================================

function getDatabase(databaseName) {

    if (!databaseName) {
        throw new Error(
            "Store database name is missing"
        );
    }

    if (!storeDatabases[databaseName]) {

        storeDatabases[databaseName] =
            mysql.createPool({

                host: process.env.DB_HOST,

                user:
                    process.env.DB_USER,

                password:
                    process.env.DB_PASSWORD,

                port:
                    process.env.DB_PORT || 4000,

                database:
                    databaseName,

                ssl: {
                    rejectUnauthorized: false
                },

                waitForConnections: true,

                connectionLimit: 10,

                queueLimit: 0
            });

        console.log(
            `Store database connected: ${databaseName}`
        );
    }

    return storeDatabases[databaseName];
}


// ======================================================
// TEST MASTER DATABASE CONNECTION
// ======================================================

masterDb.query(
    "SELECT 1",
    (err) => {

        if (err) {

            console.error(
                "Master Database Connection Failed:",
                err
            );

        } else {

            console.log(
                "Master Database Connected"
            );

        }
    }
);


// ======================================================
// AUTHENTICATE TOKEN
// ======================================================

function authenticateToken(req, res, next) {

    const authHeader =
        req.headers.authorization;

    if (!authHeader) {

        return res.status(401).json({
            success: false,
            message:
                "Authorization token required"
        });
    }

    const token =
        authHeader.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : null;

    if (!token) {

        return res.status(401).json({
            success: false,
            message:
                "Invalid authorization token"
        });
    }

    jwt.verify(
        token,
        process.env.JWT_SECRET,
        (err, user) => {

            if (err) {

                return res.status(403).json({
                    success: false,
                    message:
                        "Invalid or expired token"
                });
            }

            try {

                // ==================================================
                // GET CURRENT STORE DATABASE
                // ==================================================

                if (!user.databaseName) {

                    return res.status(403).json({
                        success: false,
                        message:
                            "Store database information missing"
                    });
                }

                req.user = user;

                req.storeDb =
                    getDatabase(
                        user.databaseName
                    );

                next();

            } catch (error) {

                console.error(
                    "Store Database Error:",
                    error
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Unable to connect to store database"
                });
            }
        }
    );
}


// ======================================================
// DAILY SALES ANALYSIS
// ======================================================

app.get(
    "/api/dashboard/daily-sales",
    authenticateToken,
    (req, res) => {

        const storeDb =
            req.storeDb;

        const sql = `
            SELECT
                DATE(invoice_date) AS saleDate,

                IFNULL(
                    SUM(total),
                    0
                ) AS sales,

                COUNT(*) AS orders

            FROM invoices

            GROUP BY
                DATE(invoice_date)

            ORDER BY
                saleDate ASC
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

        const storeDb =
            req.storeDb;

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

            WHERE DATE(invoice_date)
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

                report.summary =
                    rows[0];

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

                        report.refunds =
                            rows[0];

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

                            WHERE DATE(invoice_date)
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

                                    WHERE DATE(i.invoice_date)
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

                                            WHERE DATE(invoice_date)
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

                                                    WHERE DATE(i.invoice_date)
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
                                                            rows[0]
                                                                .totalItemsSold;

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
                                                        // FINAL RESPONSE
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
// ======================================================

app.get(
    "/api/invoices",
    authenticateToken,
    (req, res) => {

        const storeDb =
            req.storeDb;

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

            ORDER BY
                invoices.id DESC
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

        const storeDb =
            req.storeDb;

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

                if (
                    invoiceRows.length === 0
                ) {

                    return res.json({
                        success: false,
                        message:
                            "Invoice not found"
                    });
                }

                const itemSql = `
                    SELECT
                        ii.*,

                        COALESCE(
                            (
                                SELECT SUM(ir.return_qty)

                                FROM invoice_returns ir

                                WHERE ir.invoice_id =
                                    ii.invoice_id

                                AND ir.product_name =
                                    ii.item_name
                            ),
                            0
                        ) AS returned_qty,

                        (
                            ii.qty -

                            COALESCE(
                                (
                                    SELECT SUM(ir.return_qty)

                                    FROM invoice_returns ir

                                    WHERE ir.invoice_id =
                                        ii.invoice_id

                                    AND ir.product_name =
                                        ii.item_name
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

            ORDER BY
                ir.created_at DESC
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

        // ==================================================
        // VALIDATE INPUT
        // ==================================================

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

        // ==================================================
        // FIND STORE IN MASTER DATABASE
        // ==================================================

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
                        message: err.message
                    });
                }

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

                // ==================================================
                // CONNECT TO THAT STORE DATABASE
                // ==================================================

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
                            error.message
                    });
                }

                // ==================================================
                // CHECK USER INSIDE STORE DATABASE
                // ==================================================

                const userSql = `
                    SELECT

                        id,
                        username,
                        role

                    FROM users

                    WHERE username = ?

                    AND password = ?
                `;

                storeDb.query(
                    userSql,
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

                            return res.status(401).json({
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

                        // ==================================================
                        // LOGIN SUCCESS
                        // ==================================================

                        res.json({

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

                            user:
                                user

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

app.post(
    "/api/invoices",
    authenticateToken,
    (req, res) => {

        console.log(
            "POST /api/invoices called"
        );

        console.log(
            "Store Database:",
            req.user.databaseName
        );

        console.log(
            req.body
        );

        // ==================================================
        // CURRENT STORE DATABASE
        // ==================================================

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
            paymentMethod
        } = req.body;

        // ==================================================
        // VALID ITEMS
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
        // CHECK STOCK
        // ==================================================

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
                                message: err.message
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


        // ==================================================
        // CUSTOMER CHECK
        // ==================================================

        const checkCustomer =
            () => {

                const checkCustomerSql = `
                    SELECT
                        id,
                        loyalty_points

                    FROM customers

                    WHERE phone_number = ?
                `;

                storeDb.query(
                    checkCustomerSql,
                    [phoneNumber],
                    (err, rows) => {

                        if (err) {

                            return res.status(500).json({
                                success: false,
                                message: err.message
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


        // ==================================================
        // SAVE INVOICE
        // ==================================================

        function saveInvoice(
            customerId,
            loyaltyPoints
        ) {

            // ==================================================
            // GET LAST INVOICE NUMBER
            // ==================================================

            const getLastInvoice = `
                SELECT invoice_number

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
                            message: err.message
                        });
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
                                    message: err.message
                                });
                            }

                            const invoiceId =
                                result.insertId;

                            let completed =
                                0;

                            // ==================================================
                            // UPDATE LOYALTY POINTS
                            // ==================================================

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
                                                    message: err.message
                                                });
                                            }

                                            return res.json({

                                                success:
                                                    true,

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


                            // ==================================================
                            // INSERT ITEMS + DEDUCT STOCK
                            // ==================================================

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

                                            // ==================================================
                                            // DEDUCT STOCK
                                            // ==================================================

                                            const updateStockSql = `
                                                UPDATE products

                                                SET stock_quantity =
                                                    COALESCE(
                                                        stock_quantity,
                                                        0
                                                    ) - ?

                                                WHERE product_name = ?
                                            `;

                                            storeDb.query(
                                                updateStockSql,
                                                [
                                                    Number(
                                                        item.qty
                                                    ),
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

                                                    // ==================================================
                                                    // STOCK MOVEMENT
                                                    // ==================================================

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

                                                    storeDb.query(
                                                        stockMovementSql,
                                                        [
                                                            Number(
                                                                item.qty
                                                            ),

                                                            Number(
                                                                item.qty
                                                            ),

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

        // ==================================================
        // START STOCK CHECK
        // ==================================================

        checkStock();
    }
);


// ======================================================
// DELETE INVOICE
// ======================================================

app.delete(
    "/api/invoices/:id",
    authenticateToken,
    (req, res) => {

        // ==================================================
        // ADMIN ONLY
        // ==================================================

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

        const storeDb =
            req.storeDb;

        // ==================================================
        // DELETE INVOICE ITEMS
        // ==================================================

        storeDb.query(
            `
            DELETE FROM invoice_items

            WHERE invoice_id = ?
            `,
            [invoiceId],
            (err) => {

                if (err) {

                    console.error(
                        "Delete Invoice Items Error:",
                        err
                    );

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });
                }

                // ==================================================
                // DELETE INVOICE
                // ==================================================

                storeDb.query(
                    `
                    DELETE FROM invoices

                    WHERE id = ?
                    `,
                    [invoiceId],
                    (err, result) => {

                        if (err) {

                            console.error(
                                "Delete Invoice Error:",
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
                                    "Invoice not found"
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

        const storeDb =
            req.storeDb;

        // ==================================================
        // VALIDATE PRODUCT
        // ==================================================

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

        // ==================================================
        // VALIDATE QUANTITY
        // ==================================================

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

        // ==================================================
        // GET ORIGINAL INVOICE ITEM
        // ==================================================

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
                        message: err.message
                    });
                }

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

                // ==================================================
                // PREVIOUS RETURNS
                // ==================================================

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
                                message: err.message
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

                        // ==================================================
                        // PREVENT OVER RETURN
                        // ==================================================

                        if (
                            quantity >
                            remainingQty
                        ) {

                            return res.status(400).json({

                                success:
                                    false,

                                message:
                                    `Cannot return ${quantity}. Only ${remainingQty} item(s) remaining for return.`

                            });
                        }

                        // ==================================================
                        // REFUND
                        // ==================================================

                        const price =
                            Number(
                                invoiceItem.price
                            ) || 0;

                        const refundAmount =
                            quantity *
                            price;

                        // ==================================================
                        // GET PRODUCT
                        // ==================================================

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
                            [
                                productName.trim()
                            ],
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

                                // ==================================================
                                // UPDATE STOCK
                                // ==================================================

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
                                                message: err.message
                                            });
                                        }

                                        // ==================================================
                                        // INSERT RETURN
                                        // ==================================================

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

                                                invoiceItem
                                                    .invoice_number,

                                                product.id,

                                                product
                                                    .product_name,

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
                                                                message: err.message
                                                            });
                                                        }

                                                        res.json({

                                                            success:
                                                                true,

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
// CASH REGISTER - TODAY'S SUMMARY
// ======================================================

app.get(
    "/api/cash-register/summary",
    authenticateToken,
    (req, res) => {

        // ==================================================
        // CURRENT STORE DATABASE
        // ==================================================

        const storeDb =
            req.storeDb;

        const cashierName =
            req.user.username;

        const summary = {};

        // ==================================================
        // CASH SALES
        // ==================================================

        const cashSalesSql = `
            SELECT

                COALESCE(
                    SUM(total),
                    0
                ) AS cashSales

            FROM invoices

            WHERE payment_Method = 'Cash'

            AND cashier_name = ?

            AND DATE(invoice_date) =
                CURDATE()
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

                // ==================================================
                // ONLINE SALES
                // ==================================================

                const onlineSalesSql = `
                    SELECT

                        COALESCE(
                            SUM(total),
                            0
                        ) AS onlineSales

                    FROM invoices

                    WHERE payment_Method = 'Online'

                    AND cashier_name = ?

                    AND DATE(invoice_date) =
                        CURDATE()
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

                        // ==================================================
                        // REFUNDS
                        // ==================================================

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

                            AND DATE(ir.created_at) =
                                CURDATE()
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

                                // ==================================================
                                // RESULT
                                // ==================================================

                                res.json({

                                    success:
                                        true,

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

                if (
                    rows.length === 0
                ) {

                    return res.json({

                        success:
                            true,

                        registerOpen:
                            false,

                        register:
                            null

                    });

                }

                res.json({

                    success:
                        true,

                    registerOpen:
                        true,

                    register:
                        rows[0]

                });

            }
        );

    }
);


// ======================================================
// CASH REGISTER - HISTORY
// ======================================================

app.get(
    "/api/cash-register/history",
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

                res.json({

                    success:
                        true,

                    cashierName,

                    history:
                        rows

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

        const {
            openingCash
        } = req.body;

        const amount =
            Number(openingCash);

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

        const cashierName =
            req.user.username;

        // ==================================================
        // CHECK EXISTING REGISTER
        // ==================================================

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

                if (
                    rows.length > 0
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "You already have an open cash register"
                    });
                }

                // ==================================================
                // CREATE REGISTER
                // ==================================================

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

                        res.json({

                            success:
                                true,

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

        const storeDb =
            req.storeDb;

        const {
            actualCash,
            ownerTaken
        } = req.body;

        const amount =
            Number(actualCash);

        const ownerTakenAmount =
            Number(
                ownerTaken || 0
            );

        // ==================================================
        // VALIDATE ACTUAL CASH
        // ==================================================

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

        // ==================================================
        // VALIDATE OWNER TAKEN
        // ==================================================

        if (
            !Number.isFinite(
                ownerTakenAmount
            ) ||
            ownerTakenAmount < 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid owner taken amount"
            });
        }

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

        const cashierName =
            req.user.username;

        // ==================================================
        // FIND OPEN REGISTER
        // ==================================================

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

                if (
                    rows.length === 0
                ) {

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

                // ==================================================
                // CASH SALES
                // ==================================================

                const cashSalesSql = `
                    SELECT

                        COALESCE(
                            SUM(total),
                            0
                        ) AS cashSales

                    FROM invoices

                    WHERE payment_Method = 'Cash'

                    AND cashier_name = ?

                    AND DATE(invoice_date) =
                        CURDATE()
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
                                cashRows[0]
                                    .cashSales || 0
                            );

                        // ==================================================
                        // REFUNDS
                        // ==================================================

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

                            AND DATE(ir.created_at) =
                                CURDATE()
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

                                // ==================================================
                                // FIXED BUG:
                                // refundRows WAS incorrectly called rows
                                // ==================================================

                                const refunds =
                                    Number(
                                        refundRows[0]
                                            .refunds || 0
                                    );

                                // ==================================================
                                // EXPECTED CASH
                                // ==================================================

                                const expectedCash =
                                    openingCash +
                                    cashSales -
                                    refunds;

                                // ==================================================
                                // DIFFERENCE
                                // ==================================================

                                const difference =
                                    amount -
                                    expectedCash;

                                // ==================================================
                                // REMAINING CASH
                                // ==================================================

                                const remainingCash =
                                    amount -
                                    ownerTakenAmount;

                                // ==================================================
                                // UPDATE REGISTER
                                // ==================================================

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

                                        res.json({

                                            success:
                                                true,

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
            ["STORE001"],
            (err, rows) => {

                if (err) {

                    return res.status(500).json({
                        success: false,
                        message: err.message
                    });
                }

                res.json({

                    success:
                        true,

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

        // ==================================================
        // FIND STORE
        // ==================================================

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

                        success:
                            false,

                        step:
                            "master_db",

                        message:
                            err.message

                    });
                }

                if (
                    stores.length === 0
                ) {

                    return res.status(404).json({

                        success:
                            false,

                        message:
                            "Store not found"

                    });
                }

                const store =
                    stores[0];

                // ==================================================
                // GET STORE DATABASE
                // ==================================================

                let storeDb;

                try {

                    storeDb =
                        getDatabase(
                            store.database_name
                        );

                } catch (error) {

                    return res.status(500).json({

                        success:
                            false,

                        step:
                            "store_database",

                        message:
                            error.message

                    });
                }

                // ==================================================
                // CHECK DATABASE
                // ==================================================

                storeDb.query(
                    "SELECT DATABASE() AS databaseName",
                    (err, rows) => {

                        if (err) {

                            return res.status(500).json({

                                success:
                                    false,

                                step:
                                    "store_database",

                                message:
                                    err.message

                            });
                        }

                        res.json({

                            success:
                                true,

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
                                rows[0]
                                    .databaseName

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