/**
 * Security & Compliance Tools - 30 tools
 */
export const SECURITY_TOOLS = [
  { name: "vault_read_secret", desc: "Read a secret from HashiCorp Vault", params: [
    { name: "path", type: "string", desc: "Secret path", required: true },
    { name: "version", type: "number", desc: "Secret version" },
  ]},
  { name: "vault_write_secret", desc: "Write a secret to HashiCorp Vault", params: [
    { name: "path", type: "string", desc: "Secret path", required: true },
    { name: "data", type: "string", desc: "Secret data as JSON", required: true },
  ]},
  { name: "vault_delete_secret", desc: "Delete a secret from Vault", params: [
    { name: "path", type: "string", desc: "Secret path", required: true },
  ]},
  { name: "vault_list_secrets", desc: "List secrets at a path", params: [
    { name: "path", type: "string", desc: "Secret path", required: true },
  ]},
  { name: "vault_create_token", desc: "Create a Vault access token", params: [
    { name: "policies", type: "array", desc: "Token policies" },
    { name: "ttl", type: "string", desc: "Time to live" },
    { name: "renewable", type: "boolean", desc: "Allow renewal" },
  ]},
  { name: "vault_revoke_token", desc: "Revoke a Vault token", params: [
    { name: "token", type: "string", desc: "Token to revoke", required: true },
  ]},
  { name: "snyk_test_project", desc: "Test a project for vulnerabilities with Snyk", params: [
    { name: "project_path", type: "string", desc: "Project path", required: true },
    { name: "all_projects", type: "boolean", desc: "Test all projects in directory" },
  ]},
  { name: "snyk_list_issues", desc: "List Snyk security issues", params: [
    { name: "org_id", type: "string", desc: "Organization ID", required: true },
    { name: "project_id", type: "string", desc: "Project ID" },
    { name: "severity", type: "array", desc: "Filter by severity" },
  ]},
  { name: "snyk_ignore_issue", desc: "Ignore a Snyk issue", params: [
    { name: "issue_id", type: "string", desc: "Issue ID", required: true },
    { name: "reason", type: "string", desc: "Ignore reason", required: true },
    { name: "expires", type: "string", desc: "Expiration date" },
  ]},
  { name: "trivy_scan_image", desc: "Scan a container image with Trivy", params: [
    { name: "image", type: "string", desc: "Image to scan", required: true },
    { name: "severity", type: "string", desc: "Minimum severity" },
    { name: "ignore_unfixed", type: "boolean", desc: "Ignore unfixed vulnerabilities" },
  ]},
  { name: "trivy_scan_filesystem", desc: "Scan filesystem with Trivy", params: [
    { name: "path", type: "string", desc: "Path to scan", required: true },
    { name: "scanners", type: "array", desc: "Scanners to use (vuln, secret, config)" },
  ]},
  { name: "aws_guardduty_list_findings", desc: "List AWS GuardDuty findings", params: [
    { name: "detector_id", type: "string", desc: "Detector ID", required: true },
    { name: "severity", type: "number", desc: "Minimum severity" },
  ]},
  { name: "aws_guardduty_archive_findings", desc: "Archive GuardDuty findings", params: [
    { name: "detector_id", type: "string", desc: "Detector ID", required: true },
    { name: "finding_ids", type: "array", desc: "Finding IDs to archive", required: true },
  ]},
  { name: "aws_securityhub_get_findings", desc: "Get AWS Security Hub findings", params: [
    { name: "filters", type: "string", desc: "Filters as JSON" },
    { name: "max_results", type: "number", desc: "Maximum results" },
  ]},
  { name: "aws_securityhub_update_findings", desc: "Update Security Hub finding status", params: [
    { name: "finding_ids", type: "array", desc: "Finding identifiers", required: true },
    { name: "workflow_status", type: "string", desc: "New workflow status", required: true },
    { name: "note", type: "string", desc: "Update note" },
  ]},
  { name: "crowdstrike_search_devices", desc: "Search CrowdStrike devices", params: [
    { name: "filter", type: "string", desc: "FQL filter" },
    { name: "limit", type: "number", desc: "Maximum results" },
  ]},
  { name: "crowdstrike_contain_host", desc: "Network contain a host", params: [
    { name: "device_id", type: "string", desc: "Device ID", required: true },
  ]},
  { name: "crowdstrike_lift_containment", desc: "Lift network containment", params: [
    { name: "device_id", type: "string", desc: "Device ID", required: true },
  ]},
  { name: "crowdstrike_get_detections", desc: "Get CrowdStrike detections", params: [
    { name: "filter", type: "string", desc: "FQL filter" },
    { name: "sort", type: "string", desc: "Sort order" },
  ]},
  { name: "okta_list_users", desc: "List Okta users", params: [
    { name: "search", type: "string", desc: "Search query" },
    { name: "filter", type: "string", desc: "Filter expression" },
    { name: "limit", type: "number", desc: "Maximum results" },
  ]},
  { name: "okta_suspend_user", desc: "Suspend an Okta user", params: [
    { name: "user_id", type: "string", desc: "User ID", required: true },
  ]},
  { name: "okta_unsuspend_user", desc: "Unsuspend an Okta user", params: [
    { name: "user_id", type: "string", desc: "User ID", required: true },
  ]},
  { name: "okta_reset_password", desc: "Reset an Okta user's password", params: [
    { name: "user_id", type: "string", desc: "User ID", required: true },
    { name: "send_email", type: "boolean", desc: "Send password reset email" },
  ]},
  { name: "okta_revoke_sessions", desc: "Revoke all sessions for a user", params: [
    { name: "user_id", type: "string", desc: "User ID", required: true },
  ]},
  { name: "sonarqube_analyze_project", desc: "Analyze a project with SonarQube", params: [
    { name: "project_key", type: "string", desc: "Project key", required: true },
    { name: "sources", type: "string", desc: "Source directory" },
  ]},
  { name: "sonarqube_get_issues", desc: "Get SonarQube issues", params: [
    { name: "project_key", type: "string", desc: "Project key", required: true },
    { name: "severities", type: "array", desc: "Filter by severity" },
    { name: "types", type: "array", desc: "Filter by type" },
  ]},
  { name: "sonarqube_get_quality_gate", desc: "Get quality gate status", params: [
    { name: "project_key", type: "string", desc: "Project key", required: true },
  ]},
  { name: "dependabot_list_alerts", desc: "List Dependabot alerts", params: [
    { name: "repo", type: "string", desc: "Repository (owner/name)", required: true },
    { name: "state", type: "string", desc: "Alert state" },
    { name: "severity", type: "string", desc: "Filter by severity" },
  ]},
  { name: "dependabot_dismiss_alert", desc: "Dismiss a Dependabot alert", params: [
    { name: "repo", type: "string", desc: "Repository (owner/name)", required: true },
    { name: "alert_number", type: "number", desc: "Alert number", required: true },
    { name: "reason", type: "string", desc: "Dismissal reason", required: true },
  ]},
  { name: "audit_log_search", desc: "Search audit logs", params: [
    { name: "start_time", type: "string", desc: "Start time ISO", required: true },
    { name: "end_time", type: "string", desc: "End time ISO", required: true },
    { name: "actor", type: "string", desc: "Filter by actor" },
    { name: "action", type: "string", desc: "Filter by action" },
    { name: "resource", type: "string", desc: "Filter by resource" },
  ]},
];
