/**
 * AWS/Cloud Infrastructure Tools - 30 tools
 */
export const AWS_TOOLS = [
  { name: "ec2_launch_instance", desc: "Launch a new EC2 instance", params: [
    { name: "instance_type", type: "string", desc: "Instance type (t2.micro, m5.large, etc.)", required: true },
    { name: "ami_id", type: "string", desc: "AMI ID to launch from", required: true },
    { name: "key_name", type: "string", desc: "SSH key pair name" },
    { name: "security_groups", type: "array", desc: "Security group IDs" },
    { name: "subnet_id", type: "string", desc: "Subnet to launch in" },
  ]},
  { name: "ec2_stop_instance", desc: "Stop a running EC2 instance", params: [
    { name: "instance_id", type: "string", desc: "EC2 instance ID", required: true },
  ]},
  { name: "ec2_terminate_instance", desc: "Terminate an EC2 instance", params: [
    { name: "instance_id", type: "string", desc: "EC2 instance ID", required: true },
  ]},
  { name: "ec2_list_instances", desc: "List EC2 instances with optional filters", params: [
    { name: "filters", type: "string", desc: "Filter criteria as JSON" },
    { name: "state", type: "string", desc: "Instance state filter" },
  ]},
  { name: "ec2_describe_instance", desc: "Get detailed information about an EC2 instance", params: [
    { name: "instance_id", type: "string", desc: "EC2 instance ID", required: true },
  ]},
  { name: "s3_create_bucket", desc: "Create a new S3 bucket", params: [
    { name: "bucket_name", type: "string", desc: "Bucket name", required: true },
    { name: "region", type: "string", desc: "AWS region" },
    { name: "acl", type: "string", desc: "Access control list" },
  ]},
  { name: "s3_delete_bucket", desc: "Delete an S3 bucket", params: [
    { name: "bucket_name", type: "string", desc: "Bucket name", required: true },
    { name: "force", type: "boolean", desc: "Force delete non-empty bucket" },
  ]},
  { name: "s3_upload_file", desc: "Upload a file to S3", params: [
    { name: "bucket", type: "string", desc: "Bucket name", required: true },
    { name: "key", type: "string", desc: "Object key/path", required: true },
    { name: "content", type: "string", desc: "File content", required: true },
    { name: "content_type", type: "string", desc: "MIME type" },
  ]},
  { name: "s3_download_file", desc: "Download a file from S3", params: [
    { name: "bucket", type: "string", desc: "Bucket name", required: true },
    { name: "key", type: "string", desc: "Object key/path", required: true },
  ]},
  { name: "s3_list_objects", desc: "List objects in an S3 bucket", params: [
    { name: "bucket", type: "string", desc: "Bucket name", required: true },
    { name: "prefix", type: "string", desc: "Key prefix filter" },
    { name: "max_keys", type: "number", desc: "Maximum results" },
  ]},
  { name: "lambda_create_function", desc: "Create a new Lambda function", params: [
    { name: "function_name", type: "string", desc: "Function name", required: true },
    { name: "runtime", type: "string", desc: "Runtime (nodejs18.x, python3.11, etc.)", required: true },
    { name: "handler", type: "string", desc: "Handler function", required: true },
    { name: "code_s3_bucket", type: "string", desc: "S3 bucket with code" },
    { name: "code_s3_key", type: "string", desc: "S3 key for code zip" },
    { name: "memory_size", type: "number", desc: "Memory in MB" },
    { name: "timeout", type: "number", desc: "Timeout in seconds" },
  ]},
  { name: "lambda_invoke", desc: "Invoke a Lambda function", params: [
    { name: "function_name", type: "string", desc: "Function name", required: true },
    { name: "payload", type: "string", desc: "JSON payload" },
    { name: "invocation_type", type: "string", desc: "RequestResponse or Event" },
  ]},
  { name: "lambda_update_code", desc: "Update Lambda function code", params: [
    { name: "function_name", type: "string", desc: "Function name", required: true },
    { name: "s3_bucket", type: "string", desc: "S3 bucket with new code" },
    { name: "s3_key", type: "string", desc: "S3 key for code zip" },
  ]},
  { name: "lambda_delete_function", desc: "Delete a Lambda function", params: [
    { name: "function_name", type: "string", desc: "Function name", required: true },
  ]},
  { name: "lambda_list_functions", desc: "List Lambda functions", params: [
    { name: "max_items", type: "number", desc: "Maximum results" },
  ]},
  { name: "rds_create_instance", desc: "Create a new RDS database instance", params: [
    { name: "db_instance_id", type: "string", desc: "Database instance identifier", required: true },
    { name: "engine", type: "string", desc: "Database engine (mysql, postgres, etc.)", required: true },
    { name: "instance_class", type: "string", desc: "Instance class", required: true },
    { name: "master_username", type: "string", desc: "Master username", required: true },
    { name: "master_password", type: "string", desc: "Master password", required: true },
    { name: "allocated_storage", type: "number", desc: "Storage in GB" },
  ]},
  { name: "rds_delete_instance", desc: "Delete an RDS instance", params: [
    { name: "db_instance_id", type: "string", desc: "Database instance identifier", required: true },
    { name: "skip_final_snapshot", type: "boolean", desc: "Skip final snapshot" },
  ]},
  { name: "rds_describe_instances", desc: "List RDS instances", params: [
    { name: "db_instance_id", type: "string", desc: "Filter by instance ID" },
  ]},
  { name: "rds_create_snapshot", desc: "Create an RDS snapshot", params: [
    { name: "db_instance_id", type: "string", desc: "Database instance identifier", required: true },
    { name: "snapshot_id", type: "string", desc: "Snapshot identifier", required: true },
  ]},
  { name: "rds_restore_from_snapshot", desc: "Restore RDS from snapshot", params: [
    { name: "db_instance_id", type: "string", desc: "New instance identifier", required: true },
    { name: "snapshot_id", type: "string", desc: "Snapshot to restore from", required: true },
    { name: "instance_class", type: "string", desc: "Instance class" },
  ]},
  { name: "cloudwatch_put_metric", desc: "Put a custom CloudWatch metric", params: [
    { name: "namespace", type: "string", desc: "Metric namespace", required: true },
    { name: "metric_name", type: "string", desc: "Metric name", required: true },
    { name: "value", type: "number", desc: "Metric value", required: true },
    { name: "unit", type: "string", desc: "Metric unit" },
    { name: "dimensions", type: "string", desc: "Dimensions as JSON" },
  ]},
  { name: "cloudwatch_get_metrics", desc: "Get CloudWatch metrics", params: [
    { name: "namespace", type: "string", desc: "Metric namespace", required: true },
    { name: "metric_name", type: "string", desc: "Metric name", required: true },
    { name: "start_time", type: "string", desc: "Start time ISO" },
    { name: "end_time", type: "string", desc: "End time ISO" },
    { name: "period", type: "number", desc: "Period in seconds" },
  ]},
  { name: "cloudwatch_create_alarm", desc: "Create a CloudWatch alarm", params: [
    { name: "alarm_name", type: "string", desc: "Alarm name", required: true },
    { name: "metric_name", type: "string", desc: "Metric to monitor", required: true },
    { name: "namespace", type: "string", desc: "Metric namespace", required: true },
    { name: "threshold", type: "number", desc: "Alarm threshold", required: true },
    { name: "comparison_operator", type: "string", desc: "Comparison operator", required: true },
    { name: "evaluation_periods", type: "number", desc: "Evaluation periods" },
  ]},
  { name: "iam_create_user", desc: "Create an IAM user", params: [
    { name: "username", type: "string", desc: "Username", required: true },
    { name: "path", type: "string", desc: "User path" },
  ]},
  { name: "iam_delete_user", desc: "Delete an IAM user", params: [
    { name: "username", type: "string", desc: "Username", required: true },
  ]},
  { name: "iam_attach_policy", desc: "Attach a policy to a user or role", params: [
    { name: "policy_arn", type: "string", desc: "Policy ARN", required: true },
    { name: "user_name", type: "string", desc: "User to attach to" },
    { name: "role_name", type: "string", desc: "Role to attach to" },
  ]},
  { name: "iam_create_role", desc: "Create an IAM role", params: [
    { name: "role_name", type: "string", desc: "Role name", required: true },
    { name: "assume_role_policy", type: "string", desc: "Trust policy JSON", required: true },
    { name: "description", type: "string", desc: "Role description" },
  ]},
  { name: "sns_create_topic", desc: "Create an SNS topic", params: [
    { name: "topic_name", type: "string", desc: "Topic name", required: true },
  ]},
  { name: "sns_publish", desc: "Publish a message to an SNS topic", params: [
    { name: "topic_arn", type: "string", desc: "Topic ARN", required: true },
    { name: "message", type: "string", desc: "Message content", required: true },
    { name: "subject", type: "string", desc: "Message subject" },
  ]},
  { name: "sqs_create_queue", desc: "Create an SQS queue", params: [
    { name: "queue_name", type: "string", desc: "Queue name", required: true },
    { name: "fifo", type: "boolean", desc: "Create as FIFO queue" },
    { name: "visibility_timeout", type: "number", desc: "Visibility timeout seconds" },
  ]},
];
