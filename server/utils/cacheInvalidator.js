import { cacheConnection as redisClient } from "../config/queue.js";

/**
 * Clears all cached routes for a specific user to prevent stale data.
 * Useful after a mutation (e.g., finishing a quiz, generating a course).
 * 
 * @param {string} userId - The Auth0 ID of the user
 */
export async function clearUserCache(userId) {
  if (!userId) return;
  
  try {
    const pattern = `cache:${userId}:*`;
    const keys = await redisClient.keys(pattern);
    
    if (keys.length > 0) {
      await redisClient.del(...keys);
      console.log(`[Redis] Cleared ${keys.length} cached routes for user ${userId}`);
    }
  } catch (error) {
    console.error("[Redis] Failed to clear user cache:", error.message);
  }
}

/**
 * Clears public cached routes (like the public courses list).
 */
export async function clearPublicCache() {
  try {
    const pattern = `cache:public:*`;
    const keys = await redisClient.keys(pattern);
    
    if (keys.length > 0) {
      await redisClient.del(...keys);
      console.log(`[Redis] Cleared ${keys.length} public cached routes`);
    }
  } catch (error) {
    console.error("[Redis] Failed to clear public cache:", error.message);
  }
}
