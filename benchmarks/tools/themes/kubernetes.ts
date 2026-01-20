/**
 * Kubernetes/Container Management Tools - 30 tools
 */
export const KUBERNETES_TOOLS = [
  { name: "k8s_create_deployment", desc: "Create a Kubernetes deployment", params: [
    { name: "name", type: "string", desc: "Deployment name", required: true },
    { name: "image", type: "string", desc: "Container image", required: true },
    { name: "replicas", type: "number", desc: "Number of replicas" },
    { name: "namespace", type: "string", desc: "Kubernetes namespace" },
    { name: "labels", type: "string", desc: "Labels as JSON" },
    { name: "env_vars", type: "string", desc: "Environment variables as JSON" },
  ]},
  { name: "k8s_scale_deployment", desc: "Scale a deployment up or down", params: [
    { name: "name", type: "string", desc: "Deployment name", required: true },
    { name: "replicas", type: "number", desc: "Target replicas", required: true },
    { name: "namespace", type: "string", desc: "Kubernetes namespace" },
  ]},
  { name: "k8s_delete_deployment", desc: "Delete a Kubernetes deployment", params: [
    { name: "name", type: "string", desc: "Deployment name", required: true },
    { name: "namespace", type: "string", desc: "Kubernetes namespace" },
  ]},
  { name: "k8s_get_deployment", desc: "Get deployment details", params: [
    { name: "name", type: "string", desc: "Deployment name", required: true },
    { name: "namespace", type: "string", desc: "Kubernetes namespace" },
  ]},
  { name: "k8s_list_deployments", desc: "List all deployments", params: [
    { name: "namespace", type: "string", desc: "Kubernetes namespace" },
    { name: "label_selector", type: "string", desc: "Label selector" },
  ]},
  { name: "k8s_rollout_restart", desc: "Restart a deployment rollout", params: [
    { name: "name", type: "string", desc: "Deployment name", required: true },
    { name: "namespace", type: "string", desc: "Kubernetes namespace" },
  ]},
  { name: "k8s_rollout_status", desc: "Check rollout status", params: [
    { name: "name", type: "string", desc: "Deployment name", required: true },
    { name: "namespace", type: "string", desc: "Kubernetes namespace" },
  ]},
  { name: "k8s_create_service", desc: "Create a Kubernetes service", params: [
    { name: "name", type: "string", desc: "Service name", required: true },
    { name: "selector", type: "string", desc: "Pod selector as JSON", required: true },
    { name: "port", type: "number", desc: "Service port", required: true },
    { name: "target_port", type: "number", desc: "Target port" },
    { name: "type", type: "string", desc: "Service type (ClusterIP, LoadBalancer, etc.)" },
    { name: "namespace", type: "string", desc: "Kubernetes namespace" },
  ]},
  { name: "k8s_delete_service", desc: "Delete a Kubernetes service", params: [
    { name: "name", type: "string", desc: "Service name", required: true },
    { name: "namespace", type: "string", desc: "Kubernetes namespace" },
  ]},
  { name: "k8s_list_services", desc: "List all services", params: [
    { name: "namespace", type: "string", desc: "Kubernetes namespace" },
  ]},
  { name: "k8s_create_configmap", desc: "Create a ConfigMap", params: [
    { name: "name", type: "string", desc: "ConfigMap name", required: true },
    { name: "data", type: "string", desc: "Data as JSON", required: true },
    { name: "namespace", type: "string", desc: "Kubernetes namespace" },
  ]},
  { name: "k8s_create_secret", desc: "Create a Kubernetes secret", params: [
    { name: "name", type: "string", desc: "Secret name", required: true },
    { name: "data", type: "string", desc: "Secret data as JSON", required: true },
    { name: "type", type: "string", desc: "Secret type" },
    { name: "namespace", type: "string", desc: "Kubernetes namespace" },
  ]},
  { name: "k8s_get_pods", desc: "List pods with optional filters", params: [
    { name: "namespace", type: "string", desc: "Kubernetes namespace" },
    { name: "label_selector", type: "string", desc: "Label selector" },
    { name: "field_selector", type: "string", desc: "Field selector" },
  ]},
  { name: "k8s_describe_pod", desc: "Get detailed pod information", params: [
    { name: "name", type: "string", desc: "Pod name", required: true },
    { name: "namespace", type: "string", desc: "Kubernetes namespace" },
  ]},
  { name: "k8s_delete_pod", desc: "Delete a pod", params: [
    { name: "name", type: "string", desc: "Pod name", required: true },
    { name: "namespace", type: "string", desc: "Kubernetes namespace" },
    { name: "grace_period", type: "number", desc: "Grace period seconds" },
  ]},
  { name: "k8s_get_logs", desc: "Get pod logs", params: [
    { name: "pod_name", type: "string", desc: "Pod name", required: true },
    { name: "container", type: "string", desc: "Container name" },
    { name: "namespace", type: "string", desc: "Kubernetes namespace" },
    { name: "tail_lines", type: "number", desc: "Number of lines from end" },
    { name: "since", type: "string", desc: "Since duration (e.g., 1h)" },
  ]},
  { name: "k8s_exec", desc: "Execute command in a pod", params: [
    { name: "pod_name", type: "string", desc: "Pod name", required: true },
    { name: "command", type: "array", desc: "Command to execute", required: true },
    { name: "container", type: "string", desc: "Container name" },
    { name: "namespace", type: "string", desc: "Kubernetes namespace" },
  ]},
  { name: "k8s_port_forward", desc: "Set up port forwarding to a pod", params: [
    { name: "pod_name", type: "string", desc: "Pod name", required: true },
    { name: "local_port", type: "number", desc: "Local port", required: true },
    { name: "remote_port", type: "number", desc: "Remote port", required: true },
    { name: "namespace", type: "string", desc: "Kubernetes namespace" },
  ]},
  { name: "k8s_create_ingress", desc: "Create an Ingress resource", params: [
    { name: "name", type: "string", desc: "Ingress name", required: true },
    { name: "host", type: "string", desc: "Hostname", required: true },
    { name: "service_name", type: "string", desc: "Backend service", required: true },
    { name: "service_port", type: "number", desc: "Backend port", required: true },
    { name: "path", type: "string", desc: "URL path" },
    { name: "tls_secret", type: "string", desc: "TLS secret name" },
    { name: "namespace", type: "string", desc: "Kubernetes namespace" },
  ]},
  { name: "k8s_create_namespace", desc: "Create a Kubernetes namespace", params: [
    { name: "name", type: "string", desc: "Namespace name", required: true },
    { name: "labels", type: "string", desc: "Labels as JSON" },
  ]},
  { name: "k8s_delete_namespace", desc: "Delete a Kubernetes namespace", params: [
    { name: "name", type: "string", desc: "Namespace name", required: true },
  ]},
  { name: "k8s_apply_manifest", desc: "Apply a YAML manifest", params: [
    { name: "manifest", type: "string", desc: "YAML manifest content", required: true },
    { name: "namespace", type: "string", desc: "Kubernetes namespace" },
  ]},
  { name: "k8s_create_hpa", desc: "Create a Horizontal Pod Autoscaler", params: [
    { name: "name", type: "string", desc: "HPA name", required: true },
    { name: "deployment", type: "string", desc: "Target deployment", required: true },
    { name: "min_replicas", type: "number", desc: "Minimum replicas", required: true },
    { name: "max_replicas", type: "number", desc: "Maximum replicas", required: true },
    { name: "cpu_percent", type: "number", desc: "Target CPU percentage" },
    { name: "namespace", type: "string", desc: "Kubernetes namespace" },
  ]},
  { name: "k8s_create_pvc", desc: "Create a PersistentVolumeClaim", params: [
    { name: "name", type: "string", desc: "PVC name", required: true },
    { name: "storage_class", type: "string", desc: "Storage class" },
    { name: "size", type: "string", desc: "Storage size (e.g., 10Gi)", required: true },
    { name: "access_modes", type: "array", desc: "Access modes" },
    { name: "namespace", type: "string", desc: "Kubernetes namespace" },
  ]},
  { name: "k8s_get_events", desc: "Get cluster events", params: [
    { name: "namespace", type: "string", desc: "Kubernetes namespace" },
    { name: "field_selector", type: "string", desc: "Field selector" },
  ]},
  { name: "k8s_cordon_node", desc: "Mark a node as unschedulable", params: [
    { name: "node_name", type: "string", desc: "Node name", required: true },
  ]},
  { name: "k8s_drain_node", desc: "Drain a node for maintenance", params: [
    { name: "node_name", type: "string", desc: "Node name", required: true },
    { name: "ignore_daemonsets", type: "boolean", desc: "Ignore DaemonSets" },
    { name: "delete_local_data", type: "boolean", desc: "Delete local data" },
  ]},
  { name: "k8s_get_nodes", desc: "List cluster nodes", params: [
    { name: "label_selector", type: "string", desc: "Label selector" },
  ]},
  { name: "helm_install", desc: "Install a Helm chart", params: [
    { name: "release_name", type: "string", desc: "Release name", required: true },
    { name: "chart", type: "string", desc: "Chart name or path", required: true },
    { name: "namespace", type: "string", desc: "Kubernetes namespace" },
    { name: "values", type: "string", desc: "Values as JSON" },
    { name: "version", type: "string", desc: "Chart version" },
  ]},
  { name: "helm_upgrade", desc: "Upgrade a Helm release", params: [
    { name: "release_name", type: "string", desc: "Release name", required: true },
    { name: "chart", type: "string", desc: "Chart name or path", required: true },
    { name: "namespace", type: "string", desc: "Kubernetes namespace" },
    { name: "values", type: "string", desc: "Values as JSON" },
    { name: "version", type: "string", desc: "Chart version" },
  ]},
];
