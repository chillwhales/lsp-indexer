CREATE VIEW data_changed_latest AS
SELECT DISTINCT ON (data_key, address) 
  id,
  address,
  data_key,
  data_value,
  timestamp,
  block_number,
  log_index,
  transaction_index,
  digital_asset_id,
  universal_profile_id
FROM data_changed
ORDER BY data_key, address, timestamp DESC;