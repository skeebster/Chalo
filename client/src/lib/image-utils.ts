// Convert stored imageUrl to displayable URL
// Handles both regular URLs and Google photo references (stored as "googleref:places/xxx/photos/yyy")
export function getDisplayImageUrl(imageUrl: string | null | undefined, fallback: string): string {
  if (!imageUrl) return fallback;
  
  // If it starts with googleref:, it's a Google Places photo reference
  if (imageUrl.startsWith('googleref:')) {
    const photoReference = imageUrl.substring(10); // Remove "googleref:" prefix
    return `/api/photos/proxy?ref=${encodeURIComponent(photoReference)}`;
  }
  
  // Otherwise it's a regular URL (legacy/uploaded images)
  return imageUrl;
}

// Default fallback image
export const DEFAULT_PLACE_IMAGE = "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&auto=format&fit=crop&q=60";
