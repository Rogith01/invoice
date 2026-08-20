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
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [toast, setToast] = useState({
        message: "",
        type: "success",
    });

    const successSoundRef = useRef(null);
    const errorSoundRef = useRef(null);

    // ==================================================
    // SOUND
    // ==================================================

    useEffect(() => {

        successSoundRef.current =
            new Audio("/success-tone.mp3");

        errorSoundRef.current =
            new Audio("/error-tone.mp3");

        successSoundRef.current.volume = 1;
        errorSoundRef.current.volume = 1;

        return () => {
            successSoundRef.current = null;
            errorSoundRef.current = null;
        };

    }, []);

    // ==================================================
    // TOAST
    // ==================================================

    const showToast = useCallback(
        (message, type = "success") => {

            if (type === "success") {

                if (successSoundRef.current) {

                    successSoundRef.current.currentTime = 0;

                    successSoundRef.current
                        .play()
                        .catch(() => {});
                }

            } else {

                if (errorSoundRef.current) {

                    errorSoundRef.current.currentTime = 0;

                    errorSoundRef.current
                        .play()
                        .catch(() => {});
                }
            }

            setToast({
                message,
                type,
            });
        },
        []
    );

    const hideToast = useCallback(() => {

        setToast({
            message: "",
            type: "success",
        });

    }, []);

    // ==================================================
    // LOGIN
    // ==================================================

    const loginHandler = async (e) => {

        e.preventDefault();

        if (!username.trim() || !password.trim()) {

            showToast(
                "Please enter username and password.",
                "warning"
            );

            return;
        }

        try {

            setIsLoading(true);

            const res = await axios.post(
                "https://invoice-backend-78hd.onrender.com/api/login",
                {
                    username,
                    password,
                }
            );

            if (res.data.success) {

                showToast(
                    "Login successful.",
                    "success"
                );

                sessionStorage.setItem(
                    "user",
                    JSON.stringify(res.data.user)
                );

                sessionStorage.setItem(
                    "token",
                    res.data.token
                );

                onLogin(res.data.user);

            } else {

                showToast(
                    res.data.message ||
                        "Invalid username or password.",
                    "error"
                );
            }

        } catch (err) {

            console.error("Login Error:", err);

            if (
                err.response &&
                err.response.status === 401
            ) {

                showToast(
                    "Invalid username or password.",
                    "error"
                );

            } else if (
                err.response &&
                err.response.data &&
                err.response.data.message
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

        } finally {

            setIsLoading(false);

        }
    };

    // ==================================================
    // UI
    // ==================================================

    return (

        <div className="min-h-screen bg-white flex">

            {/* ==================================================
                LEFT BRAND SECTION
            ================================================== */}

            <div className="
                hidden
                lg:flex
                lg:w-1/2
                bg-slate-900
                text-white
                relative
                overflow-hidden
            ">

                {/* BLUE GLOW */}

                <div className="
                    absolute
                    -top-40
                    -right-40
                    w-96
                    h-96
                    bg-blue-600
                    rounded-full
                    opacity-20
                    blur-3xl
                " />

                <div className="
                    absolute
                    -bottom-40
                    -left-40
                    w-96
                    h-96
                    bg-blue-500
                    rounded-full
                    opacity-10
                    blur-3xl
                " />

                <div className="
                    relative
                    z-10
                    w-full
                    flex
                    flex-col
                    justify-between
                    p-14
                ">

                    {/* BRAND */}

                    <div>

                        <div className="
                            flex
                            items-center
                            gap-3
                        ">

                            <div className="
                                w-11
                                h-11
                                rounded-lg
                                bg-blue-600
                                flex
                                items-center
                                justify-center
                                shadow-lg
                            ">

                                <span className="text-xl">
                                    🛒
                                </span>

                            </div>

                            <div>

                                <h1 className="
                                    text-lg
                                    font-bold
                                    tracking-wide
                                ">
                                    AK SUPER MARKET
                                </h1>

                                <p className="
                                    text-xs
                                    text-slate-400
                                ">
                                    Point of Sale System
                                </p>

                            </div>

                        </div>

                    </div>


                    {/* MAIN CONTENT */}

                    <div className="max-w-lg">

                        <div className="
                            flex
                            items-center
                            gap-2
                            mb-6
                        ">

                            <span className="
                                w-2
                                h-2
                                rounded-full
                                bg-green-500
                                animate-pulse
                            " />

                            <span className="
                                text-xs
                                text-green-400
                                font-medium
                            ">
                                System Online
                            </span>

                        </div>


                        <h2 className="
                            text-4xl
                            xl:text-5xl
                            font-bold
                            leading-tight
                        ">

                            Simple billing.
                            <br />

                            Smarter retail.

                        </h2>


                        <p className="
                            mt-6
                            text-slate-400
                            leading-7
                            max-w-md
                        ">

                            Manage billing, cash registers,
                            inventory and daily store operations
                            from one simple POS system.

                        </p>


                        {/* FEATURES */}

                        <div className="
                            flex
                            gap-8
                            mt-10
                        ">

                            <div>

                                <p className="
                                    text-2xl
                                    font-bold
                                ">
                                    Fast
                                </p>

                                <p className="
                                    text-xs
                                    text-slate-500
                                    mt-1
                                ">
                                    Billing
                                </p>

                            </div>


                            <div className="
                                w-px
                                bg-slate-700
                            " />


                            <div>

                                <p className="
                                    text-2xl
                                    font-bold
                                ">
                                    Secure
                                </p>

                                <p className="
                                    text-xs
                                    text-slate-500
                                    mt-1
                                ">
                                    Access
                                </p>

                            </div>


                            <div className="
                                w-px
                                bg-slate-700
                            " />


                            <div>

                                <p className="
                                    text-2xl
                                    font-bold
                                ">
                                    Easy
                                </p>

                                <p className="
                                    text-xs
                                    text-slate-500
                                    mt-1
                                ">
                                    Management
                                </p>

                            </div>

                        </div>

                    </div>


                    {/* FOOTER */}

                    <p className="
                        text-xs
                        text-slate-600
                    ">
                        © {new Date().getFullYear()} AK SUPER MARKET
                    </p>

                </div>

            </div>


            {/* ==================================================
                RIGHT LOGIN SECTION
            ================================================== */}

            <div className="
                w-full
                lg:w-1/2
                flex
                items-center
                justify-center
                px-6
                sm:px-10
            ">

                <div className="
                    w-full
                    max-w-sm
                ">


                    {/* MOBILE BRAND */}

                    <div className="
                        lg:hidden
                        mb-10
                    ">

                        <div className="
                            flex
                            items-center
                            gap-3
                        ">

                            <div className="
                                w-11
                                h-11
                                rounded-lg
                                bg-blue-600
                                text-white
                                flex
                                items-center
                                justify-center
                            ">

                                🛒

                            </div>

                            <div>

                                <h1 className="
                                    font-bold
                                    text-slate-800
                                ">
                                    AK SUPER MARKET
                                </h1>

                                <p className="
                                    text-xs
                                    text-slate-400
                                ">
                                    Point of Sale System
                                </p>

                            </div>

                        </div>

                    </div>


                    {/* LOGIN HEADER */}

                    <div className="mb-8">




                        <h2 className="
                            text-3xl
                            font-bold
                            text-slate-900
                        ">
                            Welcome back
                        </h2>


                        <p className="
                            text-sm
                            text-slate-500
                            mt-2
                        ">
                            Sign in to access your POS dashboard.
                        </p>

                    </div>


                    {/* ==================================================
                        LOGIN FORM
                    ================================================== */}

                    <form
                        onSubmit={loginHandler}
                        className="space-y-5"
                    >


                        {/* ==================================================
                            USERNAME
                        ================================================== */}

                        <div>



                            <div className="
                                relative
                                group
                            ">

                                {/* USER ICON */}

                                <div className="
                                    absolute
                                    left-3.5
                                    top-1/2
                                    -translate-y-1/2
                                    text-slate-400
                                    transition-colors
                                    duration-200
                                    group-focus-within:text-blue-600
                                ">

                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-5 h-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                    >

                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                                        />

                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M4.5 20.25a7.5 7.5 0 0115 0"
                                        />

                                    </svg>

                                </div>


                                {/* USERNAME INPUT */}

                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) =>
                                        setUsername(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter username"
                                    autoComplete="username"
                                    className="
                                        w-full
                                        h-12
                                        pl-11
                                        pr-4
                                        rounded-xl
                                        border
                                        border-slate-200
                                        bg-slate-50
                                        text-slate-800
                                        text-sm
                                        placeholder:text-slate-400
                                        outline-none
                                        transition-all
                                        duration-200
                                        hover:border-slate-300
                                        focus:bg-white
                                        focus:border-blue-500
                                        focus:ring-4
                                        focus:ring-blue-500/10
                                    "
                                />

                            </div>

                        </div>


                        {/* ==================================================
                            PASSWORD
                        ================================================== */}

                        <div>



                            <div className="
                                relative
                                group
                            ">

                                {/* LOCK ICON */}

                                <div className="
                                    absolute
                                    left-3.5
                                    top-1/2
                                    -translate-y-1/2
                                    text-slate-400
                                    transition-colors
                                    duration-200
                                    group-focus-within:text-blue-600
                                ">

                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-5 h-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                    >

                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M16.5 10.5V7.75a4.5 4.5 0 00-9 0v2.75"
                                        />

                                        <rect
                                            x="4.5"
                                            y="10.5"
                                            width="15"
                                            height="10"
                                            rx="2"
                                        />

                                    </svg>

                                </div>


                                {/* PASSWORD INPUT */}

                                <input
                                    type={
                                        showPassword
                                            ? "text"
                                            : "password"
                                    }
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(
                                            e.target.value
                                        )
                                    }
                                    placeholder="Enter password"
                                    autoComplete="current-password"
                                    className="
                                        w-full
                                        h-12
                                        pl-11
                                        pr-16
                                        rounded-xl
                                        border
                                        border-slate-200
                                        bg-slate-50
                                        text-slate-800
                                        text-sm
                                        placeholder:text-slate-400
                                        outline-none
                                        transition-all
                                        duration-200
                                        hover:border-slate-300
                                        focus:bg-white
                                        focus:border-blue-500
                                        focus:ring-4
                                        focus:ring-blue-500/10
                                    "
                                />


                                {/* SHOW / HIDE */}

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(
                                            (prev) => !prev
                                        )
                                    }
                                    className="
                                        absolute
                                        right-2
                                        top-1/2
                                        -translate-y-1/2
                                        h-9
                                        px-3
                                        rounded-lg
                                        text-xs
                                        font-semibold
                                        text-slate-400
                                        hover:text-blue-600
                                        hover:bg-blue-50
                                        transition-all
                                        duration-200
                                    "
                                >

                                    {showPassword
                                        ? "Hide"
                                        : "Show"}

                                </button>

                            </div>

                        </div>


                        {/* ==================================================
                            SIGN IN
                        ================================================== */}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="
                                w-full
                                h-12
                                rounded-xl
                                bg-blue-600
                                hover:bg-blue-700
                                active:bg-blue-800
                                text-white
                                font-semibold
                                text-sm
                                shadow-sm
                                shadow-blue-600/20
                                transition-all
                                duration-200
                                flex
                                items-center
                                justify-center
                                gap-2
                                disabled:opacity-60
                                disabled:cursor-not-allowed
                            "
                        >

                            {isLoading ? (

                                <>

                                    <span className="
                                        w-4
                                        h-4
                                        border-2
                                        border-white/30
                                        border-t-white
                                        rounded-full
                                        animate-spin
                                    " />

                                    Signing in...

                                </>

                            ) : (

                                <>

                                    Sign In

                                    <span className="
                                        text-base
                                    ">
                                        →
                                    </span>

                                </>

                            )}

                        </button>

                    </form>


                    {/* ==================================================
                        SECURITY
                    ================================================== */}

                    <div className="
                        mt-8
                        flex
                        items-center
                        justify-center
                        gap-2
                        text-xs
                        text-slate-400
                    ">

                        <span>
                            🔒
                        </span>

                        Secure POS Login

                    </div>

                </div>

            </div>


            {/* ==================================================
                TOAST
            ================================================== */}

            <Toast
                message={toast.message}
                type={toast.type}
                onClose={hideToast}
            />

        </div>
    );
};

export default Login;