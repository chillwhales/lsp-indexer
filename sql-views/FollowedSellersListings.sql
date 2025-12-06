CREATE OR REPLACE VIEW followed_sellers_listings AS
SELECT 
  f.follower_universal_profile_id,
  l.*
FROM follow f
INNER JOIN listing l 
  ON l.seller_universal_profile_id = f.followed_universal_profile_id
LEFT JOIN listing_closed lc 
  ON lc.listing_entity_id = l.id
WHERE 
  lc.id IS NULL  -- exclude closed listings
  AND NOT EXISTS (
    -- exclude if unfollowed AFTER the follow
    SELECT 1 FROM unfollow u 
    WHERE u.follower_universal_profile_id = f.follower_universal_profile_id
      AND u.unfollowed_universal_profile_id = f.followed_universal_profile_id
      AND u.timestamp > f.timestamp
  );