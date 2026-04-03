import { CONFIG } from '../config/config';

const API_BASE_URL = CONFIG.BIOMETRIK_BASE_URL;
const API_KEY = CONFIG.BIOMETRIK_API_KEY;

export class BiometrikAPI {
    private static headers = {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
    };

    static async testConnection(): Promise<any> {
        try {
            console.log('Testing API connection to:', API_BASE_URL);
            console.log('Using API key:', API_KEY);
            console.log('Headers being sent:', this.headers);

            const response = await fetch(`${API_BASE_URL}/subject/list`, {
                method: 'GET',
                headers: this.headers,
            });

            console.log('Response status:', response.status);
            console.log('Response status text:', response.statusText);

            const result = await response.json();
            console.log('API test result:', result);
            return result;
        } catch (error) {
            console.error('API connection test failed:', error);
            throw error;
        }
    }

    static async createSubject(subjectName: string): Promise<any> {
        try {
            console.log('Creating subject:', subjectName);
            const response = await fetch(`${API_BASE_URL}/subject/create`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({ subjectName }),
            });
            const result = await response.json();
            console.log('Create subject result:', result);
            return result;
        } catch (error) {
            console.error('Error creating subject:', error);
            throw error;
        }
    }

    static async addSubjectImage(subjectName: string, imageInBase64: string): Promise<any> {
        try {
            console.log('Adding subject image for:', subjectName);
            const response = await fetch(`${API_BASE_URL}/subject/add-image`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({ subjectName, imageInBase64 }),
            });
            const result = await response.json();
            console.log('Add Image result:', result);
            return result;
        } catch (error) {
            console.error('Error adding subject image:', error);
            throw error;
        }
    }

    static async oneToNCompare(image: string): Promise<any> {
        try {
            console.log('Performing 1:N comparison...');
            console.log('API URL:', `${API_BASE_URL}/oneton`);
            console.log('Headers:', this.headers);
            console.log('Image length:', image.length);

            const requestBody = { image };
            console.log('Request body:', JSON.stringify(requestBody).substring(0, 200) + '...');

            const response = await fetch(`${API_BASE_URL}/oneton`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(requestBody),
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            const result = await response.json();
            console.log('1:N comparison result:', result);
            return result;
        } catch (error) {
            console.error('Error in 1:N comparison:', error);
            throw error;
        }
    }

    static async getFaceMatchScore(image1: string, image2: string): Promise<any> {
        try {
            console.log('🔍 Calling getFaceMatchScore API...');
            const response = await fetch(`${API_BASE_URL}/get-face-match-score`, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({ image1, image2 }),
            });

            const result = await response.json();
            console.log("=========Face Match Score Result:", result);
            return result;
        } catch (error) {
            console.error('Error getting face match score:', error);
            throw error;
        }
    }

    static async getSubjectList(): Promise<any> {
        try {
            const response = await fetch(`${API_BASE_URL}/subject/list`, {
                method: 'GET',
                headers: this.headers,
            });
            return await response.json();
        } catch (error) {
            console.error('Error getting subject list:', error);
            throw error;
        }
    }

    static async deleteSubject(subjectName: string): Promise<any> {
        try {
            const response = await fetch(`${API_BASE_URL}/subject/delete`, {
                method: 'DELETE',
                headers: this.headers,
                body: JSON.stringify({ subjectName }),
            });
            return await response.json();
        } catch (error) {
            console.error('Error deleting subject:', error);
            throw error;
        }
    }
}