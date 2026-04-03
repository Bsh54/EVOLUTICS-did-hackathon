/**
 * Utility functions for user-related data processing
 */

/**
 * Extracts initials from a user's name.
 * e.g., "John Doe" -> "JD", "Jane" -> "JA"
 * @param name The user's full name
 * @returns A string containing the user's initials
 */
export const getInitials = (name: string): string => {
  if (!name || name.trim() === '') return 'U';
  
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    // Return first letter of first name and first letter of last name
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  
  // Return first two letters of the name if only one part
  return name.slice(0, 2).toUpperCase();
};

