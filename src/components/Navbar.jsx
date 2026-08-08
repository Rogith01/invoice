
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = ({ onLogout }) => {

    const navigate = useNavigate();

    const user = JSON.parse(sessionStorage.getItem("user"));

    const [menuOpen, setMenuOpen] = useState(false);


    return (

        <nav className="bg-slate-800 text-white shadow-md">

            <div className="max-w-7xl mx-auto px-4">

                <div className="flex justify-between items-center h-16">

                    {/* Logo */}

                    <div
                        className="font-bold text-xl cursor-pointer truncate mr-2"
                        onClick={() => navigate("/")}
                    >
                        🛒 AK SUPER MARKET
                    </div>


                    {/* ============================= */}
                    {/* DESKTOP MENU */}
                    {/* ============================= */}

                    <div className="hidden md:flex items-center gap-6">

                        {/* Admin Menu */}

                        {user?.role === "Admin" && (
                            <>

                                <Link
                                    to="/dashboard"
                                    className="hover:text-gray-300"
                                >
                                    Dashboard
                                </Link>

                                <Link
                                    to="/products"
                                    className="hover:text-gray-300"
                                >
                                    Products
                                </Link>

                                <Link
                                    to="/inventory"
                                    className="hover:text-gray-300"
                                >
                                    Inventory
                                </Link>

                                <Link
                                    to="/users"
                                    className="hover:text-gray-300"
                                >
                                    Users
                                </Link>

                            </>
                        )}


                        {/* Billing */}

                        <Link
                            to="/"
                            className="hover:text-gray-300"
                        >
                            Billing
                        </Link>


                        {/* Invoices */}

                        <Link
                            to="/invoices"
                            className="hover:text-gray-300"
                        >
                            Invoices
                        </Link>


                        {/* Username */}

                        <span className="text-sm text-gray-300">
                            👤 {user?.username}
                        </span>


                        {/* Logout */}

                        <button
                            onClick={onLogout}
                            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded"
                        >
                            Logout
                        </button>

                    </div>


                    {/* ============================= */}
                    {/* MOBILE USERNAME + MENU BUTTON */}
                    {/* ============================= */}

                    <div className="md:hidden flex items-center gap-3 pr-2">

                        {/* Username */}

                        <span className="text-sm text-gray-300">
                            👤 {user?.username}
                        </span>


                        {/* Menu Button */}

                        <button
                            className="text-3xl px-1"
                            onClick={() => setMenuOpen(!menuOpen)}
                        >
                            ☰
                        </button>

                    </div>

                </div>

            </div>


            {/* ============================= */}
            {/* MOBILE MENU */}
            {/* ============================= */}

            {menuOpen && (

                <div className="md:hidden bg-slate-700 flex flex-col">


                    {/* Admin Menu */}

                    {user?.role === "Admin" && (
                        <>

                            <Link
                                className="p-3 border-b hover:bg-slate-600"
                                to="/dashboard"
                                onClick={() => setMenuOpen(false)}
                            >
                                Dashboard
                            </Link>

                            <Link
                                className="p-3 border-b hover:bg-slate-600"
                                to="/products"
                                onClick={() => setMenuOpen(false)}
                            >
                                Products
                            </Link>

                            <Link
                                className="p-3 border-b hover:bg-slate-600"
                                to="/inventory"
                                onClick={() => setMenuOpen(false)}
                            >
                                Inventory
                            </Link>

                            <Link
                                className="p-3 border-b hover:bg-slate-600"
                                to="/users"
                                onClick={() => setMenuOpen(false)}
                            >
                                Users
                            </Link>

                        </>
                    )}


                    {/* Billing */}

                    <Link
                        className="p-3 border-b hover:bg-slate-600"
                        to="/"
                        onClick={() => setMenuOpen(false)}
                    >
                        Billing
                    </Link>


                    {/* Invoices */}

                    <Link
                        className="p-3 border-b hover:bg-slate-600"
                        to="/invoices"
                        onClick={() => setMenuOpen(false)}
                    >
                        Invoices
                    </Link>


                    {/* Logout */}

                    <button
                        onClick={onLogout}
                        className="text-left p-3 hover:bg-red-700"
                    >
                        Logout
                    </button>

                </div>

            )}

        </nav>

    );

};

export default Navbar;
