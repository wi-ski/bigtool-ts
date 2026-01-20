/**
 * Data & ETL Tools - 30 tools
 */
export const DATA_TOOLS = [
  { name: "snowflake_query", desc: "Execute a Snowflake SQL query", params: [
    { name: "query", type: "string", desc: "SQL query", required: true },
    { name: "warehouse", type: "string", desc: "Warehouse name" },
    { name: "database", type: "string", desc: "Database name" },
    { name: "schema", type: "string", desc: "Schema name" },
  ]},
  { name: "snowflake_create_table", desc: "Create a Snowflake table", params: [
    { name: "table_name", type: "string", desc: "Table name", required: true },
    { name: "columns", type: "string", desc: "Column definitions as JSON", required: true },
    { name: "database", type: "string", desc: "Database name" },
    { name: "schema", type: "string", desc: "Schema name" },
  ]},
  { name: "snowflake_load_data", desc: "Load data into Snowflake", params: [
    { name: "table_name", type: "string", desc: "Target table", required: true },
    { name: "stage", type: "string", desc: "Stage name", required: true },
    { name: "file_format", type: "string", desc: "File format" },
    { name: "pattern", type: "string", desc: "File pattern" },
  ]},
  { name: "bigquery_query", desc: "Execute a BigQuery SQL query", params: [
    { name: "query", type: "string", desc: "SQL query", required: true },
    { name: "project", type: "string", desc: "GCP project" },
    { name: "dataset", type: "string", desc: "Dataset name" },
  ]},
  { name: "bigquery_create_table", desc: "Create a BigQuery table", params: [
    { name: "table_id", type: "string", desc: "Table ID", required: true },
    { name: "schema", type: "string", desc: "Schema as JSON", required: true },
    { name: "dataset", type: "string", desc: "Dataset name", required: true },
  ]},
  { name: "bigquery_load_data", desc: "Load data into BigQuery", params: [
    { name: "table_id", type: "string", desc: "Target table", required: true },
    { name: "source_uri", type: "string", desc: "GCS URI", required: true },
    { name: "source_format", type: "string", desc: "Source format (CSV, JSON, etc.)" },
  ]},
  { name: "databricks_run_job", desc: "Run a Databricks job", params: [
    { name: "job_id", type: "number", desc: "Job ID", required: true },
    { name: "parameters", type: "string", desc: "Job parameters as JSON" },
  ]},
  { name: "databricks_create_cluster", desc: "Create a Databricks cluster", params: [
    { name: "cluster_name", type: "string", desc: "Cluster name", required: true },
    { name: "spark_version", type: "string", desc: "Spark runtime version", required: true },
    { name: "node_type_id", type: "string", desc: "Node type", required: true },
    { name: "num_workers", type: "number", desc: "Number of workers" },
    { name: "autoscale", type: "string", desc: "Autoscale config as JSON" },
  ]},
  { name: "databricks_run_notebook", desc: "Run a Databricks notebook", params: [
    { name: "notebook_path", type: "string", desc: "Notebook path", required: true },
    { name: "cluster_id", type: "string", desc: "Cluster ID" },
    { name: "parameters", type: "string", desc: "Parameters as JSON" },
  ]},
  { name: "airflow_trigger_dag", desc: "Trigger an Airflow DAG", params: [
    { name: "dag_id", type: "string", desc: "DAG ID", required: true },
    { name: "conf", type: "string", desc: "DAG run configuration as JSON" },
    { name: "execution_date", type: "string", desc: "Execution date" },
  ]},
  { name: "airflow_get_dag_runs", desc: "Get Airflow DAG runs", params: [
    { name: "dag_id", type: "string", desc: "DAG ID", required: true },
    { name: "state", type: "string", desc: "Filter by state" },
    { name: "limit", type: "number", desc: "Maximum results" },
  ]},
  { name: "airflow_pause_dag", desc: "Pause an Airflow DAG", params: [
    { name: "dag_id", type: "string", desc: "DAG ID", required: true },
  ]},
  { name: "airflow_unpause_dag", desc: "Unpause an Airflow DAG", params: [
    { name: "dag_id", type: "string", desc: "DAG ID", required: true },
  ]},
  { name: "airflow_clear_task", desc: "Clear an Airflow task instance", params: [
    { name: "dag_id", type: "string", desc: "DAG ID", required: true },
    { name: "task_id", type: "string", desc: "Task ID", required: true },
    { name: "execution_date", type: "string", desc: "Execution date", required: true },
  ]},
  { name: "dbt_run", desc: "Run dbt models", params: [
    { name: "models", type: "string", desc: "Model selection" },
    { name: "exclude", type: "string", desc: "Models to exclude" },
    { name: "full_refresh", type: "boolean", desc: "Full refresh" },
  ]},
  { name: "dbt_test", desc: "Run dbt tests", params: [
    { name: "models", type: "string", desc: "Model selection" },
    { name: "exclude", type: "string", desc: "Tests to exclude" },
  ]},
  { name: "dbt_docs_generate", desc: "Generate dbt documentation", params: [
    { name: "compile", type: "boolean", desc: "Compile project first" },
  ]},
  { name: "fivetran_trigger_sync", desc: "Trigger a Fivetran connector sync", params: [
    { name: "connector_id", type: "string", desc: "Connector ID", required: true },
    { name: "force", type: "boolean", desc: "Force full sync" },
  ]},
  { name: "fivetran_get_connector", desc: "Get Fivetran connector details", params: [
    { name: "connector_id", type: "string", desc: "Connector ID", required: true },
  ]},
  { name: "fivetran_pause_connector", desc: "Pause a Fivetran connector", params: [
    { name: "connector_id", type: "string", desc: "Connector ID", required: true },
  ]},
  { name: "airbyte_trigger_sync", desc: "Trigger an Airbyte connection sync", params: [
    { name: "connection_id", type: "string", desc: "Connection ID", required: true },
  ]},
  { name: "airbyte_get_job", desc: "Get Airbyte job status", params: [
    { name: "job_id", type: "number", desc: "Job ID", required: true },
  ]},
  { name: "airbyte_list_connections", desc: "List Airbyte connections", params: [
    { name: "workspace_id", type: "string", desc: "Workspace ID" },
  ]},
  { name: "kafka_produce", desc: "Produce a message to Kafka", params: [
    { name: "topic", type: "string", desc: "Topic name", required: true },
    { name: "message", type: "string", desc: "Message content", required: true },
    { name: "key", type: "string", desc: "Message key" },
    { name: "partition", type: "number", desc: "Target partition" },
  ]},
  { name: "kafka_consume", desc: "Consume messages from Kafka", params: [
    { name: "topic", type: "string", desc: "Topic name", required: true },
    { name: "group_id", type: "string", desc: "Consumer group ID", required: true },
    { name: "max_messages", type: "number", desc: "Maximum messages to consume" },
  ]},
  { name: "kafka_create_topic", desc: "Create a Kafka topic", params: [
    { name: "topic", type: "string", desc: "Topic name", required: true },
    { name: "partitions", type: "number", desc: "Number of partitions" },
    { name: "replication_factor", type: "number", desc: "Replication factor" },
  ]},
  { name: "redis_get", desc: "Get a value from Redis", params: [
    { name: "key", type: "string", desc: "Key name", required: true },
  ]},
  { name: "redis_set", desc: "Set a value in Redis", params: [
    { name: "key", type: "string", desc: "Key name", required: true },
    { name: "value", type: "string", desc: "Value to set", required: true },
    { name: "ttl", type: "number", desc: "TTL in seconds" },
  ]},
  { name: "redis_delete", desc: "Delete a key from Redis", params: [
    { name: "key", type: "string", desc: "Key name", required: true },
  ]},
  { name: "elasticsearch_search", desc: "Search Elasticsearch", params: [
    { name: "index", type: "string", desc: "Index name", required: true },
    { name: "query", type: "string", desc: "Query DSL as JSON", required: true },
    { name: "size", type: "number", desc: "Maximum results" },
  ]},
];
