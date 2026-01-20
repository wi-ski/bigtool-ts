/**
 * Finance & Payments Tools - 30 tools
 */
export const FINANCE_TOOLS = [
  { name: "stripe_create_customer", desc: "Create a Stripe customer", params: [
    { name: "email", type: "string", desc: "Customer email", required: true },
    { name: "name", type: "string", desc: "Customer name" },
    { name: "description", type: "string", desc: "Description" },
    { name: "metadata", type: "string", desc: "Metadata as JSON" },
  ]},
  { name: "stripe_update_customer", desc: "Update a Stripe customer", params: [
    { name: "customer_id", type: "string", desc: "Customer ID", required: true },
    { name: "email", type: "string", desc: "New email" },
    { name: "name", type: "string", desc: "New name" },
    { name: "metadata", type: "string", desc: "Metadata as JSON" },
  ]},
  { name: "stripe_create_charge", desc: "Create a Stripe charge", params: [
    { name: "amount", type: "number", desc: "Amount in cents", required: true },
    { name: "currency", type: "string", desc: "Currency code", required: true },
    { name: "customer", type: "string", desc: "Customer ID" },
    { name: "source", type: "string", desc: "Payment source" },
    { name: "description", type: "string", desc: "Charge description" },
  ]},
  { name: "stripe_create_refund", desc: "Create a Stripe refund", params: [
    { name: "charge", type: "string", desc: "Charge ID", required: true },
    { name: "amount", type: "number", desc: "Refund amount in cents" },
    { name: "reason", type: "string", desc: "Refund reason" },
  ]},
  { name: "stripe_list_charges", desc: "List Stripe charges", params: [
    { name: "customer", type: "string", desc: "Filter by customer" },
    { name: "created", type: "string", desc: "Created filter as JSON" },
    { name: "limit", type: "number", desc: "Maximum results" },
  ]},
  { name: "stripe_create_subscription", desc: "Create a Stripe subscription", params: [
    { name: "customer", type: "string", desc: "Customer ID", required: true },
    { name: "items", type: "string", desc: "Subscription items as JSON", required: true },
    { name: "trial_period_days", type: "number", desc: "Trial period days" },
    { name: "coupon", type: "string", desc: "Coupon code" },
  ]},
  { name: "stripe_cancel_subscription", desc: "Cancel a Stripe subscription", params: [
    { name: "subscription_id", type: "string", desc: "Subscription ID", required: true },
    { name: "immediately", type: "boolean", desc: "Cancel immediately" },
  ]},
  { name: "stripe_create_invoice", desc: "Create a Stripe invoice", params: [
    { name: "customer", type: "string", desc: "Customer ID", required: true },
    { name: "auto_advance", type: "boolean", desc: "Auto-finalize" },
    { name: "collection_method", type: "string", desc: "Collection method" },
    { name: "description", type: "string", desc: "Invoice description" },
  ]},
  { name: "stripe_send_invoice", desc: "Send a Stripe invoice", params: [
    { name: "invoice_id", type: "string", desc: "Invoice ID", required: true },
  ]},
  { name: "paypal_create_order", desc: "Create a PayPal order", params: [
    { name: "intent", type: "string", desc: "Order intent (CAPTURE, AUTHORIZE)", required: true },
    { name: "amount", type: "number", desc: "Order amount", required: true },
    { name: "currency", type: "string", desc: "Currency code", required: true },
    { name: "description", type: "string", desc: "Order description" },
  ]},
  { name: "paypal_capture_order", desc: "Capture a PayPal order", params: [
    { name: "order_id", type: "string", desc: "Order ID", required: true },
  ]},
  { name: "paypal_refund_capture", desc: "Refund a PayPal capture", params: [
    { name: "capture_id", type: "string", desc: "Capture ID", required: true },
    { name: "amount", type: "number", desc: "Refund amount" },
    { name: "note", type: "string", desc: "Refund note" },
  ]},
  { name: "quickbooks_create_invoice", desc: "Create a QuickBooks invoice", params: [
    { name: "customer_ref", type: "string", desc: "Customer reference ID", required: true },
    { name: "line_items", type: "string", desc: "Line items as JSON", required: true },
    { name: "due_date", type: "string", desc: "Due date" },
    { name: "memo", type: "string", desc: "Invoice memo" },
  ]},
  { name: "quickbooks_create_customer", desc: "Create a QuickBooks customer", params: [
    { name: "display_name", type: "string", desc: "Display name", required: true },
    { name: "email", type: "string", desc: "Email address" },
    { name: "phone", type: "string", desc: "Phone number" },
    { name: "billing_address", type: "string", desc: "Address as JSON" },
  ]},
  { name: "quickbooks_create_payment", desc: "Create a QuickBooks payment", params: [
    { name: "customer_ref", type: "string", desc: "Customer reference ID", required: true },
    { name: "total_amount", type: "number", desc: "Payment amount", required: true },
    { name: "payment_method", type: "string", desc: "Payment method" },
  ]},
  { name: "quickbooks_get_report", desc: "Get a QuickBooks report", params: [
    { name: "report_type", type: "string", desc: "Report type", required: true },
    { name: "start_date", type: "string", desc: "Start date" },
    { name: "end_date", type: "string", desc: "End date" },
  ]},
  { name: "xero_create_invoice", desc: "Create a Xero invoice", params: [
    { name: "contact_id", type: "string", desc: "Contact ID", required: true },
    { name: "line_items", type: "string", desc: "Line items as JSON", required: true },
    { name: "due_date", type: "string", desc: "Due date" },
    { name: "reference", type: "string", desc: "Invoice reference" },
  ]},
  { name: "xero_create_contact", desc: "Create a Xero contact", params: [
    { name: "name", type: "string", desc: "Contact name", required: true },
    { name: "email", type: "string", desc: "Email address" },
    { name: "phone", type: "string", desc: "Phone number" },
  ]},
  { name: "xero_create_payment", desc: "Create a Xero payment", params: [
    { name: "invoice_id", type: "string", desc: "Invoice ID", required: true },
    { name: "account_id", type: "string", desc: "Bank account ID", required: true },
    { name: "amount", type: "number", desc: "Payment amount", required: true },
    { name: "date", type: "string", desc: "Payment date" },
  ]},
  { name: "plaid_create_link_token", desc: "Create a Plaid Link token", params: [
    { name: "client_user_id", type: "string", desc: "User ID", required: true },
    { name: "products", type: "array", desc: "Plaid products" },
    { name: "country_codes", type: "array", desc: "Country codes" },
  ]},
  { name: "plaid_get_accounts", desc: "Get accounts from Plaid", params: [
    { name: "access_token", type: "string", desc: "Plaid access token", required: true },
  ]},
  { name: "plaid_get_transactions", desc: "Get transactions from Plaid", params: [
    { name: "access_token", type: "string", desc: "Plaid access token", required: true },
    { name: "start_date", type: "string", desc: "Start date YYYY-MM-DD", required: true },
    { name: "end_date", type: "string", desc: "End date YYYY-MM-DD", required: true },
  ]},
  { name: "plaid_get_balance", desc: "Get account balances from Plaid", params: [
    { name: "access_token", type: "string", desc: "Plaid access token", required: true },
    { name: "account_ids", type: "array", desc: "Filter by account IDs" },
  ]},
  { name: "wise_create_transfer", desc: "Create a Wise transfer", params: [
    { name: "source_currency", type: "string", desc: "Source currency", required: true },
    { name: "target_currency", type: "string", desc: "Target currency", required: true },
    { name: "source_amount", type: "number", desc: "Source amount", required: true },
    { name: "recipient_id", type: "string", desc: "Recipient ID", required: true },
  ]},
  { name: "wise_get_exchange_rate", desc: "Get Wise exchange rate", params: [
    { name: "source", type: "string", desc: "Source currency", required: true },
    { name: "target", type: "string", desc: "Target currency", required: true },
  ]},
  { name: "wise_create_recipient", desc: "Create a Wise recipient", params: [
    { name: "currency", type: "string", desc: "Currency", required: true },
    { name: "type", type: "string", desc: "Recipient type", required: true },
    { name: "account_holder_name", type: "string", desc: "Account holder name", required: true },
    { name: "details", type: "string", desc: "Bank details as JSON", required: true },
  ]},
  { name: "chargebee_create_subscription", desc: "Create a Chargebee subscription", params: [
    { name: "customer_id", type: "string", desc: "Customer ID", required: true },
    { name: "plan_id", type: "string", desc: "Plan ID", required: true },
    { name: "billing_cycles", type: "number", desc: "Number of billing cycles" },
    { name: "trial_end", type: "number", desc: "Trial end timestamp" },
  ]},
  { name: "chargebee_cancel_subscription", desc: "Cancel a Chargebee subscription", params: [
    { name: "subscription_id", type: "string", desc: "Subscription ID", required: true },
    { name: "end_of_term", type: "boolean", desc: "Cancel at end of term" },
  ]},
  { name: "recurly_create_subscription", desc: "Create a Recurly subscription", params: [
    { name: "plan_code", type: "string", desc: "Plan code", required: true },
    { name: "account_code", type: "string", desc: "Account code", required: true },
    { name: "currency", type: "string", desc: "Currency code" },
  ]},
  { name: "recurly_update_subscription", desc: "Update a Recurly subscription", params: [
    { name: "subscription_id", type: "string", desc: "Subscription ID", required: true },
    { name: "plan_code", type: "string", desc: "New plan code" },
    { name: "quantity", type: "number", desc: "New quantity" },
  ]},
];
