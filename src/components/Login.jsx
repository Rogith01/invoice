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
        localStorage.setItem("user", JSON.stringify(res.data.user));

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
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <form
        onSubmit={loginHandler}
        className="bg-white p-8 rounded shadow-md w-96"
      >
        <h1 className="text-3xl font-bold text-center mb-6">
          AK SUPER MARKET
        </h1>

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
  );
};

export default Login;