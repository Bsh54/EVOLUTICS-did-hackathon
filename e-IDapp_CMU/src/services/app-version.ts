export interface AppVersionData {
    id: number;
    mobileAppVersion: string;
    isActive: boolean;
    createDateTime: string;
    createdBy: number;
    lastChangedDateTime: string;
    lastChangedBy: number;
}

export interface AppVersionResponse {
    statusCode: number;
    message: string;
    data: AppVersionData;
}

// Note: localhost might need to be replaced with actual IP for mobile devices
const BASE_URL = 'https://eid-app-version-control.onrender.com/api/v1'; // Default Android emulator IP for localhost

/**
 * Fetch app version details
 * @param version version string like 'v1.01.0'
 */
export const fetchAppVersion = async (version: string): Promise<AppVersionResponse> => {
    try {
        const response = await fetch(`${BASE_URL}/app-version/version/${version}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch app version: ${response.status}`);
        }

        const result: AppVersionResponse = await response.json();
        console.log('App version:', result);
        return result;
    } catch (error) {
        console.error('Error fetching app version:', error);
        throw error;
    }
};
