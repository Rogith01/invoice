
import React, { useState } from "react";
import axios from "axios";

const Login = ({ onLogin }) => {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const loginHandler = async (e) => {

        e.preventDefault();

        try {

            const res = await axios.post(
                "https://invoice-backend-78hd.onrender.com/api/login",
                {
                    username,
                    password,
                }
            );

            if (res.data.success) {

                // Save logged-in user
                sessionStorage.setItem(
                    "user",
                    JSON.stringify(res.data.user)
                );

                // Save JWT token
                sessionStorage.setItem(
                    "token",
                    res.data.token
                );

                // Continue existing login flow
                onLogin(res.data.user);

            } else {

                alert(res.data.message);

            }

        } catch (err) {

            console.log(err);

            alert("Login Failed");

        }

    };

    return (

        <div className="min-h-screen flex items-center justify-center bg-gray-100">

            <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">

                <h1 className="text-2xl font-bold text-center mb-6">
                    AK SUPER MARKET
                </h1>

                <form onSubmit={loginHandler}>

                    <input
                        type="text"
                        placeholder="Username"
                        className="w-full border p-2 rounded mb-4"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full border p-2 rounded mb-4"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <button
                        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                        type="submit"
                    >
                        Login
                    </button>

                </form>

            </div>

        </div>

    );

};

export default Login;
