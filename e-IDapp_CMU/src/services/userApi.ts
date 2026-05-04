// API service for fetching user data from PolyID Auth API

const API_BASE_URL = 'https://polyid-auth.onrender.com/api/v1';

export interface UserApiResponse {
    id: number;
    firstName: string;
    lastName: string;
    photo: string; // Base64 encoded image
    uniqueIdentifier: string;
    createdAt: string;
}

export interface ApiErrorResponse {
    message: string;
    error: string;
    statusCode: number;
}

/**
 * Fetch user data by unique identifier
 * @param id - User's unique identifier
 * @returns Promise with user data
 * @throws Error with specific message if user not found or API error
 */
export const fetchUserById = async (id: string): Promise<UserApiResponse> => {
    try {
        console.log(`🔍 Fetching user data for ID: ${id}`);

        const response = await fetch(`${API_BASE_URL}/users/holders/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        console.log(`📡 API Response Status: ${response.status}`);

        if (!response.ok) {
            // Try to parse error response
            let errorMessage = `API Error: ${response.status} - ${response.statusText}`;

            try {
                const errorData: ApiErrorResponse = await response.json();
                console.error('❌ API Error Response:', errorData);

                // Extract specific error message from API
                if (errorData.message) {
                    errorMessage = errorData.message;
                }
            } catch (parseError) {
                // If JSON parsing fails, use generic error message
                console.error('Failed to parse error response:', parseError);
            }

            // Throw the error message
            throw new Error(errorMessage);
        }

        const data: UserApiResponse = await response.json();
        console.log('✅ User data fetched successfully:', {
            id: data.id,
            name: `${data.firstName} ${data.lastName}`,
            uniqueIdentifier: data.uniqueIdentifier
        });

        return data;
    } catch (error) {
        console.error('❌ Error fetching user data:', error);
        throw error;
    }
};
