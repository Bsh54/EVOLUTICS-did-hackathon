// Template API response interfaces
export interface TemplateUrlData {
    url: string;
    expiresIn: number;
}

export interface TemplateUrlResponse {
    success: boolean;
    statusCode: number;
    message: string;
    data: TemplateUrlData;
    timestamp: string;
}

// Template API base URL
const TEMPLATE_BASE_URL = 'https://eid-apis.polyversity.io/api/v1/template';


/**
 * Fetch template URL by document key
 * @param documentKey The document key from the credential offer URL
 * @returns The template URL response with a pre-signed S3 URL
 */
export const fetchTemplateUrl = async (documentKey: string): Promise<TemplateUrlResponse> => {
    try {
        const url = `${TEMPLATE_BASE_URL}/${encodeURIComponent(documentKey)}`;
        console.log('📄 [TEMPLATE API] Fetching template URL:', url);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        });

        console.log('Template URL response:', response);

        if (!response.ok) {
            throw new Error(`Failed to fetch template URL: ${response.status}`);
        }

        const result: TemplateUrlResponse = await response.json();
        console.log('📄 [TEMPLATE API] Template URL response:', JSON.stringify(result, null, 2));
        return result;
    } catch (error) {
        console.error('❌ [TEMPLATE API] Error fetching template URL:', error);
        throw error;
    }
};
