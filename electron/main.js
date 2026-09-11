const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const express = require("express");
const { autoUpdater } = require("electron-updater");
const thermalPrinter = require("node-thermal-printer").printer;
const PrinterTypes = require("node-thermal-printer").types;

let server;
let mainWindow;

// ======================================================
// START REACT SERVER
// ======================================================

function startReactServer() {
    return new Promise((resolve, reject) => {
        const expressApp = express();

        const buildPath = path.join(
            __dirname,
            "..",
            "build"
        );

        expressApp.use(
            express.static(buildPath)
        );

        expressApp.use((req, res) => {
            res.sendFile(
                path.join(
                    buildPath,
                    "index.html"
                )
            );
        });

        server = expressApp.listen(
            0,
            "127.0.0.1",
            () => {
                const port =
                    server.address().port;

                console.log(
                    `React app running on http://127.0.0.1:${port}`
                );

                resolve(port);
            }
        );

        server.on("error", reject);
    });
}


// ======================================================
// CREATE WINDOW
// ======================================================

async function createWindow() {
    const port =
        await startReactServer();

    mainWindow =
        new BrowserWindow({
            width: 1400,
            height: 900,

            minWidth: 1000,
            minHeight: 700,

            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                // LINKED PRELOAD SCRIPT HERE
                preload: path.join(__dirname, "preload.js"),
            },
        });

    await mainWindow.loadURL(
        `http://127.0.0.1:${port}`
    );

    // Keep this commented for now.
    // mainWindow.webContents.openDevTools();
}


// ======================================================
// SILENT THERMAL PRINT HANDLER (80mm)
// ======================================================

ipcMain.on('print-receipt-silent', async (event, invoiceData) => {
    try {
        let printer = new thermalPrinter({
            type: PrinterTypes.EPSON,
            interface: 'printer:auto',
            characterSet: 'SLOVENIA',
            removeSpecialCharacters: false
        });

        let isConnected = await printer.isPrinterConnected();
        if (!isConnected) {
            console.log("Thermal printer not connected.");
            return;
        }

        printer.alignCenter();
        printer.println(invoiceData.storeName);
        if (invoiceData.storeAddress) {
            printer.println(invoiceData.storeAddress);
        }
        printer.drawLine();
        
        printer.alignLeft();
        printer.println(`Inv: ${invoiceData.invoiceNumber}`);
        printer.println(`Date: ${invoiceData.date} Time: ${invoiceData.time}`);
        printer.println(`Cashier: ${invoiceData.cashierName}`);
        printer.drawLine();

        invoiceData.items.forEach(item => {
            printer.table([
                item.name,
                String(item.qty),
                `Rs.${Number(item.amount || item.price * item.qty).toFixed(2)}`
            ]);
        });

        printer.drawLine();
        printer.alignRight();
        printer.bold(true);
        printer.println(`TOTAL: Rs.${Number(invoiceData.total).toFixed(2)}`);
        printer.bold(false);
        
        printer.alignCenter();
        printer.println("Thank you for shopping!");
        printer.cut();

        await printer.execute();
        console.log("Silent thermal print executed successfully.");
    } catch (error) {
        console.error("Silent print failed: ", error);
    }
});


// ======================================================
// AUTO UPDATE
// ======================================================

function checkForUpdates() {

    if (!app.isPackaged) {
        console.log(
            "Auto update skipped: app is running in development mode."
        );

        return;
    }

    console.log(
        "Checking for BILLQORA updates..."
    );

    autoUpdater.on("checking-for-update", () => {
    console.log("Checking for BILLQORA update...");
});

autoUpdater.on("update-available", (info) => {
    console.log(
        "BILLQORA update available:",
        info.version
    );
});

autoUpdater.on("update-not-available", (info) => {
    console.log(
        "BILLQORA is up to date:",
        info.version
    );
});

autoUpdater.on("error", (error) => {
    console.error(
        "BILLQORA AUTO UPDATE ERROR:",
        error
    );
});

autoUpdater.on("download-progress", (progress) => {
    console.log(
        `Downloading update: ${Math.round(progress.percent)}%`
    );
});

autoUpdater.on("update-downloaded", (info) => {
    console.log(
        "BILLQORA update downloaded:",
        info.version
    );
});

autoUpdater.checkForUpdatesAndNotify();
}


// ======================================================
// APP READY
// ======================================================

app.whenReady().then(async () => {

    await createWindow();

    // Check for updates after app starts
    setTimeout(() => {
        checkForUpdates();
    }, 3000);


    app.on("activate", async () => {

        if (
            BrowserWindow.getAllWindows()
                .length === 0
        ) {
            await createWindow();
        }

    });

});


// ======================================================
// WINDOWS CLOSED
// ======================================================

app.on("window-all-closed", () => {

    if (server) {
        server.close();
    }

    if (process.platform !== "darwin") {
        app.quit();
    }

});