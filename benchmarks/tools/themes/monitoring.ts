/**
 * Monitoring & Alerting Tools - 30 tools
 */
export const MONITORING_TOOLS = [
  { name: "datadog_create_monitor", desc: "Create a Datadog monitor/alert", params: [
    { name: "name", type: "string", desc: "Monitor name", required: true },
    { name: "type", type: "string", desc: "Monitor type (metric, log, etc.)", required: true },
    { name: "query", type: "string", desc: "Monitor query", required: true },
    { name: "message", type: "string", desc: "Alert message" },
    { name: "thresholds", type: "string", desc: "Threshold values as JSON" },
    { name: "tags", type: "array", desc: "Monitor tags" },
  ]},
  { name: "datadog_get_monitor", desc: "Get Datadog monitor details", params: [
    { name: "monitor_id", type: "number", desc: "Monitor ID", required: true },
  ]},
  { name: "datadog_update_monitor", desc: "Update a Datadog monitor", params: [
    { name: "monitor_id", type: "number", desc: "Monitor ID", required: true },
    { name: "name", type: "string", desc: "New name" },
    { name: "query", type: "string", desc: "New query" },
    { name: "message", type: "string", desc: "New message" },
  ]},
  { name: "datadog_mute_monitor", desc: "Mute a Datadog monitor", params: [
    { name: "monitor_id", type: "number", desc: "Monitor ID", required: true },
    { name: "end", type: "number", desc: "Unix timestamp when mute ends" },
  ]},
  { name: "datadog_list_monitors", desc: "List Datadog monitors", params: [
    { name: "tags", type: "array", desc: "Filter by tags" },
    { name: "name", type: "string", desc: "Filter by name" },
  ]},
  { name: "datadog_query_metrics", desc: "Query Datadog metrics", params: [
    { name: "query", type: "string", desc: "Metrics query", required: true },
    { name: "from", type: "number", desc: "Start timestamp", required: true },
    { name: "to", type: "number", desc: "End timestamp", required: true },
  ]},
  { name: "datadog_post_event", desc: "Post an event to Datadog", params: [
    { name: "title", type: "string", desc: "Event title", required: true },
    { name: "text", type: "string", desc: "Event text", required: true },
    { name: "alert_type", type: "string", desc: "Alert type (info, warning, error)" },
    { name: "tags", type: "array", desc: "Event tags" },
  ]},
  { name: "pagerduty_create_incident", desc: "Create a PagerDuty incident", params: [
    { name: "service_id", type: "string", desc: "Service ID", required: true },
    { name: "title", type: "string", desc: "Incident title", required: true },
    { name: "urgency", type: "string", desc: "Urgency (high, low)" },
    { name: "body", type: "string", desc: "Incident details" },
  ]},
  { name: "pagerduty_acknowledge_incident", desc: "Acknowledge a PagerDuty incident", params: [
    { name: "incident_id", type: "string", desc: "Incident ID", required: true },
  ]},
  { name: "pagerduty_resolve_incident", desc: "Resolve a PagerDuty incident", params: [
    { name: "incident_id", type: "string", desc: "Incident ID", required: true },
    { name: "resolution", type: "string", desc: "Resolution note" },
  ]},
  { name: "pagerduty_list_incidents", desc: "List PagerDuty incidents", params: [
    { name: "status", type: "array", desc: "Filter by status" },
    { name: "service_ids", type: "array", desc: "Filter by service" },
    { name: "since", type: "string", desc: "Since date ISO" },
    { name: "until", type: "string", desc: "Until date ISO" },
  ]},
  { name: "pagerduty_add_note", desc: "Add a note to a PagerDuty incident", params: [
    { name: "incident_id", type: "string", desc: "Incident ID", required: true },
    { name: "content", type: "string", desc: "Note content", required: true },
  ]},
  { name: "prometheus_query", desc: "Execute a PromQL query", params: [
    { name: "query", type: "string", desc: "PromQL query", required: true },
    { name: "time", type: "string", desc: "Evaluation timestamp" },
  ]},
  { name: "prometheus_query_range", desc: "Execute a PromQL range query", params: [
    { name: "query", type: "string", desc: "PromQL query", required: true },
    { name: "start", type: "string", desc: "Start time", required: true },
    { name: "end", type: "string", desc: "End time", required: true },
    { name: "step", type: "string", desc: "Query step" },
  ]},
  { name: "prometheus_list_alerts", desc: "List active Prometheus alerts", params: [
    { name: "state", type: "string", desc: "Filter by state (firing, pending)" },
  ]},
  { name: "grafana_create_dashboard", desc: "Create a Grafana dashboard", params: [
    { name: "title", type: "string", desc: "Dashboard title", required: true },
    { name: "panels", type: "string", desc: "Panels configuration as JSON" },
    { name: "folder_id", type: "number", desc: "Folder ID" },
    { name: "tags", type: "array", desc: "Dashboard tags" },
  ]},
  { name: "grafana_update_dashboard", desc: "Update a Grafana dashboard", params: [
    { name: "uid", type: "string", desc: "Dashboard UID", required: true },
    { name: "dashboard", type: "string", desc: "Dashboard JSON", required: true },
    { name: "overwrite", type: "boolean", desc: "Overwrite existing" },
  ]},
  { name: "grafana_delete_dashboard", desc: "Delete a Grafana dashboard", params: [
    { name: "uid", type: "string", desc: "Dashboard UID", required: true },
  ]},
  { name: "grafana_list_dashboards", desc: "List Grafana dashboards", params: [
    { name: "query", type: "string", desc: "Search query" },
    { name: "tag", type: "array", desc: "Filter by tags" },
    { name: "folder_id", type: "number", desc: "Filter by folder" },
  ]},
  { name: "grafana_create_alert_rule", desc: "Create a Grafana alert rule", params: [
    { name: "name", type: "string", desc: "Rule name", required: true },
    { name: "condition", type: "string", desc: "Alert condition", required: true },
    { name: "for", type: "string", desc: "Pending duration" },
    { name: "labels", type: "string", desc: "Labels as JSON" },
    { name: "annotations", type: "string", desc: "Annotations as JSON" },
  ]},
  { name: "newrelic_create_alert_policy", desc: "Create a New Relic alert policy", params: [
    { name: "name", type: "string", desc: "Policy name", required: true },
    { name: "incident_preference", type: "string", desc: "Incident preference" },
  ]},
  { name: "newrelic_create_alert_condition", desc: "Create a New Relic alert condition", params: [
    { name: "policy_id", type: "number", desc: "Policy ID", required: true },
    { name: "name", type: "string", desc: "Condition name", required: true },
    { name: "type", type: "string", desc: "Condition type", required: true },
    { name: "metric", type: "string", desc: "Metric name" },
    { name: "threshold", type: "number", desc: "Threshold value" },
  ]},
  { name: "newrelic_query_nrql", desc: "Execute a NRQL query", params: [
    { name: "account_id", type: "number", desc: "Account ID", required: true },
    { name: "query", type: "string", desc: "NRQL query", required: true },
  ]},
  { name: "opsgenie_create_alert", desc: "Create an OpsGenie alert", params: [
    { name: "message", type: "string", desc: "Alert message", required: true },
    { name: "priority", type: "string", desc: "Priority (P1-P5)" },
    { name: "source", type: "string", desc: "Alert source" },
    { name: "tags", type: "array", desc: "Alert tags" },
    { name: "details", type: "string", desc: "Additional details as JSON" },
  ]},
  { name: "opsgenie_acknowledge_alert", desc: "Acknowledge an OpsGenie alert", params: [
    { name: "alert_id", type: "string", desc: "Alert ID", required: true },
    { name: "note", type: "string", desc: "Acknowledgement note" },
  ]},
  { name: "opsgenie_close_alert", desc: "Close an OpsGenie alert", params: [
    { name: "alert_id", type: "string", desc: "Alert ID", required: true },
    { name: "note", type: "string", desc: "Closing note" },
  ]},
  { name: "sentry_create_issue", desc: "Create a Sentry issue", params: [
    { name: "project", type: "string", desc: "Project slug", required: true },
    { name: "title", type: "string", desc: "Issue title", required: true },
    { name: "level", type: "string", desc: "Severity level" },
    { name: "tags", type: "string", desc: "Tags as JSON" },
  ]},
  { name: "sentry_resolve_issue", desc: "Resolve a Sentry issue", params: [
    { name: "issue_id", type: "string", desc: "Issue ID", required: true },
  ]},
  { name: "sentry_list_issues", desc: "List Sentry issues", params: [
    { name: "project", type: "string", desc: "Project slug" },
    { name: "query", type: "string", desc: "Search query" },
    { name: "status", type: "string", desc: "Filter by status" },
  ]},
  { name: "uptime_create_check", desc: "Create an uptime monitoring check", params: [
    { name: "name", type: "string", desc: "Check name", required: true },
    { name: "url", type: "string", desc: "URL to monitor", required: true },
    { name: "interval", type: "number", desc: "Check interval seconds" },
    { name: "alert_contacts", type: "array", desc: "Contact IDs to notify" },
  ]},
];
