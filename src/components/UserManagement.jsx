import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import Toast from "./Toast";
import api from "../api";

const API_URL =
    "https://invoice-backend-78hd.onrender.com";

const UserManagement = () => {

    // ==========================================
    // USERS
    // ==========================================

    const [users, setUsers] = useState([]);

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("Cashier");

    const [editingId, setEditingId] = useState(null);

    // ==========================================
    // DELETE CONFIRMATION
    // ==========================================

    const [deleteConfirm, setDeleteConfirm] = useState({
        show: false,
        id: null,
        username: "",
    });

    // ==========================================
    // TOAST
    // ==========================================

    const [toast, setToast] = useState({
        message: "",
        type: "success",
    });

    // ==========================================
    // TOAST SOUND
    // ==========================================

    const successSoundRef = useRef(null);
    const errorSoundRef = useRef(null);

    useEffect(() => {

        successSoundRef.current =
            new Audio("/success-tone.mp3");

        successSoundRef.current.volume = 1.0;

        errorSoundRef.current =
            new Audio("/error-tone.mp3");

        errorSoundRef.current.volume = 1.0;

        return () => {

            successSoundRef.current = null;
            errorSoundRef.current = null;

        };

    }, []);

    // ==========================================
    // SHOW TOAST
    // ==========================================

    const showToast = useCallback(
        (
            message,
            type = "success"
        ) => {

            if (type === "success") {

                if (successSoundRef.current) {

                    successSoundRef.current.currentTime = 0;

                    successSoundRef.current
                        .play()
                        .catch((error) => {

                            console.log(
                                "Success sound could not play:",
                                error
                            );

                        });

                }

            } else if (
                type === "error" ||
                type === "warning"
            ) {

                if (errorSoundRef.current) {

                    errorSoundRef.current.currentTime = 0;

                    errorSoundRef.current
                        .play()
                        .catch((error) => {

                            console.log(
                                "Error sound could not play:",
                                error
                            );

                        });

                }

            }

            setToast({
                message,
                type,
            });

        },
        []
    );

    // ==========================================
    // CLOSE TOAST
    // ==========================================

    const closeToast = useCallback(() => {

        setToast({
            message: "",
            type: "success",
        });

    }, []);

    // ==========================================
    // CLEAR FORM
    // ==========================================

    const clearForm = useCallback(() => {

        setEditingId(null);
        setUsername("");
        setPassword("");
        setRole("Cashier");

    }, []);

    // ==========================================
    // FETCH USERS
    // ==========================================

    const fetchUsers = useCallback(async () => {

        try {

            const response = await fetch(
                `${API_URL}/api/users`
            );

            const data = await response.json();

            if (data.success) {

                setUsers(
                    data.users || []
                );

            } else {

                showToast(
                    data.message ||
                        "Failed to load users.",
                    "error"
                );

            }

        } catch (err) {

            console.error(
                "Error fetching users:",
                err
            );

            showToast(
                "Failed to load users.",
                "error"
            );

        }

    }, [showToast]);

    // ==========================================
    // LOAD USERS
    // ==========================================

    useEffect(() => {

        fetchUsers();

    }, [fetchUsers]);

    // ==========================================
    // EDIT USER
    // ==========================================

    const editUser = (user) => {

        setEditingId(user.id);

        setUsername(
            user.username
        );

        setPassword("");

        setRole(
            user.role
        );

        showToast(
            `Editing user "${user.username}"`,
            "info"
        );

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });

    };

    // ==========================================
    // OPEN DELETE CONFIRMATION
    // ==========================================

    const confirmDeleteUser = (
        id,
        username
    ) => {

        setDeleteConfirm({
            show: true,
            id,
            username,
        });

    };

    // ==========================================
    // CANCEL DELETE
    // ==========================================

    const cancelDelete = () => {

        setDeleteConfirm({
            show: false,
            id: null,
            username: "",
        });

    };

    // ==========================================
    // DELETE USER
    // ==========================================

    const deleteUser = async () => {

        const {
            id,
            username,
        } = deleteConfirm;

        if (!id) return;

        try {

            const response = await fetch(
                `${API_URL}/api/users/${id}`,
                {
                    method: "DELETE",
                }
            );

            const data = await response.json();

            if (data.success) {

                await fetchUsers();

                if (editingId === id) {

                    clearForm();

                }

                setDeleteConfirm({
                    show: false,
                    id: null,
                    username: "",
                });

                showToast(
                    `User "${username}" deleted successfully.`,
                    "success"
                );

            } else {

                showToast(
                    data.message ||
                        "Failed to delete user.",
                    "error"
                );

            }

        } catch (err) {

            console.error(
                "Error deleting user:",
                err
            );

            showToast(
                "Failed to delete user.",
                "error"
            );

        }

    };

    // ==========================================
    // SAVE USER
    // ==========================================

    const saveUser = async () => {

        const trimmedUsername =
            username.trim();

        // ==========================================
        // USERNAME VALIDATION
        // ==========================================

        if (!trimmedUsername) {

            showToast(
                "Please enter a username.",
                "warning"
            );

            return;

        }

        // ==========================================
        // PASSWORD VALIDATION
        // ==========================================

        if (
            !editingId &&
            !password.trim()
        ) {

            showToast(
                "Please enter a password.",
                "warning"
            );

            return;

        }

        // ==========================================
        // UPDATE USER
        // ==========================================

        if (editingId) {

            try {

                const updateData = {
                    username:
                        trimmedUsername,
                    role,
                };

                if (
                    password.trim()
                ) {

                    updateData.password =
                        password;

                }

                const response =
                    await fetch(
                        `${API_URL}/api/users/${editingId}`,
                        {
                            method: "PUT",
                            headers: {
                                "Content-Type":
                                    "application/json",
                            },
                            body: JSON.stringify(
                                updateData
                            ),
                        }
                    );

                const data =
                    await response.json();

                if (
                    data.success
                ) {

                    await fetchUsers();

                    showToast(
                        `User "${trimmedUsername}" updated successfully.`,
                        "success"
                    );

                    clearForm();

                } else {

                    showToast(
                        data.message ||
                            "Failed to update user.",
                        "error"
                    );

                }

            } catch (err) {

                console.error(
                    "Error updating user:",
                    err
                );

                showToast(
                    "Failed to update user.",
                    "error"
                );

            }

            return;

        }

        // ==========================================
        // ADD USER
        // ==========================================

        try {

            const response =
                await fetch(
                    `${API_URL}/api/users`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type":
                                "application/json",
                        },
                        body: JSON.stringify({
                            username:
                                trimmedUsername,
                            password,
                            role,
                        }),
                    }
                );

            const data =
                await response.json();

            if (
                data.success
            ) {

                await fetchUsers();

                showToast(
                    `User "${trimmedUsername}" added successfully.`,
                    "success"
                );

                clearForm();

            } else {

                showToast(
                    data.message ||
                        "Failed to add user.",
                    "error"
                );

            }

        } catch (err) {

            console.error(
                "Error adding user:",
                err
            );

            showToast(
                "Failed to add user.",
                "error"
            );

        }

    };

    // ==========================================
    // SUMMARY
    // ==========================================

    const totalUsers =
        users.length;

    const adminUsers =
        users.filter(
            (user) =>
                user.role === "Admin"
        ).length;

    const cashierUsers =
        users.filter(
            (user) =>
                user.role === "Cashier"
        ).length;

    // ==========================================
    // RETURN
    // ==========================================

    return (

        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

            {/* ==========================================
                TOAST
            ========================================== */}

            <Toast
                message={toast.message}
                type={toast.type}
                onClose={closeToast}
            />

            {/* ==========================================
                PAGE HEADER
            ========================================== */}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

                <div className="flex items-center gap-3">

                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center shadow-sm">

                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-5 h-5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >

                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />

                        </svg>

                    </div>

                    <div>

                        <h1 className="text-2xl font-bold text-slate-800">
                            User Management
                        </h1>

                        <p className="text-sm text-slate-500 mt-0.5">
                            Manage supermarket administrators and cashiers
                        </p>

                    </div>

                </div>

            </div>

            {/* ==========================================
                MAIN CARD
            ========================================== */}

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

                {/* ==========================================
                    FORM HEADER
                ========================================== */}

                <div className="px-5 sm:px-6 py-5 border-b border-slate-200">

                    <div className="flex items-center gap-3">

                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">

                            {editingId ? (

                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-5 h-5 text-slate-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >

                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.5-8.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 7.5-7.5z"
                                    />

                                </svg>

                            ) : (

                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-5 h-5 text-slate-600"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >

                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4v16m8-8H4"
                                    />

                                </svg>

                            )}

                        </div>

                        <div>

                            <h2 className="text-base font-semibold text-slate-800">
                                {editingId
                                    ? "Edit User"
                                    : "Add New User"}
                            </h2>

                            <p className="text-xs text-slate-500 mt-1">
                                {editingId
                                    ? "Update the selected user's details"
                                    : "Create a new supermarket user"}
                            </p>

                        </div>

                    </div>

                </div>

                {/* ==========================================
                    FORM
                ========================================== */}

                <div className="p-5 sm:p-6 bg-slate-50/70 border-b border-slate-200">

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                        {/* USERNAME */}

                        <div>

                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                Username
                            </label>

                            <input
                                type="text"
                                name="new-user-username"
                                id="new-user-username"
                                autoComplete="off"
                                data-lpignore="true"
                                data-form-type="other"
                                placeholder="Enter username"
                                value={username}
                                onChange={(e) =>
                                    setUsername(
                                        e.target.value
                                    )
                                }
                                className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition"
                            />

                        </div>

                        {/* PASSWORD */}

                        <div>

                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                Password
                            </label>

                            <input
                                type="password"
                                name="new-user-password"
                                id="new-user-password"
                                autoComplete="new-password"
                                data-lpignore="true"
                                data-form-type="other"
                                placeholder={
                                    editingId
                                        ? "New password (optional)"
                                        : "Enter password"
                                }
                                value={password}
                                onChange={(e) =>
                                    setPassword(
                                        e.target.value
                                    )
                                }
                                className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition"
                            />

                        </div>

                        {/* ROLE */}

                        <div>

                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                                Role
                            </label>

                            <select
                                value={role}
                                onChange={(e) =>
                                    setRole(
                                        e.target.value
                                    )
                                }
                                className="w-full h-10 px-3 border border-slate-300 rounded-lg bg-white text-sm text-slate-800 focus:outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 transition"
                            >

                                <option value="Admin">
                                    Admin
                                </option>

                                <option value="Cashier">
                                    Cashier
                                </option>

                            </select>

                        </div>

                        {/* BUTTONS */}

                        <div className="flex items-end gap-2">

                            <button
                                type="button"
                                onClick={saveUser}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition shadow-sm"
                            >

                                {editingId ? (

                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-3.5 h-3.5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >

                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M5 13l4 4L19 7"
                                        />

                                    </svg>

                                ) : (

                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-3.5 h-3.5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >

                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 4v16m8-8H4"
                                        />

                                    </svg>

                                )}

                                {editingId
                                    ? "Update User"
                                    : "Add User"}

                            </button>

                            {editingId && (

                                <button
                                    type="button"
                                    onClick={() => {

                                        clearForm();

                                        showToast(
                                            "Editing cancelled.",
                                            "info"
                                        );

                                    }}
                                    className="h-10 px-4 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition"
                                >
                                    Cancel
                                </button>

                            )}

                        </div>

                    </div>

                    {/* PASSWORD INFO */}

                    {editingId && (

                        <div className="mt-4 flex items-start gap-2 bg-white border border-slate-200 rounded-lg p-3">

                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-4 h-4 text-slate-500 mt-0.5 shrink-0"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >

                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 16h-1v-4h-1m1-4h.01M12 22a10 10 0 100-20 10 10 0 000 20z"
                                />

                            </svg>

                            <p className="text-xs text-slate-500">
                                Leave the password blank if you don't want to change the existing password.
                            </p>

                        </div>

                    )}

                </div>

                {/* ==========================================
                    SUMMARY CARDS
                ========================================== */}

                <div className="p-5 sm:p-6 bg-slate-50/70 border-b border-slate-200">

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                        {/* TOTAL USERS */}

                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">

                            <div className="flex items-center justify-between">

                                <div>

                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                        Total Users
                                    </p>

                                    <p className="text-2xl font-bold text-slate-800 mt-1">
                                        {totalUsers}
                                    </p>

                                    <p className="text-xs text-slate-400 mt-1">
                                        Registered system users
                                    </p>

                                </div>

                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">

                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-5 h-5 text-slate-500"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >

                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                                        />

                                    </svg>

                                </div>

                            </div>

                        </div>

                        {/* ADMINS */}

                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">

                            <div className="flex items-center justify-between">

                                <div>

                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                        Administrators
                                    </p>

                                    <p className="text-2xl font-bold text-emerald-600 mt-1">
                                        {adminUsers}
                                    </p>

                                    <p className="text-xs text-slate-400 mt-1">
                                        Users with admin access
                                    </p>

                                </div>

                                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">

                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-5 h-5 text-emerald-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >

                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 12c0 5.591 3.824 10.291 9 11.622C17.176 22.291 21 17.591 21 12c0-.988-.12-1.95-.382-2.862"
                                        />

                                    </svg>

                                </div>

                            </div>

                        </div>

                        {/* CASHIERS */}

                        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">

                            <div className="flex items-center justify-between">

                                <div>

                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                                        Cashiers
                                    </p>

                                    <p className="text-2xl font-bold text-amber-600 mt-1">
                                        {cashierUsers}
                                    </p>

                                    <p className="text-xs text-slate-400 mt-1">
                                        Users assigned to billing
                                    </p>

                                </div>

                                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">

                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-5 h-5 text-amber-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >

                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 10h18M7 15h1m4 0h1m4 0h1M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                        />

                                    </svg>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

                {/* ==========================================
                    USER LIST HEADER
                ========================================== */}

                <div className="px-5 sm:px-6 py-5 border-b border-slate-200">

                    <div>

                        <h2 className="text-base font-semibold text-slate-800">
                            User Overview
                        </h2>

                        <p className="text-xs text-slate-500 mt-1">
                            View and manage registered supermarket users
                        </p>

                    </div>

                </div>

                {/* ==========================================
                    TABLE
                ========================================== */}

                <div className="overflow-x-auto">

                    <table className="w-full min-w-[750px]">

                        <thead>

                            <tr className="bg-slate-50 border-b border-slate-200">

                                <th className="px-4 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500 w-16">
                                    #
                                </th>

                                <th className="px-5 py-3.5 text-left text-[11px] uppercase tracking-wide font-bold text-slate-500">
                                    User
                                </th>

                                <th className="px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">
                                    Role
                                </th>

                                <th className="px-5 py-3.5 text-center text-[11px] uppercase tracking-wide font-bold text-slate-500">
                                    Actions
                                </th>

                            </tr>

                        </thead>

                        <tbody className="divide-y divide-slate-100">

                            {users.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="4"
                                        className="px-5 py-14 text-center"
                                    >

                                        <div className="flex flex-col items-center">

                                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">

                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="w-6 h-6 text-slate-400"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >

                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                                                    />

                                                </svg>

                                            </div>

                                            <p className="text-sm font-semibold text-slate-600">
                                                No users found.
                                            </p>

                                            <p className="text-xs text-slate-400 mt-1">
                                                Create your first user above.
                                            </p>

                                        </div>

                                    </td>

                                </tr>

                            ) : (

                                users.map(
                                    (
                                        user,
                                        index
                                    ) => (

                                        <tr
                                            key={user.id}
                                            className="hover:bg-slate-50/80 transition"
                                        >

                                            {/* NUMBER */}

                                            <td className="px-4 py-4 text-center">

                                                <span className="text-xs font-medium text-slate-400">
                                                    {index + 1}
                                                </span>

                                            </td>

                                            {/* USER */}

                                            <td className="px-5 py-4">

                                                <div className="flex items-center gap-3">

                                                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">

                                                        <span className="text-sm font-bold text-slate-600 uppercase">
                                                            {user.username?.charAt(0)}
                                                        </span>

                                                    </div>

                                                    <div>

                                                        <p className="text-sm font-semibold text-slate-800">
                                                            {user.username}
                                                        </p>

                                                        <p className="text-xs text-slate-400 mt-0.5">
                                                            User ID: {user.id}
                                                        </p>

                                                    </div>

                                                </div>

                                            </td>

                                            {/* ROLE */}

                                            <td className="px-5 py-4 text-center">

                                                {user.role === "Admin" ? (

                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold">

                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>

                                                        Admin

                                                    </span>

                                                ) : (

                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-100 text-amber-700 text-xs font-semibold">

                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>

                                                        Cashier

                                                    </span>

                                                )}

                                            </td>

                                            {/* ACTIONS */}

                                            <td className="px-5 py-4 text-center">

                                                <div className="flex items-center justify-center gap-2">

                                                    {/* EDIT */}

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            editUser(user)
                                                        }
                                                        className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg bg-slate-100 hover:bg-slate-800 text-slate-600 hover:text-white text-xs font-semibold transition"
                                                        title="Edit User"
                                                        aria-label="Edit User"
                                                    >

                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className="w-3.5 h-3.5"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >

                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.5-8.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 7.5-7.5z"
                                                            />

                                                        </svg>

                                                        Edit

                                                    </button>

                                                    {/* DELETE */}

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            confirmDeleteUser(
                                                                user.id,
                                                                user.username
                                                            )
                                                        }
                                                        className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg bg-red-50 hover:bg-red-600 text-red-600 hover:text-white text-xs font-semibold transition"
                                                        title="Delete User"
                                                        aria-label="Delete User"
                                                    >

                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className="w-3.5 h-3.5"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            stroke="currentColor"
                                                        >

                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-8 0h10"
                                                            />

                                                        </svg>

                                                        Delete

                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    )
                                )

                            )}

                        </tbody>

                    </table>

                </div>

                {/* ==========================================
                    FOOTER
                ========================================== */}

                {users.length > 0 && (

                    <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">

                        <p className="text-xs text-slate-500">

                            Showing

                            <span className="font-semibold text-slate-700">
                                {" "}
                                {users.length}
                            </span>

                            {" "}user
                            {users.length !== 1
                                ? "s"
                                : ""}

                        </p>

                    </div>

                )}

            </div>

            {/* ==========================================
                DELETE CONFIRMATION MODAL
            ========================================== */}

            {deleteConfirm.show && (

                <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm px-4">

                    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">

                        {/* HEADER */}

                        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">

                            <div className="flex items-center gap-3">

                                <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center">

                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-5 h-5 text-red-600"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >

                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 9v2m0 4h.01M10.29 3.86l-7.82 14A2 2 0 004.21 21h15.58a2 2 0 001.74-3.14l-7.82-14a2 2 0 00-3.42 0z"
                                        />

                                    </svg>

                                </div>

                                <div>

                                    <h2 className="text-sm font-bold text-slate-800">
                                        Delete User
                                    </h2>

                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Confirm user deletion
                                    </p>

                                </div>

                            </div>

                            <button
                                type="button"
                                onClick={cancelDelete}
                                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 text-xl transition"
                                title="Close"
                            >
                                ×
                            </button>

                        </div>

                        {/* BODY */}

                        <div className="p-5">

                            <p className="text-sm text-slate-600 leading-relaxed">

                                Are you sure you want to delete{" "}

                                <span className="font-semibold text-slate-800">
                                    "{deleteConfirm.username}"
                                </span>
                                ?

                            </p>

                            <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg p-3">

                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-4 h-4 text-red-500 mt-0.5 shrink-0"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >

                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01M10.29 3.86l-7.82 14A2 2 0 004.21 21h15.58a2 2 0 001.74-3.14l-7.82-14a2 2 0 00-3.42 0z"
                                    />

                                </svg>

                                <p className="text-xs text-red-600">
                                    This action cannot be undone.
                                </p>

                            </div>

                        </div>

                        {/* FOOTER */}

                        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">

                            <button
                                type="button"
                                onClick={cancelDelete}
                                className="h-10 px-4 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={deleteUser}
                                className="inline-flex items-center gap-1.5 h-10 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold transition shadow-sm"
                            >

                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="w-3.5 h-3.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >

                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3m-8 0h10"
                                    />

                                </svg>

                                Delete User

                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

};

export default UserManagement;