/**
 * E-commerce & Inventory Tools - 32 tools (extra 2 to hit 356 total)
 */
export const ECOMMERCE_TOOLS = [
  { name: "shopify_create_product", desc: "Create a Shopify product", params: [
    { name: "title", type: "string", desc: "Product title", required: true },
    { name: "body_html", type: "string", desc: "Product description" },
    { name: "vendor", type: "string", desc: "Product vendor" },
    { name: "product_type", type: "string", desc: "Product type" },
    { name: "tags", type: "array", desc: "Product tags" },
    { name: "variants", type: "string", desc: "Variants as JSON" },
  ]},
  { name: "shopify_update_product", desc: "Update a Shopify product", params: [
    { name: "product_id", type: "number", desc: "Product ID", required: true },
    { name: "title", type: "string", desc: "New title" },
    { name: "body_html", type: "string", desc: "New description" },
    { name: "tags", type: "array", desc: "New tags" },
  ]},
  { name: "shopify_get_product", desc: "Get a Shopify product", params: [
    { name: "product_id", type: "number", desc: "Product ID", required: true },
  ]},
  { name: "shopify_list_products", desc: "List Shopify products", params: [
    { name: "collection_id", type: "number", desc: "Filter by collection" },
    { name: "product_type", type: "string", desc: "Filter by type" },
    { name: "vendor", type: "string", desc: "Filter by vendor" },
    { name: "limit", type: "number", desc: "Maximum results" },
  ]},
  { name: "shopify_create_order", desc: "Create a Shopify order", params: [
    { name: "line_items", type: "string", desc: "Line items as JSON", required: true },
    { name: "customer", type: "string", desc: "Customer info as JSON" },
    { name: "shipping_address", type: "string", desc: "Shipping address as JSON" },
    { name: "financial_status", type: "string", desc: "Financial status" },
  ]},
  { name: "shopify_fulfill_order", desc: "Fulfill a Shopify order", params: [
    { name: "order_id", type: "number", desc: "Order ID", required: true },
    { name: "tracking_number", type: "string", desc: "Tracking number" },
    { name: "tracking_company", type: "string", desc: "Shipping carrier" },
    { name: "notify_customer", type: "boolean", desc: "Send notification" },
  ]},
  { name: "shopify_cancel_order", desc: "Cancel a Shopify order", params: [
    { name: "order_id", type: "number", desc: "Order ID", required: true },
    { name: "reason", type: "string", desc: "Cancellation reason" },
    { name: "restock", type: "boolean", desc: "Restock items" },
  ]},
  { name: "shopify_update_inventory", desc: "Update Shopify inventory level", params: [
    { name: "inventory_item_id", type: "number", desc: "Inventory item ID", required: true },
    { name: "location_id", type: "number", desc: "Location ID", required: true },
    { name: "available", type: "number", desc: "New available quantity", required: true },
  ]},
  { name: "woocommerce_create_product", desc: "Create a WooCommerce product", params: [
    { name: "name", type: "string", desc: "Product name", required: true },
    { name: "type", type: "string", desc: "Product type (simple, variable)" },
    { name: "regular_price", type: "string", desc: "Regular price" },
    { name: "description", type: "string", desc: "Product description" },
    { name: "categories", type: "array", desc: "Category IDs" },
  ]},
  { name: "woocommerce_update_product", desc: "Update a WooCommerce product", params: [
    { name: "product_id", type: "number", desc: "Product ID", required: true },
    { name: "name", type: "string", desc: "New name" },
    { name: "regular_price", type: "string", desc: "New price" },
    { name: "stock_quantity", type: "number", desc: "New stock" },
  ]},
  { name: "woocommerce_create_order", desc: "Create a WooCommerce order", params: [
    { name: "line_items", type: "string", desc: "Line items as JSON", required: true },
    { name: "billing", type: "string", desc: "Billing info as JSON" },
    { name: "shipping", type: "string", desc: "Shipping info as JSON" },
    { name: "payment_method", type: "string", desc: "Payment method" },
  ]},
  { name: "woocommerce_update_order", desc: "Update a WooCommerce order", params: [
    { name: "order_id", type: "number", desc: "Order ID", required: true },
    { name: "status", type: "string", desc: "New status" },
    { name: "note", type: "string", desc: "Order note" },
  ]},
  { name: "amazon_list_orders", desc: "List Amazon seller orders", params: [
    { name: "created_after", type: "string", desc: "Created after date" },
    { name: "order_statuses", type: "array", desc: "Filter by status" },
    { name: "marketplace_ids", type: "array", desc: "Marketplace IDs" },
  ]},
  { name: "amazon_get_order", desc: "Get Amazon order details", params: [
    { name: "order_id", type: "string", desc: "Order ID", required: true },
  ]},
  { name: "amazon_update_inventory", desc: "Update Amazon inventory", params: [
    { name: "seller_sku", type: "string", desc: "Seller SKU", required: true },
    { name: "quantity", type: "number", desc: "New quantity", required: true },
  ]},
  { name: "amazon_submit_feed", desc: "Submit an Amazon feed", params: [
    { name: "feed_type", type: "string", desc: "Feed type", required: true },
    { name: "feed_content", type: "string", desc: "Feed content", required: true },
    { name: "marketplace_ids", type: "array", desc: "Marketplace IDs" },
  ]},
  { name: "bigcommerce_create_product", desc: "Create a BigCommerce product", params: [
    { name: "name", type: "string", desc: "Product name", required: true },
    { name: "price", type: "number", desc: "Product price", required: true },
    { name: "type", type: "string", desc: "Product type" },
    { name: "weight", type: "number", desc: "Product weight" },
    { name: "categories", type: "array", desc: "Category IDs" },
  ]},
  { name: "bigcommerce_update_product", desc: "Update a BigCommerce product", params: [
    { name: "product_id", type: "number", desc: "Product ID", required: true },
    { name: "name", type: "string", desc: "New name" },
    { name: "price", type: "number", desc: "New price" },
    { name: "inventory_level", type: "number", desc: "New inventory" },
  ]},
  { name: "shipstation_create_order", desc: "Create a ShipStation order", params: [
    { name: "order_number", type: "string", desc: "Order number", required: true },
    { name: "order_date", type: "string", desc: "Order date", required: true },
    { name: "ship_to", type: "string", desc: "Ship to address as JSON", required: true },
    { name: "items", type: "string", desc: "Order items as JSON", required: true },
  ]},
  { name: "shipstation_create_label", desc: "Create a ShipStation shipping label", params: [
    { name: "order_id", type: "number", desc: "Order ID", required: true },
    { name: "carrier_code", type: "string", desc: "Carrier code", required: true },
    { name: "service_code", type: "string", desc: "Service code", required: true },
    { name: "package_code", type: "string", desc: "Package code" },
    { name: "weight", type: "string", desc: "Weight as JSON" },
  ]},
  { name: "shipstation_get_rates", desc: "Get ShipStation shipping rates", params: [
    { name: "carrier_code", type: "string", desc: "Carrier code" },
    { name: "from_postal_code", type: "string", desc: "Origin postal code", required: true },
    { name: "to_postal_code", type: "string", desc: "Destination postal code", required: true },
    { name: "weight", type: "string", desc: "Weight as JSON", required: true },
  ]},
  { name: "easypost_create_shipment", desc: "Create an EasyPost shipment", params: [
    { name: "from_address", type: "string", desc: "From address as JSON", required: true },
    { name: "to_address", type: "string", desc: "To address as JSON", required: true },
    { name: "parcel", type: "string", desc: "Parcel details as JSON", required: true },
  ]},
  { name: "easypost_buy_label", desc: "Buy an EasyPost shipping label", params: [
    { name: "shipment_id", type: "string", desc: "Shipment ID", required: true },
    { name: "rate_id", type: "string", desc: "Selected rate ID", required: true },
  ]},
  { name: "easypost_track_shipment", desc: "Track an EasyPost shipment", params: [
    { name: "tracking_code", type: "string", desc: "Tracking code", required: true },
    { name: "carrier", type: "string", desc: "Carrier name" },
  ]},
  { name: "inventory_adjust_quantity", desc: "Adjust inventory quantity", params: [
    { name: "sku", type: "string", desc: "Product SKU", required: true },
    { name: "location_id", type: "string", desc: "Location ID", required: true },
    { name: "adjustment", type: "number", desc: "Quantity adjustment", required: true },
    { name: "reason", type: "string", desc: "Adjustment reason" },
  ]},
  { name: "inventory_transfer", desc: "Transfer inventory between locations", params: [
    { name: "sku", type: "string", desc: "Product SKU", required: true },
    { name: "from_location", type: "string", desc: "Source location", required: true },
    { name: "to_location", type: "string", desc: "Destination location", required: true },
    { name: "quantity", type: "number", desc: "Transfer quantity", required: true },
  ]},
  { name: "inventory_get_levels", desc: "Get inventory levels", params: [
    { name: "sku", type: "string", desc: "Product SKU" },
    { name: "location_id", type: "string", desc: "Location ID" },
  ]},
  { name: "returnly_create_return", desc: "Create a Returnly return", params: [
    { name: "order_id", type: "string", desc: "Original order ID", required: true },
    { name: "items", type: "string", desc: "Items to return as JSON", required: true },
    { name: "reason", type: "string", desc: "Return reason", required: true },
  ]},
  { name: "returnly_process_return", desc: "Process a Returnly return", params: [
    { name: "return_id", type: "string", desc: "Return ID", required: true },
    { name: "action", type: "string", desc: "Action (refund, exchange)", required: true },
    { name: "restock", type: "boolean", desc: "Restock items" },
  ]},
  { name: "square_create_payment", desc: "Create a Square payment", params: [
    { name: "source_id", type: "string", desc: "Payment source ID", required: true },
    { name: "amount_money", type: "string", desc: "Amount as JSON", required: true },
    { name: "idempotency_key", type: "string", desc: "Idempotency key", required: true },
    { name: "customer_id", type: "string", desc: "Customer ID" },
  ]},
  { name: "square_create_catalog_item", desc: "Create a Square catalog item", params: [
    { name: "name", type: "string", desc: "Item name", required: true },
    { name: "variations", type: "string", desc: "Variations as JSON", required: true },
    { name: "description", type: "string", desc: "Item description" },
  ]},
  { name: "square_update_inventory", desc: "Update Square inventory", params: [
    { name: "catalog_object_id", type: "string", desc: "Catalog object ID", required: true },
    { name: "location_id", type: "string", desc: "Location ID", required: true },
    { name: "quantity", type: "string", desc: "New quantity", required: true },
  ]},
];
