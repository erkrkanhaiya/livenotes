// Profile image utility functions
export const getHighQualityProfileImage = (photoURL: string | null | undefined): string | null => {
  if (!photoURL) return null;
  
  // For Google profile images, we can get higher quality by modifying the URL
  if (photoURL.includes('googleusercontent.com')) {
    // Replace size parameters to get higher quality image
    return photoURL.replace(/=s\d+/, '=s200'); // Request 200px image instead of default
  }
  
  return photoURL;
};

// Get initials from display name as fallback
export const getProfileInitials = (displayName: string | null | undefined): string => {
  if (!displayName) return 'U';
  
  const names = displayName.trim().split(' ');
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};