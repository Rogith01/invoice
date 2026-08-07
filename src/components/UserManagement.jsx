import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const UserManagement = () => {

    const navigate = useNavigate();

    const [users, setUsers] = useState([]);

    const [username, setUsername] = useState("");

    const [password, setPassword] = useState("");

    const [role, setRole] = useState("Cashier");

    const [editingId, setEditingId] = useState(null);

    // ===============================
    // Fetch Users
    // ===============================
    const fetchUsers = async () => {

        try {

            const res = await axios.get(
                "https://invoice-backend-78hd.onrender.com/api/users"
            );

            if (res.data.success) {
                setUsers(res.data.users);
            }

        } catch (err) {

            console.log(err);

        }

    };
    // ===============================
// Edit User
// ===============================
const editUser = (user) => {

    setEditingId(user.id);

    setUsername(user.username);

    setPassword(user.password);

    setRole(user.role);

};
// ===============================
// Delete User
// ===============================
const deleteUser = async (id, username) => {

    const confirmDelete = window.confirm(
        `Delete "${username}" ?`
    );

    if (!confirmDelete) return;

    try {

        const res = await axios.delete(
            `https://invoice-backend-78hd.onrender.com/api/users/${id}`
        );

        if (res.data.success) {

            fetchUsers();

        }

    } catch (err) {

        console.log(err);

    }

};

    // ===============================
    // Load Users
    // ===============================
    useEffect(() => {

        fetchUsers();

    }, []);

    // ===============================
    // Add / Update User
    // ===============================
    const saveUser = async () => {

        if (!username.trim() || !password.trim()) {
            alert("Please enter Username and Password");
            return;
        }

        // UPDATE
        if (editingId) {

            try {

                const res = await axios.put(
                    `https://invoice-backend-78hd.onrender.com/api/users/${editingId}`,
                    {
                        username,
                        password,
                        role
                    }
                );

                if (res.data.success) {

                    fetchUsers();

                    setEditingId(null);

                    setUsername("");

                    setPassword("");

                    setRole("Cashier");

                }

            } catch (err) {

                console.log(err);

            }

            return;

        }

        // ADD NEW USER
        try {

            const res = await axios.post(
                "https://invoice-backend-78hd.onrender.com/api/users",
                {
                    username,
                    password,
                    role
                }
            );

            if (res.data.success) {

                fetchUsers();

                setUsername("");

                setPassword("");

                setRole("Cashier");

            }

        } catch (err) {

            console.log(err);

        }

    };

    return (

        <div className="max-w-6xl mx-auto mt-8 bg-white shadow-lg rounded-lg p-6">

            <div className="flex justify-between items-center mb-8">

                <h1 className="text-3xl font-bold">
                    User Management
                </h1>


            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">

                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="border rounded px-3 py-2"
                />

                <input
                    type="text"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border rounded px-3 py-2"
                />

                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="border rounded px-3 py-2"
                >
                    <option value="Admin">Admin</option>
                    <option value="Cashier">Cashier</option>
                </select>

<div className="flex gap-2">

    <button
        onClick={saveUser}
        className="bg-green-600 hover:bg-green-700 text-white rounded px-4 py-2"
    >
        {editingId ? "Update User" : "Add User"}
    </button>

    {editingId && (
        <button
            onClick={() => {

                setEditingId(null);

                setUsername("");

                setPassword("");

                setRole("Cashier");

            }}
            className="bg-gray-500 hover:bg-gray-600 text-white rounded px-4 py-2"
        >
            Cancel
        </button>
    )}

</div>

          </div>

        {/* Users Table */}

        <table className="w-full border mt-6">

            <thead className="bg-gray-100">

                <tr>

                        <th className="border p-2">Username</th>

                        <th className="border p-2">Role</th>

                        <th className="border p-2">Action</th>
                </tr>

            </thead>

            <tbody>

                {users.map((user) => (

<tr key={user.id}>

    <td className="border p-2 text-center">
        {user.username}
    </td>

    <td className="border p-2 text-center">
        {user.role}
    </td>

    <td className="border p-2">

        <div className="flex justify-center gap-3">

            {/* Edit */}

            <button
                onClick={() => editUser(user)}
                className="text-blue-600 hover:text-blue-800"
                title="Edit User"
            >
                ✏️
            </button>

            {/* Delete */}

            <button
                onClick={() => deleteUser(user.id, user.username)}
                className="text-red-600 hover:text-red-800"
                title="Delete User"
            >
                🗑
            </button>

        </div>

    </td>

</tr>

                ))}

            </tbody>

        </table>

    </div>

);

 

};

export default UserManagement;