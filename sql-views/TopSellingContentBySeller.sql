CREATE OR REPLACE VIEW public.top_selling_content_by_seller AS
SELECT
    CONCAT(LOWER(seller), '-', LOWER(token)) AS id,
    LOWER(seller) AS seller,
    LOWER(token) AS token,

    -- Core metrics
    COUNT(*) AS total_sales,
    SUM(quantity) AS total_quantity_sold,
    SUM(total_payment) AS total_revenue,
    SUM(platform_fee) AS total_platform_fees,

    -- Net earnings
    SUM(total_payment) - SUM(platform_fee) AS net_revenue,

    -- Buyer insights
    COUNT(DISTINCT buyer) AS unique_buyers,
    
    -- Average order size
    AVG(quantity) AS avg_quantity_per_sale,

    -- Price stats
    AVG(price) AS avg_price,
    MIN(price) AS min_price,
    MAX(price) AS max_price,

    -- Time range
    MIN(timestamp) AS first_sale_at,
    MAX(timestamp) AS last_sale_at,

    -- Recency metrics
    EXTRACT(DAY FROM NOW() - MAX(timestamp)) AS days_since_last_sale,
    
    COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '7 days') AS sales_last_7_days,
    COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '30 days') AS sales_last_30_days,
    
    SUM(total_payment) FILTER (WHERE timestamp > NOW() - INTERVAL '30 days') AS revenue_last_30_days

FROM public.purchase_completed
GROUP BY LOWER(seller), LOWER(token)
ORDER BY total_revenue DESC;