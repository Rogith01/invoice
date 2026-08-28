const { app, BrowserWindow } = require("electron");
const path = require("path");
const express = require("express");
const { autoUpdater } = require("electron-updater");

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
            },
        });

    await mainWindow.loadURL(
        `http://127.0.0.1:${port}`
    );

    // Keep this commented for now.
    // mainWindow.webContents.openDevTools();
}


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