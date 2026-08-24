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

    // ======================================
    // AUTHORIZATION
    // ======================================

    if (token) {

        headers.Authorization =
            `Bearer ${token}`;

    }

    // ======================================
    // SEND REQUEST
    // ======================================

    const response =
        await fetch(
            `${API_URL}${endpoint}`,
            {
                ...options,
                headers,
            }
        );

    // ======================================
    // READ RESPONSE
    // ======================================

    let data = {};

    try {

        data = await response.json();

    } catch (error) {

        data = {};

    }

    // ======================================
    // HANDLE ERROR
    // ======================================

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

    // ======================================
    // RETURN RESPONSE
    // ======================================

    return {
        data,
        status: response.status,
        ok: response.ok,
    };

};


// ==========================================
// API METHODS
// ==========================================

const api = {

    // ======================================
    // GET
    // ======================================

    get: (
        endpoint,
        options = {}
    ) => {

        let url = endpoint;

        // ----------------------------------
        // QUERY PARAMETERS
        // ----------------------------------

        if (options.params) {

            const queryParams =
                new URLSearchParams(
                    options.params
                ).toString();

            if (queryParams) {

                url += `?${queryParams}`;

            }

        }

        return request(
            url,
            {
                method: "GET",

                headers:
                    options.headers || {},
            }
        );

    },


    // ======================================
    // POST
    // ======================================

    post: (
        endpoint,
        body
    ) => {

        return request(
            endpoint,
            {
                method: "POST",

                body:
                    JSON.stringify(body),
            }
        );

    },


    // ======================================
    // PUT
    // ======================================

    put: (
        endpoint,
        body
    ) => {

        return request(
            endpoint,
            {
                method: "PUT",

                body:
                    JSON.stringify(body),
            }
        );

    },


    // ======================================
    // PATCH
    // ======================================

    patch: (
        endpoint,
        body
    ) => {

        return request(
            endpoint,
            {
                method: "PATCH",

                body:
                    JSON.stringify(body),
            }
        );

    },


    // ======================================
    // DELETE
    // ======================================

    delete: (
        endpoint
    ) => {

        return request(
            endpoint,
            {
                method: "DELETE",
            }
        );

    },

};


// ==========================================
// EXPORT
// ==========================================

export default api;