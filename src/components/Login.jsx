import React, {
    useState,
    useCallback,
    useEffect,
    useRef,
} from "react";
import axios from "axios";
import Toast from "./Toast";

const Login = ({ onLogin }) => {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    // ===============================
    // Toast State
    // ===============================

    const [toast, setToast] = useState({
        message: "",
        type: "success",
    });

    // ===============================
    // Toast Sound
    // ===============================

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

    // ===============================
    // Show Toast
    // ===============================

    const showToast = useCallback((
        message,
        type = "success"
    ) => {

        // ===============================
        // PLAY TOAST SOUND
        // ===============================

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

        // ===============================
        // SHOW TOAST
        // ===============================

        setToast({
            message,
            type,
        });

    }, []);

    // ===============================
    // Hide Toast
    // ===============================

    const hideToast = useCallback(() => {

        setToast({
            message: "",
            type: "success",
        });

    }, []);

    // ===============================
    // Login Handler
    // ===============================

    const loginHandler = async (e) => {

        e.preventDefault();

        // ===============================
        // Basic Validation
        // ===============================

        if (
            !username.trim() ||
            !password.trim()
        ) {

            showToast(
                "Please enter username and password.",
                "warning"
            );

            return;
        }

        try {

            const res = await axios.post(
                "https://invoice-backend-78hd.onrender.com/api/login",
                {
                    username,
                    password,
                }
            );

            // ===============================
            // Successful Login
            // ===============================

            if (res.data.success) {

                // ===============================
                // PLAY SUCCESS SOUND
                // ===============================

                showToast(
                    "Login successful.",
                    "success"
                );

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

                // ===============================
                // Invalid Login
                // ===============================

                showToast(
                    res.data.message ||
                        "Invalid username or password.",
                    "error"
                );
            }

        } catch (err) {

            console.log(
                "Login Error:",
                err
            );

            // ===============================
            // Backend / Network Error
            // ===============================

            if (
                err.response?.status === 401
            ) {

                showToast(
                    "Invalid username or password.",
                    "error"
                );

            } else if (
                err.response?.data?.message
            ) {

                showToast(
                    err.response.data.message,
                    "error"
                );

            } else {

                showToast(
                    "Unable to login. Please try again.",
                    "error"
                );
            }
        }
    };

    // ===============================
    // Render
    // ===============================

    return (

        <div className="min-h-screen flex items-center justify-center bg-gray-100">

            {/* =============================== */}
            {/* TOAST */}
            {/* =============================== */}

            <Toast
                message={toast.message}
                type={toast.type}
                onClose={hideToast}
            />

            {/* =============================== */}
            {/* LOGIN CARD */}
            {/* =============================== */}

            <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md">

                {/* =============================== */}
                {/* TITLE */}
                {/* =============================== */}

                <h1 className="text-2xl font-bold text-center mb-6">
                    AK SUPER MARKET
                </h1>

                {/* =============================== */}
                {/* LOGIN FORM */}
                {/* =============================== */}

                <form onSubmit={loginHandler}>

                    {/* Username */}

                    <input
                        type="text"
                        placeholder="Username"
                        className="w-full border p-2 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={username}
                        onChange={(e) =>
                            setUsername(
                                e.target.value
                            )
                        }
                    />

                    {/* Password */}

                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full border p-2 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={password}
                        onChange={(e) =>
                            setPassword(
                                e.target.value
                            )
                        }
                    />

                    {/* Login Button */}

                    <button
                        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition duration-200"
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