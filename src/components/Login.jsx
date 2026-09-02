
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

  // ==================================================
  // LOGIN ROLE
  // IMPORTANT:
  // Database uses Admin / Cashier
  // ==================================================

  const [role, setRole] = useState("Cashier");

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
  // FIND STORE
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
      !password.trim() ||
      !role
    ) {

      showToast(
        "Please enter store code, username, password and select a role.",
        "warning"
      );

      return;

    }

    try {

      setIsLoading(true);

      // ==================================================
      // LOGIN REQUEST
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

            // IMPORTANT:
            // Sends Admin / Cashier
            // exactly like MySQL ENUM
            role,
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
        // SAVE STORE
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
            `Invalid ${role} username or password.`,
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
            `Invalid ${role} username or password.`,
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
  <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#f8fbff,_#eef4ff_35%,_#f8fafc_70%)] flex overflow-hidden">
    <style>{`
      @keyframes floatOrb1 {
        0%, 100% {
          transform: translate3d(0, 0, 0) scale(1);
        }
        50% {
          transform: translate3d(34px, 42px, 0) scale(1.1);
        }
      }

      @keyframes floatOrb2 {
        0%, 100% {
          transform: translate3d(0, 0, 0) scale(1);
        }
        50% {
          transform: translate3d(-28px, -36px, 0) scale(1.07);
        }
      }

      @keyframes floatOrb3 {
        0%, 100% {
          transform: translate3d(0, 0, 0) scale(1);
        }
        50% {
          transform: translate3d(20px, -24px, 0) scale(1.06);
        }
      }

      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes softPulse {
        0%, 100% {
          opacity: 0.55;
          transform: scale(1);
        }
        50% {
          opacity: 0.9;
          transform: scale(1.04);
        }
      }

      @keyframes shine {
        from {
          transform: translateX(-140%) skewX(-18deg);
        }
        to {
          transform: translateX(240%) skewX(-18deg);
        }
      }

      @keyframes borderFlow {
        0% {
          background-position: 0% 50%;
        }
        100% {
          background-position: 200% 50%;
        }
      }

      @keyframes glowBreath {
        0%, 100% {
          box-shadow:
            0 0 0 rgba(59,130,246,0),
            0 0 0 rgba(139,92,246,0);
        }
        50% {
          box-shadow:
            0 0 24px rgba(59,130,246,0.12),
            0 0 38px rgba(139,92,246,0.10);
        }
      }

      @keyframes cardReveal {
        from {
          opacity: 0;
          transform: translateY(18px) scale(0.985);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes shimmerLine {
        0% {
          transform: translateX(-120%);
          opacity: 0;
        }
        20% {
          opacity: 1;
        }
        100% {
          transform: translateX(220%);
          opacity: 0;
        }
      }

      .orb-1 {
        animation: floatOrb1 10s ease-in-out infinite;
      }

      .orb-2 {
        animation: floatOrb2 12s ease-in-out infinite;
      }

      .orb-3 {
        animation: floatOrb3 14s ease-in-out infinite;
      }

      .fade-up {
        animation: fadeInUp 0.7s ease forwards;
        opacity: 0;
      }

      .fade-delay-1 {
        animation-delay: 0.08s;
      }

      .fade-delay-2 {
        animation-delay: 0.16s;
      }

      .fade-delay-3 {
        animation-delay: 0.24s;
      }

      .fade-delay-4 {
        animation-delay: 0.32s;
      }

      .glass-card {
        animation:
          cardReveal 0.75s ease-out,
          glowBreath 5s ease-in-out infinite;
      }

      .btn-shine::after {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 38%;
        height: 100%;
        background: linear-gradient(
          120deg,
          transparent,
          rgba(255, 255, 255, 0.38),
          transparent
        );
        transform: translateX(-140%) skewX(-18deg);
      }

      .btn-shine:hover::after {
        animation: shine 0.95s ease;
      }

      .premium-border {
        position: relative;
        overflow: hidden;
      }

      .premium-border::before {
        content: "";
        position: absolute;
        inset: 0;
        padding: 1px;
        border-radius: inherit;
        background: linear-gradient(
          120deg,
          rgba(255,255,255,0.75),
          rgba(59,130,246,0.18),
          rgba(139,92,246,0.18),
          rgba(255,255,255,0.75)
        );
        background-size: 200% 200%;
        animation: borderFlow 7s linear infinite;
        -webkit-mask:
          linear-gradient(#fff 0 0) content-box,
          linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        pointer-events: none;
      }

      .input-shell {
        transition:
          transform 0.28s ease,
          box-shadow 0.28s ease,
          background-color 0.28s ease,
          border-color 0.28s ease;
      }

      .input-shell:focus-within {
        transform: translateY(-1px);
        box-shadow:
          0 10px 25px rgba(59,130,246,0.10),
          0 0 0 4px rgba(59,130,246,0.08);
      }

      .status-pulse {
        animation: softPulse 2.2s ease-in-out infinite;
      }

      .shimmer-line {
        position: absolute;
        top: 0;
        left: 0;
        width: 35%;
        height: 1px;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255,255,255,0.95),
          transparent
        );
        animation: shimmerLine 3.8s linear infinite;
      }

      .role-tab {
        transition:
          transform 0.28s ease,
          box-shadow 0.28s ease,
          background-color 0.28s ease,
          color 0.28s ease,
          border-color 0.28s ease;
      }

      .role-tab:hover {
        transform: translateY(-1px);
      }

      .pro-button {
        transition:
          transform 0.3s ease,
          box-shadow 0.3s ease,
          filter 0.3s ease,
          background 0.3s ease;
      }

      .pro-button:hover {
        filter: brightness(1.03);
      }

      .pro-button:active {
        transform: translateY(0);
      }

      .ambient-grid {
        background-image:
          linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px);
        background-size: 42px 42px;
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
        bg-gradient-to-br
        from-slate-950
        via-slate-900
        to-blue-950
        text-white
        relative
        overflow-hidden
      "
    >
      <div
        className="
          orb-1
          absolute
          -top-40
          -right-40
          w-96
          h-96
          bg-blue-500
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
          bg-violet-500
          rounded-full
          opacity-10
          blur-3xl
        "
      />

      <div
        className="
          orb-3
          absolute
          top-1/3
          left-1/3
          w-72
          h-72
          bg-cyan-400
          rounded-full
          opacity-[0.08]
          blur-3xl
        "
      />

      <div className="absolute inset-0 ambient-grid opacity-[0.05]" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.10),_transparent_45%)]" />

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
        {/* BRAND */}
        <div className="fade-up fade-delay-1">
          <div className="flex items-center gap-3">
            <div
              className="
                w-11
                h-11
                rounded-xl
                bg-white/10
                border
                border-white/10
                flex
                items-center
                justify-center
                shadow-[0_10px_30px_rgba(0,0,0,0.25)]
                backdrop-blur-md
              "
            >
              <span className="text-xl">🛒</span>
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

        {/* MAIN CONTENT */}
        <div className="max-w-lg">
          <div
            className="
              flex
              items-center
              gap-2
              mb-6
              fade-up
              fade-delay-2
            "
          >
            <span
              className="
                status-pulse
                w-2
                h-2
                rounded-full
                bg-green-400
              "
            />
            <span
              className="
                text-xs
                text-green-300
                font-medium
                tracking-wide
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
              fade-delay-2
            "
          >
            Simple billing.
            <br />
            Smarter retail.
          </h2>

          <p
            className="
              mt-6
              text-slate-300/80
              leading-7
              max-w-md
              fade-up
              fade-delay-3
            "
          >
            Manage your entire store with BILLQORA -
            billing, cash registers, inventory,
            customers and daily operations,
            all in one powerful POS system.
          </p>

          {/* FEATURES */}
          <div
            className="
              flex
              gap-8
              mt-10
              fade-up
              fade-delay-4
            "
          >
            <div>
              <p className="text-2xl font-bold">Fast</p>
              <p className="text-xs text-slate-400 mt-1 tracking-wide">
                Billing
              </p>
            </div>

            <div className="w-px bg-gradient-to-b from-transparent via-slate-600 to-transparent" />

            <div>
              <p className="text-2xl font-bold">Secure</p>
              <p className="text-xs text-slate-400 mt-1 tracking-wide">
                Access
              </p>
            </div>

            <div className="w-px bg-gradient-to-b from-transparent via-slate-600 to-transparent" />

            <div>
              <p className="text-2xl font-bold">Easy</p>
              <p className="text-xs text-slate-400 mt-1 tracking-wide">
                Management
              </p>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} {storeName || "POS SYSTEM"}
        </p>
      </div>
    </div>

    {/* ==================================================
        RIGHT LOGIN SECTION
    ================================================== */}

    <div
      className="
        relative
        w-full
        lg:w-1/2
        flex
        items-center
        justify-center
        px-5
        sm:px-8
        py-10
        bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.08),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(139,92,246,0.08),_transparent_28%)]
      "
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-16 right-10 h-40 w-40 rounded-full bg-blue-400/10 blur-3xl orb-1" />
        <div className="absolute bottom-10 left-10 h-36 w-36 rounded-full bg-violet-400/10 blur-3xl orb-2" />
      </div>

      <div
        className="
          w-full
          max-w-md
          transition-all
          duration-700
          ease-out
        "
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(16px)",
        }}
      >
        {/* MOBILE BRAND */}
        <div className="lg:hidden mb-8 fade-up fade-delay-1">
          <div className="flex items-center gap-3">
            <div
              className="
                w-11
                h-11
                rounded-xl
                bg-gradient-to-br
                from-slate-900
                to-slate-700
                text-white
                flex
                items-center
                justify-center
                shadow-[0_10px_25px_rgba(15,23,42,0.22)]
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
                {storeName || "POS SYSTEM"}
              </h1>

              <p className="text-xs text-slate-400">
                Powered by{" "}
                <span className="font-semibold text-slate-500">
                  BILLQORA
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* ==================================================
            LOGIN CARD - PRO DYNAMIC UI
        ================================================== */}

        <div
          className="
            glass-card
            premium-border
            relative
            overflow-hidden
            rounded-[28px]
            border
            border-white/30
            bg-white/72
            backdrop-blur-2xl
            shadow-[0_24px_80px_rgba(15,23,42,0.16)]
            ring-1
            ring-white/40
          "
        >
          {/* Decorative background layers */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-20 -right-16 h-44 w-44 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-violet-500/10 blur-3xl" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.28),transparent_26%,transparent_72%,rgba(148,163,184,0.08))]" />
            <div className="shimmer-line" />
          </div>

          {/* CARD HEADER */}
          <div
            className="
              relative
              px-7
              pt-7
              pb-6
              border-b
              border-slate-200/70
              bg-gradient-to-br
              from-white/80
              via-white/55
              to-blue-50/50
            "
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <div
                  className="
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    border
                    border-blue-100
                    bg-blue-50/90
                    px-3
                    py-1
                    text-[11px]
                    font-semibold
                    tracking-wide
                    text-blue-700
                    shadow-sm
                    mb-3
                  "
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Secure Access Portal
                </div>

                <h2
                  className="
                    text-2xl
                    font-bold
                    tracking-tight
                    text-slate-900
                  "
                >
                  Welcome back
                </h2>

                <p
                  className="
                    mt-1.5
                    text-sm
                    text-slate-500
                  "
                >
                  Sign in to your POS account
                </p>
              </div>

              <div
                className="
                  relative
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-white/60
                  bg-gradient-to-br
                  from-white
                  via-slate-50
                  to-blue-50
                  text-xl
                  shadow-[0_10px_30px_rgba(15,23,42,0.08)]
                "
              >
                <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/10 to-violet-500/10" />
                <span className="relative">🔐</span>
              </div>
            </div>
          </div>

          {/* ROLE SELECTOR */}
          <div
            className="
              px-7
              pt-6
            "
          >
            <p
              className="
                mb-3
                text-[11px]
                font-semibold
                uppercase
                tracking-[0.18em]
                text-slate-500
              "
            >
              Continue as
            </p>

<div
  className="
    grid
    grid-cols-2
    gap-1
    rounded-xl
    border
    border-slate-200/80
    bg-slate-100/85
    p-1
    shadow-inner
    backdrop-blur
  "
>
  {/* ADMIN */}
  <button
    type="button"
    onClick={() => setRole("Admin")}
    className={`
      role-tab
      relative
      h-9
      rounded-lg
      flex
      items-center
      justify-center
      text-[13px]
      font-semibold
      transition-all
      duration-200
      ${
        role === "Admin"
          ? `
            bg-white
            text-slate-900
            shadow-[0_5px_16px_rgba(15,23,42,0.07)]
            ring-1
            ring-slate-200
          `
          : `
            text-slate-500
            hover:text-slate-700
            hover:bg-white/70
          `
      }
    `}
  >
    <span className="relative z-10">
      Admin
    </span>

    {role === "Admin" && (
      <span
        className="
          absolute
          right-2.5
          top-1/2
          -translate-y-1/2
          h-1.5
          w-1.5
          rounded-full
          bg-blue-500
          shadow-[0_0_0_4px_rgba(59,130,246,0.10)]
        "
      />
    )}
  </button>

  {/* CASHIER */}
  <button
    type="button"
    onClick={() => setRole("Cashier")}
    className={`
      role-tab
      relative
      h-9
      rounded-lg
      flex
      items-center
      justify-center
      text-[13px]
      font-semibold
      transition-all
      duration-200
      ${
        role === "Cashier"
          ? `
            bg-white
            text-slate-900
            shadow-[0_5px_16px_rgba(15,23,42,0.07)]
            ring-1
            ring-slate-200
          `
          : `
            text-slate-500
            hover:text-slate-700
            hover:bg-white/70
          `
      }
    `}
  >
    <span className="relative z-10">
      Cashier
    </span>

    {role === "Cashier" && (
      <span
        className="
          absolute
          right-2.5
          top-1/2
          -translate-y-1/2
          h-1.5
          w-1.5
          rounded-full
          bg-blue-500
          shadow-[0_0_0_4px_rgba(59,130,246,0.10)]
        "
      />
    )}
  </button>
</div>


          </div>

          {/* FORM */}
          <form
            onSubmit={loginHandler}
            className="
              px-7
              pt-6
              pb-7
              space-y-5
            "
          >
            {/* STORE CODE */}
            <div>
              <label
                className="
                  mb-1.5
                  block
                  text-xs
                  font-semibold
                  tracking-wide
                  text-slate-600
                "
              >
                Store Code
              </label>

              <div className="group relative input-shell rounded-2xl">
                <div
                  className="
                    pointer-events-none
                    absolute
                    left-3.5
                    top-1/2
                    -translate-y-1/2
                    text-slate-400
                    transition-colors
                    duration-300
                    group-focus-within:text-blue-600
                  "
                >
                  <svg
                    xmlns="[w3.org](http://www.w3.org/2000/svg)"
                    className="h-5 w-5"
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
                  onChange={handleStoreCodeChange}
                  onBlur={() => findStore(storeCode)}
                  placeholder="Enter store code"
                  autoComplete="organization"
                  className="
                    h-9
                    w-full
                    rounded-2xl
                    border
                    border-slate-200
                    bg-slate-50/82
                    pl-11
                    pr-4
                    text-sm
                    text-slate-800
                    placeholder:text-slate-400
                    outline-none
                    transition-all
                    duration-300
                    hover:border-slate-300
                    hover:bg-white
                    focus:border-blue-500
                    focus:bg-white
                    focus:ring-4
                    focus:ring-blue-500/10
                    shadow-sm
                  "
                />
              </div>

              {storeLoading && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-300 border-t-blue-500 animate-spin" />
                  <p
                    className="
                      text-xs
                      font-medium
                      text-slate-400
                    "
                  >
                    Checking store...
                  </p>
                </div>
              )}

              {!storeLoading && storeName && (
                <div
                  className="
                    mt-2
                    inline-flex
                    items-center
                    gap-2
                    rounded-full
                    border
                    border-emerald-100
                    bg-emerald-50
                    px-3
                    py-1.5
                    shadow-sm
                  "
                >
                  <span
                    className="
                      h-1.5
                      w-1.5
                      rounded-full
                      bg-emerald-500
                    "
                  />
                  <span
                    className="
                      text-xs
                      font-semibold
                      text-emerald-700
                    "
                  >
                    {storeName}
                  </span>
                </div>
              )}
            </div>

            {/* USERNAME */}
            <div>
              <label
                className="
                  mb-1.5
                  block
                  text-xs
                  font-semibold
                  tracking-wide
                  text-slate-600
                "
              >
                Username
              </label>

              <div className="group relative input-shell rounded-2xl">
                <div
                  className="
                    pointer-events-none
                    absolute
                    left-3.5
                    top-1/2
                    -translate-y-1/2
                    text-slate-400
                    transition-colors
                    duration-300
                    group-focus-within:text-blue-600
                  "
                >
                  <svg
                    xmlns="[w3.org](http://www.w3.org/2000/svg)"
                    className="h-5 w-5"
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
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  autoComplete="username"
                  className="
                    h-10
                    w-full
                    rounded-2xl
                    border
                    border-slate-200
                    bg-slate-50/82
                    pl-11
                    pr-4
                    text-sm
                    text-slate-800
                    placeholder:text-slate-400
                    outline-none
                    transition-all
                    duration-300
                    hover:border-slate-300
                    hover:bg-white
                    focus:border-blue-500
                    focus:bg-white
                    focus:ring-4
                    focus:ring-blue-500/10
                    shadow-sm
                  "
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <label
                className="
                  mb-1.5
                  block
                  text-xs
                  font-semibold
                  tracking-wide
                  text-slate-600
                "
              >
                Password
              </label>

              <div className="group relative input-shell rounded-2xl">
                <div
                  className="
                    pointer-events-none
                    absolute
                    left-3.5
                    top-1/2
                    -translate-y-1/2
                    text-slate-400
                    transition-colors
                    duration-300
                    group-focus-within:text-blue-600
                  "
                >
                  <svg
                    xmlns="[w3.org](http://www.w3.org/2000/svg)"
                    className="h-5 w-5"
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
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="
                    h-10
                    w-full
                    rounded-2xl
                    border
                    border-slate-200
                    bg-slate-50/82
                    pl-11
                    pr-16
                    text-sm
                    text-slate-800
                    placeholder:text-slate-400
                    outline-none
                    transition-all
                    duration-300
                    hover:border-slate-300
                    hover:bg-white
                    focus:border-blue-500
                    focus:bg-white
                    focus:ring-4
                    focus:ring-blue-500/10
                    shadow-sm
                  "
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="
                    absolute
                    right-2
                    top-1/2
                    -translate-y-1/2
                    inline-flex
                    h-8.5
                    items-center
                    justify-center
                    rounded-lg
                    px-3
                    text-xs
                    font-semibold
                    text-slate-500
                    transition-all
                    duration-300
                    hover:bg-slate-100
                    hover:text-slate-700
                  "
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* SIGN IN BUTTON */}
            <button
              type="submit"
              disabled={isLoading}
              className="
                pro-button
                btn-shine
                group
                relative
                flex
                h-12
                w-full
                items-center
                justify-center
                gap-2
                overflow-hidden
                rounded-2xl
                bg-gradient-to-r
                from-slate-950
                via-slate-800
                to-blue-900
                text-sm
                font-semibold
                text-white
                shadow-[0_16px_40px_rgba(15,23,42,0.22)]
                transition-all
                duration-300
                hover:-translate-y-0.5
                hover:shadow-[0_22px_50px_rgba(15,23,42,0.28)]
                active:translate-y-0
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              <span className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-white/10 to-cyan-400/0 translate-x-[-120%] group-hover:translate-x-[120%] transition-transform duration-1000" />
              <span className="absolute inset-0 rounded-2xl ring-1 ring-white/10" />

              {isLoading ? (
                <>
                  <span
                    className="
                      relative
                      z-10
                      h-4
                      w-4
                      rounded-full
                      border-2
                      border-white/30
                      border-t-white
                      animate-spin
                    "
                  />
                  <span className="relative z-10">Signing in...</span>
                </>
              ) : (
                <>
                  <span className="relative z-10">
                    Sign In as {role === "Admin" ? "Admin" : "Cashier"}
                  </span>
                  <span className="relative z-10 text-base transition-transform duration-300 group-hover:translate-x-0.5">
                    →
                  </span>
                </>
              )}
            </button>
          </form>

          {/* CARD FOOTER */}
          <div
            className="
              relative
              flex
              items-center
              justify-center
              gap-2
              border-t
              border-slate-200/70
              bg-slate-50/75
              px-7
              py-4
              text-xs
              text-slate-500
              backdrop-blur
            "
          >
            <span
              className="
                inline-flex
                h-6
                w-6
                items-center
                justify-center
                rounded-full
                bg-emerald-100
                text-[11px]
                shadow-sm
              "
            >
              🔒
            </span>

            <span className="font-medium">Secure POS Login</span>
          </div>
        </div>

        {/* ROLE INFO */}
        <p
          className="
            mt-5
            text-center
            text-xs
            text-slate-500
          "
        >
          Signing in as{" "}
          <span
            className="
              inline-flex
              items-center
              rounded-full
              bg-white/80
              px-2.5
              py-1
              font-semibold
              text-slate-700
              shadow-sm
              ring-1
              ring-slate-200/70
              transition-all
              duration-300
            "
          >
            {role === "Admin" ? "Administrator" : "Cashier"}
          </span>
        </p>

        {/* ==================================================
            TOAST
        ================================================== */}

        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      </div>
    </div>
  </div>
);


};

export default Login;
