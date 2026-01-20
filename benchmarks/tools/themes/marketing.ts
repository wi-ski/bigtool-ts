/**
 * Marketing Automation Tools - 30 tools
 */
export const MARKETING_TOOLS = [
  { name: "hubspot_create_contact", desc: "Create a HubSpot contact", params: [
    { name: "email", type: "string", desc: "Contact email", required: true },
    { name: "firstname", type: "string", desc: "First name" },
    { name: "lastname", type: "string", desc: "Last name" },
    { name: "company", type: "string", desc: "Company name" },
    { name: "phone", type: "string", desc: "Phone number" },
    { name: "properties", type: "string", desc: "Additional properties as JSON" },
  ]},
  { name: "hubspot_update_contact", desc: "Update a HubSpot contact", params: [
    { name: "contact_id", type: "string", desc: "Contact ID", required: true },
    { name: "properties", type: "string", desc: "Properties to update as JSON", required: true },
  ]},
  { name: "hubspot_search_contacts", desc: "Search HubSpot contacts", params: [
    { name: "query", type: "string", desc: "Search query" },
    { name: "filters", type: "string", desc: "Filters as JSON" },
    { name: "limit", type: "number", desc: "Maximum results" },
  ]},
  { name: "hubspot_create_deal", desc: "Create a HubSpot deal", params: [
    { name: "dealname", type: "string", desc: "Deal name", required: true },
    { name: "pipeline", type: "string", desc: "Pipeline ID" },
    { name: "dealstage", type: "string", desc: "Deal stage" },
    { name: "amount", type: "number", desc: "Deal amount" },
    { name: "associated_contacts", type: "array", desc: "Contact IDs to associate" },
  ]},
  { name: "hubspot_update_deal", desc: "Update a HubSpot deal", params: [
    { name: "deal_id", type: "string", desc: "Deal ID", required: true },
    { name: "properties", type: "string", desc: "Properties to update as JSON", required: true },
  ]},
  { name: "hubspot_create_company", desc: "Create a HubSpot company", params: [
    { name: "name", type: "string", desc: "Company name", required: true },
    { name: "domain", type: "string", desc: "Company domain" },
    { name: "industry", type: "string", desc: "Industry" },
    { name: "properties", type: "string", desc: "Additional properties as JSON" },
  ]},
  { name: "mailchimp_add_subscriber", desc: "Add a subscriber to Mailchimp list", params: [
    { name: "list_id", type: "string", desc: "List ID", required: true },
    { name: "email", type: "string", desc: "Email address", required: true },
    { name: "status", type: "string", desc: "Status (subscribed, pending, etc.)" },
    { name: "merge_fields", type: "string", desc: "Merge fields as JSON" },
    { name: "tags", type: "array", desc: "Tags to add" },
  ]},
  { name: "mailchimp_update_subscriber", desc: "Update a Mailchimp subscriber", params: [
    { name: "list_id", type: "string", desc: "List ID", required: true },
    { name: "email", type: "string", desc: "Subscriber email", required: true },
    { name: "merge_fields", type: "string", desc: "Merge fields to update as JSON" },
    { name: "status", type: "string", desc: "New status" },
  ]},
  { name: "mailchimp_send_campaign", desc: "Send a Mailchimp campaign", params: [
    { name: "campaign_id", type: "string", desc: "Campaign ID", required: true },
  ]},
  { name: "mailchimp_create_campaign", desc: "Create a Mailchimp campaign", params: [
    { name: "list_id", type: "string", desc: "List ID", required: true },
    { name: "subject", type: "string", desc: "Email subject", required: true },
    { name: "from_name", type: "string", desc: "From name", required: true },
    { name: "reply_to", type: "string", desc: "Reply-to email", required: true },
    { name: "template_id", type: "number", desc: "Template ID" },
  ]},
  { name: "sendgrid_send_email", desc: "Send an email via SendGrid", params: [
    { name: "to", type: "array", desc: "Recipient emails", required: true },
    { name: "from", type: "string", desc: "From email", required: true },
    { name: "subject", type: "string", desc: "Email subject", required: true },
    { name: "content", type: "string", desc: "Email content", required: true },
    { name: "template_id", type: "string", desc: "Template ID" },
    { name: "dynamic_template_data", type: "string", desc: "Template data as JSON" },
  ]},
  { name: "sendgrid_add_contact", desc: "Add a contact to SendGrid", params: [
    { name: "email", type: "string", desc: "Contact email", required: true },
    { name: "first_name", type: "string", desc: "First name" },
    { name: "last_name", type: "string", desc: "Last name" },
    { name: "list_ids", type: "array", desc: "List IDs to add to" },
    { name: "custom_fields", type: "string", desc: "Custom fields as JSON" },
  ]},
  { name: "segment_identify", desc: "Identify a user in Segment", params: [
    { name: "user_id", type: "string", desc: "User ID", required: true },
    { name: "traits", type: "string", desc: "User traits as JSON" },
  ]},
  { name: "segment_track", desc: "Track an event in Segment", params: [
    { name: "user_id", type: "string", desc: "User ID", required: true },
    { name: "event", type: "string", desc: "Event name", required: true },
    { name: "properties", type: "string", desc: "Event properties as JSON" },
  ]},
  { name: "segment_group", desc: "Associate a user with a group in Segment", params: [
    { name: "user_id", type: "string", desc: "User ID", required: true },
    { name: "group_id", type: "string", desc: "Group ID", required: true },
    { name: "traits", type: "string", desc: "Group traits as JSON" },
  ]},
  { name: "google_ads_create_campaign", desc: "Create a Google Ads campaign", params: [
    { name: "name", type: "string", desc: "Campaign name", required: true },
    { name: "budget", type: "number", desc: "Daily budget", required: true },
    { name: "type", type: "string", desc: "Campaign type" },
    { name: "status", type: "string", desc: "Campaign status" },
  ]},
  { name: "google_ads_update_campaign", desc: "Update a Google Ads campaign", params: [
    { name: "campaign_id", type: "string", desc: "Campaign ID", required: true },
    { name: "name", type: "string", desc: "New name" },
    { name: "budget", type: "number", desc: "New budget" },
    { name: "status", type: "string", desc: "New status" },
  ]},
  { name: "google_ads_get_report", desc: "Get Google Ads performance report", params: [
    { name: "campaign_id", type: "string", desc: "Campaign ID" },
    { name: "start_date", type: "string", desc: "Start date YYYY-MM-DD" },
    { name: "end_date", type: "string", desc: "End date YYYY-MM-DD" },
    { name: "metrics", type: "array", desc: "Metrics to include" },
  ]},
  { name: "facebook_ads_create_campaign", desc: "Create a Facebook Ads campaign", params: [
    { name: "name", type: "string", desc: "Campaign name", required: true },
    { name: "objective", type: "string", desc: "Campaign objective", required: true },
    { name: "status", type: "string", desc: "Campaign status" },
    { name: "special_ad_categories", type: "array", desc: "Special ad categories" },
  ]},
  { name: "facebook_ads_get_insights", desc: "Get Facebook Ads insights", params: [
    { name: "campaign_id", type: "string", desc: "Campaign ID", required: true },
    { name: "date_preset", type: "string", desc: "Date preset" },
    { name: "fields", type: "array", desc: "Fields to include" },
  ]},
  { name: "mixpanel_track", desc: "Track an event in Mixpanel", params: [
    { name: "event", type: "string", desc: "Event name", required: true },
    { name: "distinct_id", type: "string", desc: "User ID", required: true },
    { name: "properties", type: "string", desc: "Event properties as JSON" },
  ]},
  { name: "mixpanel_set_profile", desc: "Set user profile in Mixpanel", params: [
    { name: "distinct_id", type: "string", desc: "User ID", required: true },
    { name: "properties", type: "string", desc: "Profile properties as JSON", required: true },
  ]},
  { name: "amplitude_track", desc: "Track an event in Amplitude", params: [
    { name: "event_type", type: "string", desc: "Event type", required: true },
    { name: "user_id", type: "string", desc: "User ID", required: true },
    { name: "event_properties", type: "string", desc: "Event properties as JSON" },
    { name: "user_properties", type: "string", desc: "User properties as JSON" },
  ]},
  { name: "amplitude_identify", desc: "Identify a user in Amplitude", params: [
    { name: "user_id", type: "string", desc: "User ID", required: true },
    { name: "user_properties", type: "string", desc: "User properties as JSON", required: true },
  ]},
  { name: "customerio_identify", desc: "Identify a customer in Customer.io", params: [
    { name: "id", type: "string", desc: "Customer ID", required: true },
    { name: "email", type: "string", desc: "Email address" },
    { name: "attributes", type: "string", desc: "Customer attributes as JSON" },
  ]},
  { name: "customerio_track", desc: "Track an event in Customer.io", params: [
    { name: "id", type: "string", desc: "Customer ID", required: true },
    { name: "name", type: "string", desc: "Event name", required: true },
    { name: "data", type: "string", desc: "Event data as JSON" },
  ]},
  { name: "customerio_send_push", desc: "Send a push notification via Customer.io", params: [
    { name: "id", type: "string", desc: "Customer ID", required: true },
    { name: "title", type: "string", desc: "Push title", required: true },
    { name: "message", type: "string", desc: "Push message", required: true },
    { name: "link", type: "string", desc: "Deep link URL" },
  ]},
  { name: "braze_track_user", desc: "Track a user in Braze", params: [
    { name: "external_id", type: "string", desc: "External user ID", required: true },
    { name: "attributes", type: "string", desc: "User attributes as JSON" },
    { name: "events", type: "string", desc: "Events as JSON" },
  ]},
  { name: "braze_send_campaign", desc: "Trigger a Braze campaign", params: [
    { name: "campaign_id", type: "string", desc: "Campaign ID", required: true },
    { name: "recipients", type: "string", desc: "Recipients as JSON", required: true },
  ]},
  { name: "klaviyo_add_profile", desc: "Add a profile to Klaviyo", params: [
    { name: "email", type: "string", desc: "Email address", required: true },
    { name: "first_name", type: "string", desc: "First name" },
    { name: "last_name", type: "string", desc: "Last name" },
    { name: "properties", type: "string", desc: "Custom properties as JSON" },
  ]},
];
