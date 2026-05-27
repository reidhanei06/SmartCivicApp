// Grab the URL from .env (fallback to localhost for safety)
// Make sure to use the correct IP/host based on your emulator/device (see Step 1)
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.10:5000';

export const apiClient = async (endpoint, options = {}) => {
    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        const data = await response.json();

        // Catch HTTP errors (e.g., 404, 500, 400)
        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        // Network errors, CORS issues, or custom thrown errors
        console.error(`API Error on ${endpoint}:`, error.message);
        throw error;
    }
};
