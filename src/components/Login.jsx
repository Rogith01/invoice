import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";

import axios from "axios";
import Toast from "./Toast";

const API_URL =
  "https://invoice-backend-78hd.onrender.com";

const Login = ({ onLogin }) => {

  // ==================================================
  // LOGIN STATE
  // ==================================================

  const [storeCode, setStoreCode] = useState("");
  const [storeName, setStoreName] = useState("");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(false);

  const [storeLoading, setStoreLoading] =
    useState(false);

  const [mounted, setMounted] =
    useState(false);

  const [toast, setToast] = useState({
    message: "",
    type: "success",
  });

  const successSoundRef =
    useRef(null);

  const errorSoundRef =
    useRef(null);

  // ==================================================
  // MOUNT ANIMATION
  // ==================================================

  useEffect(() => {

    const timer = setTimeout(() => {

      setMounted(true);

    }, 50);

    return () => {

      clearTimeout(timer);

    };

  }, []);

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
    (
      message,
      type = "success"
    ) => {

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
  // FIND STORE BY STORE CODE
  // ==================================================

  const findStore = async (code) => {

    const trimmedCode =
      code.trim();

    if (!trimmedCode) {

      setStoreName("");

      return;

    }

    try {

      setStoreLoading(true);

      const res =
        await axios.get(
          `${API_URL}/api/store/${encodeURIComponent(
            trimmedCode
          )}`
        );

      if (
        res.data &&
        res.data.success &&
        res.data.store
      ) {

        setStoreName(
          res.data.store.store_name
        );

      } else {

        setStoreName("");

      }

    } catch (error) {

      console.error(
        "Store Lookup Error:",
        error
      );

      setStoreName("");

    } finally {

      setStoreLoading(false);

    }

  };

  // ==================================================
  // STORE CODE CHANGE
  // ==================================================

  const handleStoreCodeChange = (e) => {

    const value =
      e.target.value.toUpperCase();

    setStoreCode(value);

    // Clear old store name
    // when user changes code

    setStoreName("");

  };

  // ==================================================
  // LOGIN
  // ==================================================

  const loginHandler = async (e) => {

    e.preventDefault();

    // ==================================================
    // VALIDATION
    // ==================================================

    if (
      !storeCode.trim() ||
      !username.trim() ||
      !password.trim()
    ) {

      showToast(
        "Please enter store code, username and password.",
        "warning"
      );

      return;

    }

    try {

      setIsLoading(true);

      // ==================================================
      // LOGIN API
      // ==================================================

      const res =
        await axios.post(
          `${API_URL}/api/login`,
          {
            storeCode:
              storeCode.trim(),

            username:
              username.trim(),

            password,
          }
        );

      // ==================================================
      // LOGIN SUCCESS
      // ==================================================

      if (res.data.success) {

        showToast(
          "Login successful.",
          "success"
        );

        // ==================================================
        // SAVE USER
        // ==================================================

        sessionStorage.setItem(
          "user",
          JSON.stringify(
            res.data.user
          )
        );

        // ==================================================
        // SAVE JWT TOKEN
        // ==================================================

        sessionStorage.setItem(
          "token",
          res.data.token
        );

        // ==================================================
        // SAVE STORE INFORMATION
        // ==================================================

        sessionStorage.setItem(
          "store",
          JSON.stringify(
            res.data.store
          )
        );

        // ==================================================
        // SAVE STORE NAME
        // ==================================================

        if (
          res.data.store &&
          res.data.store.store_name
        ) {

          setStoreName(
            res.data.store.store_name
          );

        }

        // ==================================================
        // CONTINUE LOGIN
        // ==================================================

        onLogin(
          res.data.user
        );

      } else {

        showToast(
          res.data.message ||
            "Invalid store code, username or password.",
          "error"
        );

      }

    } catch (err) {

      console.error(
        "Login Error:",
        err
      );

      // ==================================================
      // INVALID LOGIN
      // ==================================================

      if (
        err.response &&
        err.response.status === 401
      ) {

        showToast(
          err.response.data?.message ||
            "Invalid store code, username or password.",
          "error"
        );

      }

      // ==================================================
      // SERVER ERROR
      // ==================================================

      else if (
        err.response &&
        err.response.data &&
        err.response.data.message
      ) {

        showToast(
          err.response.data.message,
          "error"
        );

      }

      // ==================================================
      // CONNECTION ERROR
      // ==================================================

      else {

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

    <div className="min-h-screen bg-white flex overflow-hidden">

      <style>{`

        @keyframes floatOrb1 {

          0%, 100% {
            transform: translate(0, 0) scale(1);
          }

          50% {
            transform: translate(30px, 40px) scale(1.08);
          }

        }

        @keyframes floatOrb2 {

          0%, 100% {
            transform: translate(0, 0) scale(1);
          }

          50% {
            transform: translate(-25px, -30px) scale(1.05);
          }

        }

        @keyframes fadeInUp {

          from {
            opacity: 0;
            transform: translateY(16px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }

        }

        @keyframes shine {

          from {
            transform: translateX(-120%) skewX(-15deg);
          }

          to {
            transform: translateX(220%) skewX(-15deg);
          }

        }

        .orb-1 {
          animation:
            floatOrb1
            9s
            ease-in-out
            infinite;
        }

        .orb-2 {
          animation:
            floatOrb2
            11s
            ease-in-out
            infinite;
        }

        .fade-up {
          animation:
            fadeInUp
            0.6s
            ease
            forwards;

          opacity: 0;
        }

        .btn-shine::after {

          content: "";

          position: absolute;

          top: 0;
          left: 0;

          width: 40%;
          height: 100%;

          background:
            linear-gradient(
              120deg,
              transparent,
              rgba(255, 255, 255, 0.35),
              transparent
            );

          transform:
            translateX(-120%)
            skewX(-15deg);

        }

        .btn-shine:hover::after {

          animation:
            shine
            0.9s
            ease;

        }

      `}</style>

      {/* ==================================================
          LEFT BRAND SECTION
      ================================================== */}

      <div
        className="
          hidden
          lg:flex
          lg:w-1/2
          bg-slate-900
          text-white
          relative
          overflow-hidden
        "
      >

        {/* GLOWING ORBS */}

        <div
          className="
            orb-1
            absolute
            -top-40
            -right-40
            w-96
            h-96
            bg-blue-600
            rounded-full
            opacity-20
            blur-3xl
          "
        />

        <div
          className="
            orb-2
            absolute
            -bottom-40
            -left-40
            w-96
            h-96
            bg-blue-500
            rounded-full
            opacity-10
            blur-3xl
          "
        />

        {/* GRID */}

        <div
          className="
            absolute
            inset-0
            opacity-[0.04]
          "
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize:
              "40px 40px",
          }}
        />

        <div
          className="
            relative
            z-10
            w-full
            flex
            flex-col
            justify-between
            p-14
          "
        >

          {/* ==================================================
              BRAND
          ================================================== */}

          <div
            className="fade-up"
            style={{
              animationDelay:
                "0.05s",
            }}
          >

            <div className="flex items-center gap-3">

              <div
                className="
                  w-11
                  h-11
                  rounded-lg
                  bg-slate-900
                  flex
                  items-center
                  justify-center
                  shadow-lg
                  shadow-slate-600/30
                "
              >

                <span className="text-xl">
                  🛒
                </span>

              </div>

              <div>

<h1
  className="
    text-lg
    font-bold
    tracking-wide
  "
>
  {storeName || "POS SYSTEM"}
</h1>

<p className="text-xs text-slate-400">
  Powered by{" "}
  <span className="font-semibold text-slate-300">
    BILLQORA
  </span>
</p>

              </div>

            </div>

          </div>

          {/* ==================================================
              MAIN CONTENT
          ================================================== */}

          <div className="max-w-lg">

            <div
              className="
                flex
                items-center
                gap-2
                mb-6
                fade-up
              "
              style={{
                animationDelay:
                  "0.15s",
              }}
            >

              <span
                className="
                  w-2
                  h-2
                  rounded-full
                  bg-green-500
                  animate-pulse
                "
              />

              <span
                className="
                  text-xs
                  text-green-400
                  font-medium
                "
              >

                System Online

              </span>

            </div>

            <h2
              className="
                text-4xl
                xl:text-5xl
                font-bold
                leading-tight
                fade-up
              "
              style={{
                animationDelay:
                  "0.25s",
              }}
            >

              Simple billing.
              <br />
              Smarter retail.

            </h2>

            <p
              className="
                mt-6
                text-slate-400
                leading-7
                max-w-md
                fade-up
              "
              style={{
                animationDelay:
                  "0.35s",
              }}
            >

              Manage billing, cash registers,
              inventory and daily store
              operations from one simple POS
              system.

            </p>

            {/* FEATURES */}

            <div
              className="
                flex
                gap-8
                mt-10
                fade-up
              "
              style={{
                animationDelay:
                  "0.45s",
              }}
            >

              <div>

                <p className="text-2xl font-bold">
                  Fast
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  Billing
                </p>

              </div>

              <div className="w-px bg-slate-700" />

              <div>

                <p className="text-2xl font-bold">
                  Secure
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  Access
                </p>

              </div>

              <div className="w-px bg-slate-700" />

              <div>

                <p className="text-2xl font-bold">
                  Easy
                </p>

                <p className="text-xs text-slate-500 mt-1">
                  Management
                </p>

              </div>

            </div>

          </div>

          {/* FOOTER */}

          <p className="text-xs text-slate-600">

            © {new Date().getFullYear()}
            {" "}
            {storeName ||
              "POS SYSTEM"}

          </p>

        </div>

      </div>

      {/* ==================================================
          RIGHT LOGIN SECTION
      ================================================== */}

      <div
        className="
          w-full
          lg:w-1/2
          flex
          items-center
          justify-center
          px-6
          sm:px-10
        "
      >

        <div
          className="
            w-full
            max-w-sm
            transition-all
            duration-700
            ease-out
          "
          style={{
            opacity:
              mounted ? 1 : 0,

            transform:
              mounted
                ? "translateY(0)"
                : "translateY(16px)",
          }}
        >

          {/* ==================================================
              MOBILE BRAND
          ================================================== */}

          <div className="lg:hidden mb-10">

            <div className="flex items-center gap-3">

              <div
                className="
                  w-11
                  h-11
                  rounded-lg
                  bg-slate-900
                  text-white
                  flex
                  items-center
                  justify-center
                "
              >

                🛒

              </div>

              <div>

                <h1
                  className="
                    font-bold
                    text-slate-800
                  "
                >

                  {storeName ||
                    "POS SYSTEM"}

                </h1>

<p className="text-xs text-slate-400">
  Powered by{" "}
  <span className="font-semibold text-slate-300">
    BILLQORA
  </span>
</p>

              </div>

            </div>

          </div>

          {/* ==================================================
              LOGIN HEADER
          ================================================== */}

          <div className="mb-8">

            <h2
              className="
                text-3xl
                font-bold
                text-slate-900
              "
            >

              Welcome back

            </h2>

            <p
              className="
                text-sm
                text-slate-500
                mt-2
              "
            >

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
                STORE CODE
            ================================================== */}

            <div>

              <label
                className="
                  block
                  text-xs
                  font-semibold
                  text-slate-600
                  mb-1.5
                "
              >

                Store Code

              </label>

              <div className="relative group">

                <div
                  className="
                    absolute
                    left-3.5
                    top-1/2
                    -translate-y-1/2
                    text-slate-400
                    transition-colors
                    duration-200
                    group-focus-within:text-blue-600
                  "
                >

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
                      d="M3 7.5A2.5 2.5 0 015.5 5h13A2.5 2.5 0 0121 7.5v9a2.5 2.5 0 01-2.5 2.5h-13A2.5 2.5 0 013 16.5v-9z"
                    />

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 9h10M7 13h6"
                    />

                  </svg>

                </div>

                <input
                  type="text"
                  value={storeCode}
                  onChange={
                    handleStoreCodeChange
                  }
                  onBlur={() =>
                    findStore(
                      storeCode
                    )
                  }
                  placeholder="Enter store code"
                  autoComplete="organization"
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
                    focus:scale-[1.01]
                  "
                />

              </div>

              {/* ==================================================
                  STORE NAME
              ================================================== */}

              {storeLoading && (

                <p className="mt-2 text-xs text-slate-400">

                  Checking store...

                </p>

              )}

              {!storeLoading &&
                storeName && (

                  <div
                    className="
                      mt-2
                      flex
                      items-center
                      gap-2
                    "
                  >

                    <span
                      className="
                        w-1.5
                        h-1.5
                        rounded-full
                        bg-emerald-500
                      "
                    />

                    <span
                      className="
                        text-xs
                        font-semibold
                        text-emerald-600
                      "
                    >

                      {storeName}

                    </span>

                  </div>

                )}

            </div>

            {/* ==================================================
                USERNAME
            ================================================== */}

            <div>

              <label
                className="
                  block
                  text-xs
                  font-semibold
                  text-slate-600
                  mb-1.5
                "
              >

                Username

              </label>

              <div className="relative group">

                <div
                  className="
                    absolute
                    left-3.5
                    top-1/2
                    -translate-y-1/2
                    text-slate-400
                    transition-colors
                    duration-200
                    group-focus-within:text-blue-600
                  "
                >

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
                    focus:scale-[1.01]
                  "
                />

              </div>

            </div>

            {/* ==================================================
                PASSWORD
            ================================================== */}

            <div>

              <label
                className="
                  block
                  text-xs
                  font-semibold
                  text-slate-600
                  mb-1.5
                "
              >

                Password

              </label>

              <div className="relative group">

                <div
                  className="
                    absolute
                    left-3.5
                    top-1/2
                    -translate-y-1/2
                    text-slate-400
                    transition-colors
                    duration-200
                    group-focus-within:text-blue-600
                  "
                >

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
                    focus:scale-[1.01]
                  "
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (prev) =>
                        !prev
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
                    hover:text-slate-600
                    hover:bg-slate-50
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
                btn-shine
                relative
                overflow-hidden
                w-full
                h-12
                rounded-xl
                bg-slate-900
                hover:bg-slate-700
                active:bg-slate-800
                text-white
                font-semibold
                text-sm
                shadow-sm
                shadow-slate-600/20
                transition-all
                duration-200
                flex
                items-center
                justify-center
                gap-2
                disabled:opacity-60
                disabled:cursor-not-allowed
                hover:-translate-y-0.5
                active:translate-y-0
              "
            >

              {isLoading ? (

                <>

                  <span
                    className="
                      w-4
                      h-4
                      border-2
                      border-white/30
                      border-t-white
                      rounded-full
                      animate-spin
                    "
                  />

                  Signing in...

                </>

              ) : (

                <>

                  Sign In

                  <span className="text-base">
                    →
                  </span>

                </>

              )}

            </button>

          </form>

          {/* ==================================================
              SECURITY
          ================================================== */}

          <div
            className="
              mt-8
              flex
              items-center
              justify-center
              gap-2
              text-xs
              text-slate-400
            "
          >

            <span>🔒</span>

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