const API_URL =
    "https://invoice-backend-78hd.onrender.com";

// ==========================================
// API REQUEST HELPER
// ==========================================

const request = async (
    endpoint,
    options = {}
) => {

    const token =
        sessionStorage.getItem("token");

    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
    };

    if (token) {

        headers.Authorization =
            `Bearer ${token}`;

    }

    const response =
        await fetch(
            `${API_URL}${endpoint}`,
            {
                ...options,
                headers,
            }
        );

    let data = {};

    try {

        data = await response.json();

    } catch (error) {

        data = {};

    }

    if (!response.ok) {

        const error =
            new Error(
                data.message ||
                "API request failed."
            );

        error.response = {
            status: response.status,
            data,
        };

        throw error;

    }

    return {
        data,
        status: response.status,
        ok: response.ok,
    };

};

// ==========================================
// GET
// ==========================================

const api = {

    get: (endpoint) =>
        request(
            endpoint,
            {
                method: "GET",
            }
        ),

    // ======================================
    // POST
    // ======================================

    post: (
        endpoint,
        body
    ) =>
        request(
            endpoint,
            {
                method: "POST",
                body: JSON.stringify(body),
            }
        ),

    // ======================================
    // PUT
    // ======================================

    put: (
        endpoint,
        body
    ) =>
        request(
            endpoint,
            {
                method: "PUT",
                body: JSON.stringify(body),
            }
        ),

    // ======================================
    // PATCH
    // ======================================

    patch: (
        endpoint,
        body
    ) =>
        request(
            endpoint,
            {
                method: "PATCH",
                body: JSON.stringify(body),
            }
        ),

    // ======================================
    // DELETE
    // ======================================

    delete: (endpoint) =>
        request(
            endpoint,
            {
                method: "DELETE",
            }
        ),

};

export default api;