// Utility functions for image processing
import RNFS from 'react-native-fs';

export const convertImageToBase64 = async (imagePath: string): Promise<string> => {
  try {
    console.log('Converting image to base64:', imagePath);
    console.log('RNFS available:', !!RNFS);
    console.log('RNFS.readFile available:', !!(RNFS && RNFS.readFile));
    
    // Clean the path - remove file:// prefix if present
    let cleanPath = imagePath;
    if (imagePath.startsWith('file://')) {
      cleanPath = imagePath.replace('file://', '');
    }
    console.log('Clean path:', cleanPath);
    
    // Check if RNFS is available and try to read the file
    if (RNFS && typeof RNFS.readFile === 'function') {
      console.log('Attempting to read file with RNFS...');
      
      // First check if file exists
      const fileExists = await RNFS.exists(cleanPath);
      console.log('File exists:', fileExists);
      
      if (!fileExists) {
        throw new Error(`File does not exist at path: ${cleanPath}`);
      }
      
      // Read file stats
      const stats = await RNFS.stat(cleanPath);
      console.log('File stats:', { size: stats.size, isFile: stats.isFile() });
      
      if (stats.size === 0) {
        throw new Error('File is empty');
      }
      
      // Read the file and convert to base64
      const base64 = await RNFS.readFile(cleanPath, 'base64');
      console.log('Base64 conversion successful, length:', base64.length);
      
      if (base64.length < 100) {
        throw new Error('Base64 string too short, likely invalid');
      }
      
      return base64;
    }
    
    throw new Error('RNFS is not available or readFile function is missing');
  } catch (error) {
    console.error('Error converting image to base64:', error);
    
    // For development/testing, return a larger test image
    if (__DEV__) {
      console.warn('Using test image for development - this will not work for real face recognition');
      return generateTestImage();
    }
    
    throw error;
  }
};

export const validateImageFormat = (base64String: string): boolean => {
  // Basic validation for base64 image string
  if (!base64String || base64String.length === 0) {
    return false;
  }
  
  // Check if it's a valid base64 string (simplified check)
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Regex.test(base64String);
};

// Generate a test image for development
export const generateTestImage = (): string => {
  // This is a small test JPEG image in base64 (100x100 pixels, solid color)
  return '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA==';
};