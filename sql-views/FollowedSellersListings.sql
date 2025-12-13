CREATE OR REPLACE VIEW followed_sellers_listings AS
SELECT 
  f.follower_universal_profile_id,
  l.id,
  l.listing_id,
  l.marketplace_profile,  -- explicitly included for filtering
  l.seller,
  l.seller_universal_profile_id,
  l.token,
  l.token_digital_asset_id,
  l.price,
  l.amount,
  l.status,
  l.created_at,
  l.updated_at,
  l.closed_at,
  l.address
FROM follow f
INNER JOIN listing l 
  ON l.seller_universal_profile_id = f.followed_universal_profile_id
LEFT JOIN listing_closed lc 
  ON lc.listing_entity_id = l.id
WHERE 
  lc.id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM unfollow u 
    WHERE u.follower_universal_profile_id = f.follower_universal_profile_id
      AND u.unfollowed_universal_profile_id = f.followed_universal_profile_id
      AND u.timestamp > f.timestamp
  );