import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

import {
    LayoutDashboard,
    ShoppingCart,
    Receipt,
    Wallet,
    Package,
    Boxes,
    Users,
    BarChart3,
    UserCog,
    Settings,
    LogOut,
    Menu,
    X,
    ChevronDown,
    Store,
} from "lucide-react";


const Navbar = ({ onLogout }) => {

    const location = useLocation();

const user = JSON.parse(
    sessionStorage.getItem("user")
);

const store = JSON.parse(
    sessionStorage.getItem("store")
);

    const [sidebarOpen, setSidebarOpen] =
        useState(false);

    const [managementOpen, setManagementOpen] =
        useState(true);


    // =========================================================
    // ACTIVE ROUTE
    // =========================================================

    const isActive = (path) =>
        location.pathname === path;


    // =========================================================
    // CLOSE SIDEBAR
    // =========================================================

    const closeSidebar = () => {
        setSidebarOpen(false);
    };


    // =========================================================
    // LOGOUT
    // =========================================================

    const handleLogout = () => {

        closeSidebar();

        onLogout();

    };


    // =========================================================
    // USER INITIAL
    // =========================================================

    const userInitial =
        user?.username
            ?.charAt(0)
            ?.toUpperCase() || "U";


    // =========================================================
    // PAGE TITLE
    // =========================================================

    const getPageTitle = () => {

        switch (location.pathname) {

            case "/":
                return "New Sale";

            case "/dashboard":
                return "Dashboard";

            case "/invoices":
                return "Invoices";

            case "/cash-register":
                return "Cash Register";

            case "/products":
                return "Products";

            case "/inventory":
                return "Inventory";

            case "/customers":
                return "Customers";

            case "/reports":
                return "Reports";

            case "/users":
                return "Users";

            default:
                     return store?.storeName || "POS SYSTEM";
        }

    };


    return (
        <>

            {/* =====================================================
                MOBILE TOP BAR
            ===================================================== */}

            <header
                className="
                    lg:hidden
                    fixed
                    top-0
                    left-0
                    right-0
                    h-16
                    bg-white
                    text-slate-800
                    border-b
                    border-slate-200
                    z-50
                    shadow-sm
                "
            >

                <div
                    className="
                        h-full
                        flex
                        items-center
                        justify-between
                        px-3
                    "
                >

                    {/* =================================================
                        MOBILE LEFT
                    ================================================= */}

                    <div
                        className="
                            flex
                            items-center
                            gap-2
                            min-w-0
                        "
                    >

                        {/* MENU BUTTON */}

                        <button
                            onClick={() =>
                                setSidebarOpen(true)
                            }
                            className="
                                p-2
                                rounded-lg
                                text-slate-600
                                hover:bg-slate-100
                                hover:text-slate-900
                                transition
                                flex-shrink-0
                            "
                            aria-label="Open menu"
                        >

                            <Menu size={23} />

                        </button>


                        {/* STORE */}

                        <div
                            className="
                                flex
                                items-center
                                gap-2
                                min-w-0
                            "
                        >

                            {/* STORE ICON */}

                            <div
                                className="
                                    bg-slate-800
                                    text-white
                                    p-2
                                    rounded-lg
                                    flex-shrink-0
                                "
                            >

                                <Store size={19} />

                            </div>


                            {/* STORE TEXT */}

                            <div
                                className="
                                    min-w-0
                                    leading-tight
                                "
                            >

                                <h1
                                    className="
                                        font-bold
                                        text-xs
                                        sm:text-sm
                                        text-slate-800
                                        leading-tight
                                        truncate
                                    "
                                >
                                    {store?.storeName || "POS SYSTEM"}
                                </h1>

                                <p
                                    className="
                                        text-[9px]
                                        sm:text-[10px]
                                        text-slate-500
                                        leading-tight
                                        mt-0.5
                                    "
                                >
                                    Point of Sale
                                </p>

                            </div>

                        </div>

                    </div>


                    {/* =================================================
                        MOBILE RIGHT
                    ================================================= */}

                    <div
                        className="
                            flex
                            items-center
                            gap-2
                            flex-shrink-0
                        "
                    >

                        {/* SYSTEM STATUS */}

                        <div
                            className="
                                flex
                                items-center
                                gap-1.5
                                text-[9px]
                                sm:text-xs
                                text-slate-500
                                whitespace-nowrap
                            "
                        >

                            <span
                                className="
                                    w-2
                                    h-2
                                    rounded-full
                                    bg-emerald-500
                                    flex-shrink-0
                                "
                            />

                            <span>
                                System Online
                            </span>

                        </div>


                        {/* MOBILE USER */}

                        <div
                            className="
                                flex
                                items-center
                                gap-2
                                pl-2
                                border-l
                                border-slate-200
                            "
                        >

                            {/* AVATAR */}

                            <div
                                className="
                                    w-8
                                    h-8
                                    rounded-full
                                    bg-slate-800
                                    text-white
                                    flex
                                    items-center
                                    justify-center
                                    font-bold
                                    text-sm
                                    flex-shrink-0
                                "
                            >
                                {userInitial}
                            </div>


                            {/* USER TEXT */}

                            <div
                                className="
                                    leading-tight
                                "
                            >

                                <p
                                    className="
                                        text-[10px]
                                        sm:text-xs
                                        font-semibold
                                        text-slate-800
                                        leading-tight
                                        max-w-[65px]
                                        sm:max-w-[90px]
                                        truncate
                                    "
                                >
                                    {user?.username}
                                </p>

                                <p
                                    className="
                                        text-[8px]
                                        sm:text-[10px]
                                        text-slate-500
                                        leading-tight
                                        mt-0.5
                                    "
                                >
                                    {user?.role}
                                </p>

                            </div>

                        </div>

                    </div>

                </div>

            </header>


            {/* =====================================================
                MOBILE OVERLAY
            ===================================================== */}

            {sidebarOpen && (

                <div
                    className="
                        lg:hidden
                        fixed
                        inset-0
                        bg-slate-900/30
                        backdrop-blur-[1px]
                        z-40
                    "
                    onClick={closeSidebar}
                />

            )}


            {/* =====================================================
                SIDEBAR
            ===================================================== */}

            <aside
                className={`
                    fixed
                    top-0
                    left-0
                    bottom-0
                    w-64
                    bg-white
                    text-slate-800
                    border-r
                    border-slate-200
                    z-50
                    flex
                    flex-col
                    shadow-lg
                    transition-transform
                    duration-300

                    lg:translate-x-0

                    ${
                        sidebarOpen
                            ? "translate-x-0"
                            : "-translate-x-full"
                    }
                `}
            >

                {/* =================================================
                    SIDEBAR HEADER
                ================================================= */}

                <div
                    className="
                        h-16
                        flex
                        items-center
                        justify-between
                        px-5
                        border-b
                        border-slate-200
                    "
                >

                    <div
                        className="
                            flex
                            items-center
                            gap-3
                        "
                    >

                        {/* STORE ICON */}

                        <div
                            className="
                                bg-slate-800
                                text-white
                                p-2.5
                                rounded-xl
                                flex-shrink-0
                                shadow-sm
                            "
                        >

                            <Store size={24} />

                        </div>


                        {/* STORE NAME */}

                        <div
                            className="
                                leading-tight
                            "
                        >

                            <h1
                                className="
                                    font-bold
                                    text-base
                                    text-slate-800
                                    leading-tight
                                "
                            >
                                {store?.storeName || "POS SYSTEM"}
                            </h1>

                            <p
                                className="
                                    text-xs
                                    text-slate-500
                                    leading-tight
                                    mt-0.5
                                "
                            >
                                Point of Sale
                            </p>

                        </div>

                    </div>


                    {/* MOBILE CLOSE */}

                    <button
                        onClick={closeSidebar}
                        className="
                            lg:hidden
                            p-1.5
                            rounded-lg
                            text-slate-500
                            hover:bg-slate-100
                            hover:text-slate-800
                            transition
                        "
                        aria-label="Close menu"
                    >

                        <X size={22} />

                    </button>

                </div>


                {/* =================================================
                    NAVIGATION
                ================================================= */}

                <div
                    className="
                        flex-1
                        overflow-y-auto
                        px-3
                        py-5
                    "
                >

                    {/* =================================================
                        OPERATIONS
                    ================================================= */}

                    <p
                        className="
                            px-3
                            mb-2
                            text-[11px]
                            font-bold
                            tracking-wider
                            text-slate-400
                            uppercase
                        "
                    >
                        Operations
                    </p>


                    {/* NEW SALE */}

                    <Link
                        to="/"
                        onClick={closeSidebar}
                        className={`
                            flex
                            items-center
                            gap-3
                            px-3
                            py-3
                            mb-1
                            rounded-lg
                            text-sm
                            font-medium
                            transition

                            ${
                                isActive("/")
                                    ? "bg-slate-100 text-slate-900 font-semibold"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            }
                        `}
                    >

                        <ShoppingCart size={19} />

                        <span>
                            New Sale
                        </span>

                    </Link>


                    {/* INVOICES */}

                    <Link
                        to="/invoices"
                        onClick={closeSidebar}
                        className={`
                            flex
                            items-center
                            gap-3
                            px-3
                            py-3
                            mb-1
                            rounded-lg
                            text-sm
                            font-medium
                            transition

                            ${
                                isActive("/invoices")
                                    ? "bg-slate-100 text-slate-900 font-semibold"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            }
                        `}
                    >

                        <Receipt size={19} />

                        <span>
                            Invoices
                        </span>

                    </Link>


                    {/* CASH REGISTER */}

                    <Link
                        to="/cash-register"
                        onClick={closeSidebar}
                        className={`
                            flex
                            items-center
                            gap-3
                            px-3
                            py-3
                            mb-1
                            rounded-lg
                            text-sm
                            font-medium
                            transition

                            ${
                                isActive("/cash-register")
                                    ? "bg-slate-100 text-slate-900 font-semibold"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            }
                        `}
                    >

                        <Wallet size={19} />

                        <span>
                            Cash Register
                        </span>

                    </Link>


                    {/* =================================================
                        MANAGEMENT
                    ================================================= */}

                    {user?.role === "Admin" && (

                        <div className="mt-7">

                            {/* MANAGEMENT TITLE */}

                            <p
                                className="
                                    px-3
                                    mb-2
                                    text-[11px]
                                    font-bold
                                    tracking-wider
                                    text-slate-400
                                    uppercase
                                "
                            >
                                Management
                            </p>


                            {/* DASHBOARD */}

                            <Link
                                to="/dashboard"
                                onClick={closeSidebar}
                                className={`
                                    flex
                                    items-center
                                    gap-3
                                    px-3
                                    py-3
                                    mb-1
                                    rounded-lg
                                    text-sm
                                    font-medium
                                    transition

                                    ${
                                        isActive("/dashboard")
                                            ? "bg-slate-100 text-slate-900 font-semibold"
                                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    }
                                `}
                            >

                                <LayoutDashboard size={19} />

                                <span>
                                    Dashboard
                                </span>

                            </Link>


                            {/* MANAGE DROPDOWN */}

                            <button
                                onClick={() =>
                                    setManagementOpen(
                                        !managementOpen
                                    )
                                }
                                className="
                                    w-full
                                    flex
                                    items-center
                                    justify-between
                                    px-3
                                    py-3
                                    rounded-lg
                                    text-sm
                                    font-medium
                                    text-slate-600
                                    hover:bg-slate-50
                                    hover:text-slate-900
                                    transition
                                "
                            >

                                <div
                                    className="
                                        flex
                                        items-center
                                        gap-3
                                    "
                                >

                                    <Settings size={19} />

                                    <span>
                                        Manage
                                    </span>

                                </div>


                                <ChevronDown
                                    size={16}
                                    className={`
                                        transition-transform

                                        ${
                                            managementOpen
                                                ? "rotate-180"
                                                : ""
                                        }
                                    `}
                                />

                            </button>


                            {/* =================================================
                                MANAGEMENT ITEMS
                            ================================================= */}

                            {managementOpen && (

                                <div
                                    className="
                                        ml-3
                                        mt-1
                                        pl-3
                                        border-l
                                        border-slate-200
                                    "
                                >

                                    {/* PRODUCTS */}

                                    <Link
                                        to="/products"
                                        onClick={closeSidebar}
                                        className={`
                                            flex
                                            items-center
                                            gap-3
                                            px-3
                                            py-2.5
                                            rounded-lg
                                            text-sm
                                            transition

                                            ${
                                                isActive("/products")
                                                    ? "bg-slate-100 text-slate-900 font-semibold"
                                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                            }
                                        `}
                                    >

                                        <Package size={17} />

                                        <span>
                                            Products
                                        </span>

                                    </Link>


                                    {/* INVENTORY */}

                                    <Link
                                        to="/inventory"
                                        onClick={closeSidebar}
                                        className={`
                                            flex
                                            items-center
                                            gap-3
                                            px-3
                                            py-2.5
                                            rounded-lg
                                            text-sm
                                            transition

                                            ${
                                                isActive("/inventory")
                                                    ? "bg-slate-100 text-slate-900 font-semibold"
                                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                            }
                                        `}
                                    >

                                        <Boxes size={17} />

                                        <span>
                                            Inventory
                                        </span>

                                    </Link>


                                    {/* CUSTOMERS */}

                                    <Link
                                        to="/customers"
                                        onClick={closeSidebar}
                                        className={`
                                            flex
                                            items-center
                                            gap-3
                                            px-3
                                            py-2.5
                                            rounded-lg
                                            text-sm
                                            transition

                                            ${
                                                isActive("/customers")
                                                    ? "bg-slate-100 text-slate-900 font-semibold"
                                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                            }
                                        `}
                                    >

                                        <Users size={17} />

                                        <span>
                                            Customers
                                        </span>

                                    </Link>


                                    {/* REPORTS */}

                                    <Link
                                        to="/reports"
                                        onClick={closeSidebar}
                                        className={`
                                            flex
                                            items-center
                                            gap-3
                                            px-3
                                            py-2.5
                                            rounded-lg
                                            text-sm
                                            transition

                                            ${
                                                isActive("/reports")
                                                    ? "bg-slate-100 text-slate-900 font-semibold"
                                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                            }
                                        `}
                                    >

                                        <BarChart3 size={17} />

                                        <span>
                                            Reports
                                        </span>

                                    </Link>


                                    {/* USERS */}

                                    <Link
                                        to="/users"
                                        onClick={closeSidebar}
                                        className={`
                                            flex
                                            items-center
                                            gap-3
                                            px-3
                                            py-2.5
                                            rounded-lg
                                            text-sm
                                            transition

                                            ${
                                                isActive("/users")
                                                    ? "bg-slate-100 text-slate-900 font-semibold"
                                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                            }
                                        `}
                                    >

                                        <UserCog size={17} />

                                        <span>
                                            Users
                                        </span>

                                    </Link>

                                </div>

                            )}

                        </div>

                    )}

                </div>


                {/* =================================================
                    USER + LOGOUT
                ================================================= */}

                <div
                    className="
                        border-t
                        border-slate-200
                        p-3
                    "
                >

                    {/* USER CARD */}

                    <div
                        className="
                            flex
                            items-center
                            gap-3
                            px-3
                            py-3
                            mb-2
                            rounded-lg
                            bg-slate-50
                            border
                            border-slate-200
                        "
                    >

                        {/* AVATAR */}

                        <div
                            className="
                                w-9
                                h-9
                                rounded-full
                                bg-slate-800
                                text-white
                                flex
                                items-center
                                justify-center
                                font-bold
                                text-sm
                                flex-shrink-0
                            "
                        >
                            {userInitial}
                        </div>


                        {/* USER DETAILS */}

                        <div
                            className="
                                flex-1
                                min-w-0
                                leading-tight
                            "
                        >

                            <p
                                className="
                                    text-sm
                                    font-semibold
                                    text-slate-800
                                    leading-tight
                                    truncate
                                "
                            >
                                {user?.username}
                            </p>

                            <p
                                className="
                                    text-xs
                                    text-slate-500
                                    leading-tight
                                    mt-0.5
                                "
                            >
                                {user?.role}
                            </p>

                        </div>

                    </div>


                    {/* LOGOUT */}

                    <button
                        onClick={handleLogout}
                        className="
                            w-full
                            flex
                            items-center
                            gap-3
                            px-3
                            py-3
                            rounded-lg
                            text-sm
                            font-medium
                            text-slate-600
                            hover:bg-red-50
                            hover:text-red-600
                            transition
                        "
                    >

                        <LogOut size={19} />

                        <span>
                            Logout
                        </span>

                    </button>

                </div>

            </aside>


            {/* =====================================================
                DESKTOP TOP BAR
            ===================================================== */}

            <header
                className="
                    hidden
                    lg:flex
                    fixed
                    top-0
                    left-64
                    right-0
                    h-16
                    bg-white
                    border-b
                    border-slate-200
                    z-40
                    items-center
                    justify-between
                    px-6
                    shadow-sm
                "
            >

                {/* =================================================
                    PAGE INFO
                ================================================= */}

                <div
                    className="
                        leading-tight
                    "
                >

                    <h2
                        className="
                            text-lg
                            font-semibold
                            text-slate-800
                            leading-tight
                        "
                    >
                        {getPageTitle()}
                    </h2>

                    <p
                        className="
                            text-xs
                            text-slate-500
                            leading-tight
                            mt-0.5
                        "
                    >
                        Point of Sale System
                    </p>

                </div>


                {/* =================================================
                    RIGHT SIDE
                ================================================= */}

                <div
                    className="
                        flex
                        items-center
                        gap-4
                    "
                >

                    {/* SYSTEM STATUS */}

                    <div
                        className="
                            flex
                            items-center
                            gap-2
                            text-xs
                            text-slate-500
                        "
                    >

                        <span
                            className="
                                w-2
                                h-2
                                rounded-full
                                bg-emerald-500
                            "
                        />

                        System Online

                    </div>


                    {/* USER */}

                    <div
                        className="
                            flex
                            items-center
                            gap-3
                            pl-4
                            border-l
                            border-slate-200
                        "
                    >

                        {/* AVATAR */}

                        <div
                            className="
                                w-9
                                h-9
                                rounded-full
                                bg-slate-800
                                text-white
                                flex
                                items-center
                                justify-center
                                font-bold
                                text-sm
                                flex-shrink-0
                            "
                        >
                            {userInitial}
                        </div>


                        {/* USER DETAILS */}

                        <div
                            className="
                                leading-tight
                            "
                        >

                            <p
                                className="
                                    text-sm
                                    font-semibold
                                    text-slate-800
                                    leading-tight
                                "
                            >
                                {user?.username}
                            </p>

                            <p
                                className="
                                    text-xs
                                    text-slate-500
                                    leading-tight
                                    mt-0.5
                                "
                            >
                                {user?.role}
                            </p>

                        </div>

                    </div>

                </div>

            </header>


            {/* =====================================================
                DESKTOP CONTENT OFFSET
            ===================================================== */}

            <div
                className="
                    hidden
                    lg:block
                    w-64
                    flex-shrink-0
                "
            />

        </>
    );

};


export default Navbar;