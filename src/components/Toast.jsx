import React, { useEffect } from "react";
import "../index.css";

const Toast = ({ message, type = "success", onClose }) => {

    // ==========================================
    // AUTO CLOSE TOAST AFTER 3 SECONDS
    // ==========================================

    useEffect(() => {

        // Don't start a timer when there is no toast
        if (!message) return;

        const timer = setTimeout(() => {
            onClose();
        }, 3000);

        // Clear timer when message/onClose changes
        // or component unmounts
        return () => {
            clearTimeout(timer);
        };

    }, [message, onClose]);


    // ==========================================
    // DON'T RENDER WHEN THERE IS NO MESSAGE
    // ==========================================

    if (!message) return null;


    // ==========================================
    // TOAST STYLES
    // ==========================================

    const styles = {

        success: {
            container:
                "bg-green-50 border-green-500 text-green-800",
            icon: "✓",
        },

        error: {
            container:
                "bg-red-50 border-red-500 text-red-800",
            icon: "✕",
        },

        warning: {
            container:
                "bg-yellow-50 border-yellow-500 text-yellow-800",
            icon: "⚠",
        },

        info: {
            container:
                "bg-blue-50 border-blue-500 text-blue-800",
            icon: "ℹ",
        },

    };


    // ==========================================
    // GET CURRENT TOAST STYLE
    // ==========================================

    const currentStyle =
        styles[type] || styles.success;


    // ==========================================
    // TOAST UI
    // ==========================================

    return (

        <div
            className="
                fixed
                top-5
                right-5
                z-[9999]
                animate-slide-in
            "
        >

            <div
                className={`
                    flex
                    items-center
                    gap-3
                    min-w-[300px]
                    max-w-md
                    border-l-4
                    rounded-lg
                    shadow-lg
                    px-4
                    py-3
                    ${currentStyle.container}
                `}
            >

                {/* ICON */}

                <span className="text-xl font-bold">
                    {currentStyle.icon}
                </span>


                {/* MESSAGE */}

                <p className="flex-1 font-medium">
                    {message}
                </p>


                {/* CLOSE BUTTON */}

                <button
                    type="button"
                    onClick={onClose}
                    className="
                        text-lg
                        font-bold
                        opacity-60
                        hover:opacity-100
                        transition
                        duration-200
                    "
                    aria-label="Close notification"
                >
                    ×
                </button>

            </div>

        </div>

    );
};

export default Toast;