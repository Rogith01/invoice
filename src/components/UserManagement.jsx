import React, {useCallback,useEffect,useState} from "react";
import axios from "axios";
import Toast from "./Toast";

const API_URL =
    "https://invoice-backend-78hd.onrender.com";

const UserManagement = () => {

    const [users, setUsers] = useState([]);

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("Cashier");

    const [editingId, setEditingId] = useState(null);

    // ===============================
// Delete Confirmation
// ===============================

const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    id: null,
    username: "",
});

    // ===============================
    // Toast State
    // ===============================

    const [toast, setToast] = useState({
        message: "",
        type: "success",
    });

    // ===============================
    // Show Toast
    // ===============================

    const showToast = (
        message,
        type = "success"
    ) => {
        setToast({
            message,
            type,
        });
    };

    // ===============================
    // Close Toast
    // ===============================

    const closeToast = () => {
        setToast({
            message: "",
            type: "success",
        });
    };

    // ===============================
    // Clear Form
    // ===============================

    const clearForm = () => {

        setEditingId(null);

        setUsername("");

        setPassword("");

        setRole("Cashier");
    };


// ===============================
// Fetch Users
// ===============================

const fetchUsers = useCallback(async () => {

    try {

        const res = await axios.get(
            `${API_URL}/api/users`
        );

        if (res.data.success) {

            setUsers(
                res.data.users || []
            );

        } else {

            showToast(
                res.data.message ||
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

}, []);

    // ===============================
    // Load Users
    // ===============================

    useEffect(() => {

        fetchUsers();

    }, [fetchUsers]);

    // ===============================
    // Edit User
    // ===============================

    const editUser = (user) => {

        setEditingId(user.id);

        setUsername(
            user.username
        );

        // Do NOT load existing password
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

   // ===============================
// Open Delete Confirmation
// ===============================

const confirmDeleteUser = (id, username) => {
    setDeleteConfirm({
        show: true,
        id,
        username,
    });
};

// ===============================
// Cancel Delete
// ===============================

const cancelDelete = () => {
    setDeleteConfirm({
        show: false,
        id: null,
        username: "",
    });
};

// ===============================
// Delete User
// ===============================

const deleteUser = async () => {

    const { id, username } = deleteConfirm;

    if (!id) return;

    try {

        const res = await axios.delete(
            `${API_URL}/api/users/${id}`
        );

        if (res.data.success) {

            await fetchUsers();

            if (editingId === id) {
                clearForm();
            }

            // Close confirmation only after successful delete
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
                res.data.message ||
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
            err.response?.data?.message ||
                "Failed to delete user.",
            "error"
        );
    }
};
    // ===============================
    // Add / Update User
    // ===============================

    const saveUser = async () => {

        const trimmedUsername =
            username.trim();

        // ===============================
        // Username Validation
        // ===============================

        if (!trimmedUsername) {

            showToast(
                "Please enter a username.",
                "warning"
            );

            return;
        }

        // ===============================
        // Password Validation
        // ===============================

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

        // ===============================
        // UPDATE USER
        // ===============================

        if (editingId) {

            try {

                const updateData = {

                    username:
                        trimmedUsername,

                    role,
                };

                // Only send password
                // if a new password was entered

                if (
                    password.trim()
                ) {

                    updateData.password =
                        password;
                }

                const res =
                    await axios.put(
                        `${API_URL}/api/users/${editingId}`,
                        updateData
                    );

                if (
                    res.data.success
                ) {

                    await fetchUsers();

                    showToast(
                        `User "${trimmedUsername}" updated successfully.`,
                        "success"
                    );

                    clearForm();

                } else {

                    showToast(
                        res.data.message ||
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
                    err.response?.data
                        ?.message ||
                        "Failed to update user.",
                    "error"
                );
            }

            return;
        }

        // ===============================
        // ADD NEW USER
        // ===============================

        try {

            const res =
                await axios.post(
                    `${API_URL}/api/users`,
                    {
                        username:
                            trimmedUsername,

                        password,

                        role,
                    }
                );

            if (
                res.data.success
            ) {

                await fetchUsers();

                showToast(
                    `User "${trimmedUsername}" added successfully.`,
                    "success"
                );

                clearForm();

            } else {

                showToast(
                    res.data.message ||
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
                err.response?.data
                    ?.message ||
                    "Failed to add user.",
                "error"
            );
        }
    };


    // ===============================
    // Render
    // ===============================

    return (

        <div className="max-w-6xl mx-auto mt-8 mb-10 px-4">

            <div className="bg-white shadow-xl rounded-2xl overflow-hidden">

                {/* ================================= */}
                {/* HEADER */}
                {/* ================================= */}

                <div className="px-6 py-7 border-b">

                    <div>

                        <h1 className="text-3xl font-bold text-gray-800">
                            User Management
                        </h1>

                        <p className="text-gray-500 mt-1">
                            Manage supermarket administrators and cashiers
                        </p>

                    </div>

                </div>

                {/* ================================= */}
                {/* CONTENT */}
                {/* ================================= */}

                <div className="p-6">

                    {/* ================================= */}
                    {/* TOAST */}
                    {/* ================================= */}

                    <Toast
                        message={
                            toast.message
                        }
                        type={
                            toast.type
                        }
                        onClose={
                            closeToast
                        }
                    />
                    {/* ================================= */}
{/* DELETE CONFIRMATION MODAL */}
{/* ================================= */}

{deleteConfirm.show && (

    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">

        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">

            {/* ICON */}

            <div className="flex justify-center mb-4">

                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-red-100">

                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-8 w-8 text-red-600"
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

            </div>

            {/* TITLE */}

            <h2 className="text-xl font-bold text-gray-800 text-center">

                Delete User?

            </h2>

            {/* MESSAGE */}

            <p className="text-gray-500 text-center mt-2">

                Are you sure you want to delete

                <span className="font-bold text-gray-800">

                    {" "}
                    "{deleteConfirm.username}"

                </span>

                ?

            </p>

            <p className="text-sm text-red-500 text-center mt-2">

                This action cannot be undone.

            </p>

            {/* BUTTONS */}

            <div className="flex gap-3 mt-6">

                <button
                    type="button"
                    onClick={cancelDelete}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-lg transition"
                >

                    Cancel

                </button>

                <button
                    type="button"
                    onClick={deleteUser}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-lg transition"
                >

                    Delete

                </button>

            </div>

        </div>

    </div>

)}

                    {/* ================================= */}
                    {/* ADD / UPDATE USER */}
                    {/* ================================= */}

                    <div
                        className={`border rounded-2xl p-6 mb-8 transition ${
                            editingId
                                ? "bg-blue-50 border-blue-200"
                                : "bg-gray-50 border-gray-200"
                        }`}
                    >

                        <div className="flex items-center gap-3 mb-5">

                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    editingId
                                        ? "bg-blue-600"
                                        : "bg-green-600"
                                }`}
                            >

                                <span className="text-white text-lg">

                                    {editingId
                                        ? "✏️"
                                        : "➕"}

                                </span>

                            </div>

                            <div>

                                <h2 className="text-xl font-bold text-gray-800">

                                    {editingId
                                        ? "Edit User"
                                        : "Add New User"}

                                </h2>

                                <p className="text-sm text-gray-500">

                                    {editingId
                                        ? "Update the selected user's details"
                                        : "Create a new supermarket user"}

                                </p>

                            </div>

                        </div>

                        {/* ================================= */}
                        {/* FORM */}
                        {/* ================================= */}

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                            {/* USERNAME */}

                            <div>

                                <label className="block text-sm font-semibold text-gray-700 mb-1">
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
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />

                            </div>

                            {/* PASSWORD */}

                            <div>

                                <label className="block text-sm font-semibold text-gray-700 mb-1">
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
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />

                            </div>

                            {/* ROLE */}

                            <div>

                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Role
                                </label>

                                <select
                                    value={role}
                                    onChange={(e) =>
                                        setRole(
                                            e.target.value
                                        )
                                    }
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >

                                    <option value="Admin">
                                        👑 Admin
                                    </option>

                                    <option value="Cashier">
                                        💼 Cashier
                                    </option>

                                </select>

                            </div>

                            {/* BUTTONS */}

                            <div className="flex items-end gap-2">

                                <button
                                    type="button"
                                    onClick={saveUser}
                                    className={`flex-1 text-white rounded-lg px-4 py-2.5 font-semibold shadow-sm transition ${
                                        editingId
                                            ? "bg-blue-600 hover:bg-blue-700"
                                            : "bg-green-600 hover:bg-green-700"
                                    }`}
                                >

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
                                        className="bg-gray-500 hover:bg-gray-600 text-white rounded-lg px-4 py-2.5 font-semibold transition"
                                    >

                                        Cancel

                                    </button>

                                )}

                            </div>

                        </div>

                        {/* PASSWORD INFO */}

                        {editingId && (

                            <div className="mt-4 flex items-start gap-2 bg-white border border-blue-200 rounded-lg p-3">

                                <span className="text-blue-600">
                                    ℹ️
                                </span>

                                <p className="text-sm text-gray-600">

                                    Leave the password blank if you don't want to change the existing password.

                                </p>

                            </div>

                        )}

                    </div>

                    {/* ================================= */}
                    {/* SEARCH */}
                    {/* ================================= */}

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">

                        <div>

                            <h2 className="text-xl font-bold text-gray-800">
                                All Users
                            </h2>

                            <p className="text-sm text-gray-500 mt-1">
                                View and manage registered users
                            </p>

                        </div>

 

                    </div>

                    {/* ================================= */}
                    {/* TABLE */}
                    {/* ================================= */}

                    <div className="overflow-x-auto border border-gray-300 rounded-xl">

                        <table className="w-full border-collapse">

                            <thead className="bg-gray-100">

                                <tr>

                                    <th className="border border-gray-300 p-4 text-center text-sm font-bold text-gray-700">
                                        Username
                                    </th>

                                    <th className="border border-gray-300 p-4 text-center text-sm font-bold text-gray-700">
                                        Role
                                    </th>

                                    <th className="border border-gray-300 p-4 text-center text-sm font-bold text-gray-700">
                                        Actions
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {users.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan="3"
                                            className="border border-gray-300 p-10 text-center"
                                        >

                                            <div className="flex flex-col items-center">

                                                <div className="text-5xl mb-3 ">
                                                    👤
                                                </div>

                                                <p className="font-semibold text-gray-700">

                                                   No users found.

                                                </p>

                                                <p className="text-sm text-gray-500 mt-1">

                                                    Create your first user above.

                                                </p>

                                            </div>

                                        </td>

                                    </tr>

                                ) : (

                                    users.map(
                                        (user) => (

                                            <tr
                                                key={user.id}
                                                className="hover:bg-blue-50/50 transition"
                                            >

                                                {/* USERNAME */}

                                                <td className="border border-gray-300 p-4 text-center">

                                                    <div className="flex items-center gap-3 justify-center">

                                                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold uppercase">

                                                            {user.username
                                                                ?.charAt(
                                                                    0
                                                                )}

                                                        </div>

                                                        <div>

                                                            <p className="font-semibold text-gray-800 text-center">

                                                                {
                                                                    user.username
                                                                }

                                                            </p>

                                                            <p className="text-xs text-gray-400 text-center">

                                                                User ID:{" "}

                                                                {
                                                                    user.id
                                                                }

                                                            </p>

                                                        </div>

                                                    </div>

                                                </td>

                                                {/* ROLE */}

                                                <td className="border border-gray-300 p-4 text-center">

                                                    <span
                                                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold ${
                                                            user.role ===
                                                            "Admin"
                                                                ? "bg-purple-100 text-purple-700"
                                                                : "bg-blue-100 text-blue-700"
                                                        }`}
                                                    >

                                                        {user.role ===
                                                        "Admin"
                                                            ? "👑 Admin"
                                                            : "💼 Cashier"}

                                                    </span>

                                                </td>

                                                {/* ACTIONS */}

                                                <td className="border border-gray-300 p-4">

                                                    <div className="flex justify-center gap-3">

                                                        {/* EDIT */}

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                editUser(
                                                                    user
                                                                )
                                                            }
                                                            className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition transform hover:scale-105 flex items-center justify-center"
                                                            title="Edit User"
                                                            aria-label="Edit User"
                                                        >

                                                            ✏️

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
                                                            className="w-10 h-10 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition transform hover:scale-105 flex items-center justify-center"
                                                            title="Delete User"
                                                            aria-label="Delete User"
                                                        >

                                                            🗑️

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

                </div>

            </div>

        </div>

    );
};

export default UserManagement;