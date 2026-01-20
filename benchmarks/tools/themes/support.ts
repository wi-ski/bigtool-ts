/**
 * Customer Support Tools - 30 tools
 */
export const SUPPORT_TOOLS = [
  { name: "zendesk_create_ticket", desc: "Create a Zendesk support ticket", params: [
    { name: "subject", type: "string", desc: "Ticket subject", required: true },
    { name: "description", type: "string", desc: "Ticket description", required: true },
    { name: "requester_email", type: "string", desc: "Requester email" },
    { name: "priority", type: "string", desc: "Priority (low, normal, high, urgent)" },
    { name: "type", type: "string", desc: "Ticket type" },
    { name: "tags", type: "array", desc: "Ticket tags" },
  ]},
  { name: "zendesk_update_ticket", desc: "Update a Zendesk ticket", params: [
    { name: "ticket_id", type: "number", desc: "Ticket ID", required: true },
    { name: "status", type: "string", desc: "New status" },
    { name: "priority", type: "string", desc: "New priority" },
    { name: "assignee_id", type: "number", desc: "Assignee ID" },
    { name: "comment", type: "string", desc: "Add comment" },
  ]},
  { name: "zendesk_get_ticket", desc: "Get Zendesk ticket details", params: [
    { name: "ticket_id", type: "number", desc: "Ticket ID", required: true },
  ]},
  { name: "zendesk_search_tickets", desc: "Search Zendesk tickets", params: [
    { name: "query", type: "string", desc: "Search query", required: true },
    { name: "sort_by", type: "string", desc: "Sort field" },
    { name: "sort_order", type: "string", desc: "Sort order" },
  ]},
  { name: "zendesk_add_comment", desc: "Add a comment to a Zendesk ticket", params: [
    { name: "ticket_id", type: "number", desc: "Ticket ID", required: true },
    { name: "body", type: "string", desc: "Comment body", required: true },
    { name: "public", type: "boolean", desc: "Public or internal comment" },
  ]},
  { name: "zendesk_list_tickets", desc: "List Zendesk tickets", params: [
    { name: "status", type: "string", desc: "Filter by status" },
    { name: "assignee", type: "number", desc: "Filter by assignee" },
    { name: "requester", type: "number", desc: "Filter by requester" },
  ]},
  { name: "intercom_create_conversation", desc: "Create an Intercom conversation", params: [
    { name: "user_id", type: "string", desc: "User ID", required: true },
    { name: "body", type: "string", desc: "Message body", required: true },
  ]},
  { name: "intercom_reply_conversation", desc: "Reply to an Intercom conversation", params: [
    { name: "conversation_id", type: "string", desc: "Conversation ID", required: true },
    { name: "body", type: "string", desc: "Reply body", required: true },
    { name: "message_type", type: "string", desc: "Message type (comment, note)" },
  ]},
  { name: "intercom_close_conversation", desc: "Close an Intercom conversation", params: [
    { name: "conversation_id", type: "string", desc: "Conversation ID", required: true },
  ]},
  { name: "intercom_search_conversations", desc: "Search Intercom conversations", params: [
    { name: "query", type: "string", desc: "Search query", required: true },
  ]},
  { name: "intercom_assign_conversation", desc: "Assign an Intercom conversation", params: [
    { name: "conversation_id", type: "string", desc: "Conversation ID", required: true },
    { name: "assignee_id", type: "string", desc: "Assignee ID", required: true },
  ]},
  { name: "freshdesk_create_ticket", desc: "Create a Freshdesk ticket", params: [
    { name: "subject", type: "string", desc: "Ticket subject", required: true },
    { name: "description", type: "string", desc: "Ticket description", required: true },
    { name: "email", type: "string", desc: "Requester email", required: true },
    { name: "priority", type: "number", desc: "Priority (1-4)" },
    { name: "status", type: "number", desc: "Status code" },
  ]},
  { name: "freshdesk_update_ticket", desc: "Update a Freshdesk ticket", params: [
    { name: "ticket_id", type: "number", desc: "Ticket ID", required: true },
    { name: "status", type: "number", desc: "New status" },
    { name: "priority", type: "number", desc: "New priority" },
    { name: "agent_id", type: "number", desc: "Assign to agent" },
  ]},
  { name: "freshdesk_reply_ticket", desc: "Reply to a Freshdesk ticket", params: [
    { name: "ticket_id", type: "number", desc: "Ticket ID", required: true },
    { name: "body", type: "string", desc: "Reply body", required: true },
  ]},
  { name: "helpscout_create_conversation", desc: "Create a Help Scout conversation", params: [
    { name: "mailbox_id", type: "number", desc: "Mailbox ID", required: true },
    { name: "customer_email", type: "string", desc: "Customer email", required: true },
    { name: "subject", type: "string", desc: "Conversation subject", required: true },
    { name: "body", type: "string", desc: "Message body", required: true },
  ]},
  { name: "helpscout_reply_conversation", desc: "Reply to a Help Scout conversation", params: [
    { name: "conversation_id", type: "number", desc: "Conversation ID", required: true },
    { name: "body", type: "string", desc: "Reply body", required: true },
    { name: "status", type: "string", desc: "New status" },
  ]},
  { name: "helpscout_update_conversation", desc: "Update a Help Scout conversation", params: [
    { name: "conversation_id", type: "number", desc: "Conversation ID", required: true },
    { name: "status", type: "string", desc: "New status" },
    { name: "assignee", type: "number", desc: "Assignee ID" },
    { name: "tags", type: "array", desc: "Tags" },
  ]},
  { name: "salesforce_create_case", desc: "Create a Salesforce support case", params: [
    { name: "subject", type: "string", desc: "Case subject", required: true },
    { name: "description", type: "string", desc: "Case description" },
    { name: "contact_id", type: "string", desc: "Contact ID" },
    { name: "account_id", type: "string", desc: "Account ID" },
    { name: "priority", type: "string", desc: "Priority" },
    { name: "origin", type: "string", desc: "Case origin" },
  ]},
  { name: "salesforce_update_case", desc: "Update a Salesforce case", params: [
    { name: "case_id", type: "string", desc: "Case ID", required: true },
    { name: "status", type: "string", desc: "New status" },
    { name: "priority", type: "string", desc: "New priority" },
    { name: "owner_id", type: "string", desc: "New owner" },
  ]},
  { name: "salesforce_add_case_comment", desc: "Add a comment to a Salesforce case", params: [
    { name: "case_id", type: "string", desc: "Case ID", required: true },
    { name: "body", type: "string", desc: "Comment body", required: true },
    { name: "is_public", type: "boolean", desc: "Public comment" },
  ]},
  { name: "statuspage_create_incident", desc: "Create a Statuspage incident", params: [
    { name: "name", type: "string", desc: "Incident name", required: true },
    { name: "status", type: "string", desc: "Incident status", required: true },
    { name: "body", type: "string", desc: "Incident description" },
    { name: "components", type: "array", desc: "Affected component IDs" },
    { name: "impact", type: "string", desc: "Impact level" },
  ]},
  { name: "statuspage_update_incident", desc: "Update a Statuspage incident", params: [
    { name: "incident_id", type: "string", desc: "Incident ID", required: true },
    { name: "status", type: "string", desc: "New status" },
    { name: "body", type: "string", desc: "Update message" },
  ]},
  { name: "statuspage_resolve_incident", desc: "Resolve a Statuspage incident", params: [
    { name: "incident_id", type: "string", desc: "Incident ID", required: true },
    { name: "body", type: "string", desc: "Resolution message" },
  ]},
  { name: "statuspage_create_maintenance", desc: "Create scheduled maintenance", params: [
    { name: "name", type: "string", desc: "Maintenance name", required: true },
    { name: "scheduled_for", type: "string", desc: "Start time ISO", required: true },
    { name: "scheduled_until", type: "string", desc: "End time ISO", required: true },
    { name: "components", type: "array", desc: "Affected component IDs" },
    { name: "body", type: "string", desc: "Description" },
  ]},
  { name: "front_create_conversation", desc: "Create a Front conversation", params: [
    { name: "inbox_id", type: "string", desc: "Inbox ID", required: true },
    { name: "to", type: "array", desc: "Recipients", required: true },
    { name: "subject", type: "string", desc: "Subject" },
    { name: "body", type: "string", desc: "Message body", required: true },
  ]},
  { name: "front_reply_conversation", desc: "Reply to a Front conversation", params: [
    { name: "conversation_id", type: "string", desc: "Conversation ID", required: true },
    { name: "body", type: "string", desc: "Reply body", required: true },
  ]},
  { name: "front_assign_conversation", desc: "Assign a Front conversation", params: [
    { name: "conversation_id", type: "string", desc: "Conversation ID", required: true },
    { name: "assignee_id", type: "string", desc: "Assignee ID", required: true },
  ]},
  { name: "crisp_send_message", desc: "Send a Crisp chat message", params: [
    { name: "website_id", type: "string", desc: "Website ID", required: true },
    { name: "session_id", type: "string", desc: "Session ID", required: true },
    { name: "content", type: "string", desc: "Message content", required: true },
    { name: "type", type: "string", desc: "Message type" },
  ]},
  { name: "crisp_resolve_conversation", desc: "Resolve a Crisp conversation", params: [
    { name: "website_id", type: "string", desc: "Website ID", required: true },
    { name: "session_id", type: "string", desc: "Session ID", required: true },
  ]},
  { name: "canny_create_post", desc: "Create a Canny feedback post", params: [
    { name: "board_id", type: "string", desc: "Board ID", required: true },
    { name: "title", type: "string", desc: "Post title", required: true },
    { name: "details", type: "string", desc: "Post details" },
    { name: "author_id", type: "string", desc: "Author ID" },
  ]},
];
