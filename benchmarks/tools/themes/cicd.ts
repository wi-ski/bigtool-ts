/**
 * CI/CD Pipeline Tools - 30 tools
 */
export const CICD_TOOLS = [
  { name: "github_actions_trigger", desc: "Trigger a GitHub Actions workflow", params: [
    { name: "repo", type: "string", desc: "Repository (owner/name)", required: true },
    { name: "workflow_id", type: "string", desc: "Workflow file name or ID", required: true },
    { name: "ref", type: "string", desc: "Git ref (branch/tag)" },
    { name: "inputs", type: "string", desc: "Workflow inputs as JSON" },
  ]},
  { name: "github_actions_list_runs", desc: "List workflow runs", params: [
    { name: "repo", type: "string", desc: "Repository (owner/name)", required: true },
    { name: "workflow_id", type: "string", desc: "Workflow file name or ID" },
    { name: "status", type: "string", desc: "Filter by status" },
    { name: "branch", type: "string", desc: "Filter by branch" },
  ]},
  { name: "github_actions_get_run", desc: "Get details of a workflow run", params: [
    { name: "repo", type: "string", desc: "Repository (owner/name)", required: true },
    { name: "run_id", type: "number", desc: "Workflow run ID", required: true },
  ]},
  { name: "github_actions_cancel_run", desc: "Cancel a workflow run", params: [
    { name: "repo", type: "string", desc: "Repository (owner/name)", required: true },
    { name: "run_id", type: "number", desc: "Workflow run ID", required: true },
  ]},
  { name: "github_actions_rerun", desc: "Re-run a failed workflow", params: [
    { name: "repo", type: "string", desc: "Repository (owner/name)", required: true },
    { name: "run_id", type: "number", desc: "Workflow run ID", required: true },
    { name: "only_failed", type: "boolean", desc: "Only re-run failed jobs" },
  ]},
  { name: "github_actions_get_logs", desc: "Download workflow run logs", params: [
    { name: "repo", type: "string", desc: "Repository (owner/name)", required: true },
    { name: "run_id", type: "number", desc: "Workflow run ID", required: true },
  ]},
  { name: "jenkins_trigger_build", desc: "Trigger a Jenkins build", params: [
    { name: "job_name", type: "string", desc: "Jenkins job name", required: true },
    { name: "parameters", type: "string", desc: "Build parameters as JSON" },
    { name: "token", type: "string", desc: "Build trigger token" },
  ]},
  { name: "jenkins_get_build", desc: "Get Jenkins build details", params: [
    { name: "job_name", type: "string", desc: "Jenkins job name", required: true },
    { name: "build_number", type: "number", desc: "Build number", required: true },
  ]},
  { name: "jenkins_abort_build", desc: "Abort a running Jenkins build", params: [
    { name: "job_name", type: "string", desc: "Jenkins job name", required: true },
    { name: "build_number", type: "number", desc: "Build number", required: true },
  ]},
  { name: "jenkins_get_console_output", desc: "Get Jenkins build console output", params: [
    { name: "job_name", type: "string", desc: "Jenkins job name", required: true },
    { name: "build_number", type: "number", desc: "Build number", required: true },
  ]},
  { name: "jenkins_list_jobs", desc: "List Jenkins jobs", params: [
    { name: "folder", type: "string", desc: "Folder path" },
  ]},
  { name: "circleci_trigger_pipeline", desc: "Trigger a CircleCI pipeline", params: [
    { name: "project_slug", type: "string", desc: "Project slug (vcs/org/repo)", required: true },
    { name: "branch", type: "string", desc: "Branch to build" },
    { name: "tag", type: "string", desc: "Tag to build" },
    { name: "parameters", type: "string", desc: "Pipeline parameters as JSON" },
  ]},
  { name: "circleci_get_pipeline", desc: "Get CircleCI pipeline details", params: [
    { name: "pipeline_id", type: "string", desc: "Pipeline ID", required: true },
  ]},
  { name: "circleci_list_workflows", desc: "List workflows in a pipeline", params: [
    { name: "pipeline_id", type: "string", desc: "Pipeline ID", required: true },
  ]},
  { name: "circleci_cancel_workflow", desc: "Cancel a CircleCI workflow", params: [
    { name: "workflow_id", type: "string", desc: "Workflow ID", required: true },
  ]},
  { name: "gitlab_trigger_pipeline", desc: "Trigger a GitLab CI/CD pipeline", params: [
    { name: "project_id", type: "string", desc: "Project ID or path", required: true },
    { name: "ref", type: "string", desc: "Branch or tag ref", required: true },
    { name: "variables", type: "string", desc: "Pipeline variables as JSON" },
  ]},
  { name: "gitlab_get_pipeline", desc: "Get GitLab pipeline details", params: [
    { name: "project_id", type: "string", desc: "Project ID or path", required: true },
    { name: "pipeline_id", type: "number", desc: "Pipeline ID", required: true },
  ]},
  { name: "gitlab_retry_pipeline", desc: "Retry a failed GitLab pipeline", params: [
    { name: "project_id", type: "string", desc: "Project ID or path", required: true },
    { name: "pipeline_id", type: "number", desc: "Pipeline ID", required: true },
  ]},
  { name: "gitlab_cancel_pipeline", desc: "Cancel a running GitLab pipeline", params: [
    { name: "project_id", type: "string", desc: "Project ID or path", required: true },
    { name: "pipeline_id", type: "number", desc: "Pipeline ID", required: true },
  ]},
  { name: "gitlab_get_job_log", desc: "Get GitLab job log output", params: [
    { name: "project_id", type: "string", desc: "Project ID or path", required: true },
    { name: "job_id", type: "number", desc: "Job ID", required: true },
  ]},
  { name: "argocd_sync_app", desc: "Sync an Argo CD application", params: [
    { name: "app_name", type: "string", desc: "Application name", required: true },
    { name: "revision", type: "string", desc: "Target revision" },
    { name: "prune", type: "boolean", desc: "Prune resources" },
    { name: "dry_run", type: "boolean", desc: "Dry run mode" },
  ]},
  { name: "argocd_get_app", desc: "Get Argo CD application status", params: [
    { name: "app_name", type: "string", desc: "Application name", required: true },
  ]},
  { name: "argocd_list_apps", desc: "List Argo CD applications", params: [
    { name: "project", type: "string", desc: "Filter by project" },
    { name: "selector", type: "string", desc: "Label selector" },
  ]},
  { name: "argocd_rollback", desc: "Rollback an Argo CD application", params: [
    { name: "app_name", type: "string", desc: "Application name", required: true },
    { name: "revision", type: "number", desc: "Revision to rollback to", required: true },
  ]},
  { name: "argocd_create_app", desc: "Create an Argo CD application", params: [
    { name: "app_name", type: "string", desc: "Application name", required: true },
    { name: "repo_url", type: "string", desc: "Git repository URL", required: true },
    { name: "path", type: "string", desc: "Path in repository", required: true },
    { name: "dest_server", type: "string", desc: "Destination cluster" },
    { name: "dest_namespace", type: "string", desc: "Destination namespace" },
    { name: "project", type: "string", desc: "Argo CD project" },
  ]},
  { name: "docker_build", desc: "Build a Docker image", params: [
    { name: "dockerfile", type: "string", desc: "Dockerfile path" },
    { name: "context", type: "string", desc: "Build context path", required: true },
    { name: "tag", type: "string", desc: "Image tag", required: true },
    { name: "build_args", type: "string", desc: "Build arguments as JSON" },
    { name: "no_cache", type: "boolean", desc: "Disable build cache" },
  ]},
  { name: "docker_push", desc: "Push a Docker image to registry", params: [
    { name: "image", type: "string", desc: "Image name with tag", required: true },
  ]},
  { name: "docker_pull", desc: "Pull a Docker image from registry", params: [
    { name: "image", type: "string", desc: "Image name with tag", required: true },
  ]},
  { name: "docker_tag", desc: "Tag a Docker image", params: [
    { name: "source", type: "string", desc: "Source image", required: true },
    { name: "target", type: "string", desc: "Target tag", required: true },
  ]},
  { name: "docker_scan", desc: "Scan a Docker image for vulnerabilities", params: [
    { name: "image", type: "string", desc: "Image to scan", required: true },
    { name: "severity", type: "string", desc: "Minimum severity to report" },
  ]},
];
