import { github_create_pr } from "./generated/github_create_pr.js";
import { github_list_prs } from "./generated/github_list_prs.js";
import { github_merge_pr } from "./generated/github_merge_pr.js";
import { github_create_issue } from "./generated/github_create_issue.js";
import { slack_post_message } from "./generated/slack_post_message.js";
import { slack_send_dm } from "./generated/slack_send_dm.js";
import { jira_create_issue } from "./generated/jira_create_issue.js";
import { jira_update_issue } from "./generated/jira_update_issue.js";
import { email_send } from "./generated/email_send.js";
import { ec2_launch_instance } from "./generated/ec2_launch_instance.js";
import { ec2_stop_instance } from "./generated/ec2_stop_instance.js";
import { ec2_terminate_instance } from "./generated/ec2_terminate_instance.js";
import { ec2_list_instances } from "./generated/ec2_list_instances.js";
import { ec2_describe_instance } from "./generated/ec2_describe_instance.js";
import { s3_create_bucket } from "./generated/s3_create_bucket.js";
import { s3_delete_bucket } from "./generated/s3_delete_bucket.js";
import { s3_upload_file } from "./generated/s3_upload_file.js";
import { s3_download_file } from "./generated/s3_download_file.js";
import { s3_list_objects } from "./generated/s3_list_objects.js";
import { k8s_create_deployment } from "./generated/k8s_create_deployment.js";
import { k8s_scale_deployment } from "./generated/k8s_scale_deployment.js";
import { k8s_delete_deployment } from "./generated/k8s_delete_deployment.js";
import { k8s_get_deployment } from "./generated/k8s_get_deployment.js";
import { k8s_list_deployments } from "./generated/k8s_list_deployments.js";
import { k8s_rollout_restart } from "./generated/k8s_rollout_restart.js";
import { k8s_rollout_status } from "./generated/k8s_rollout_status.js";
import { k8s_create_service } from "./generated/k8s_create_service.js";
import { k8s_delete_service } from "./generated/k8s_delete_service.js";
import { k8s_list_services } from "./generated/k8s_list_services.js";
import { github_actions_trigger } from "./generated/github_actions_trigger.js";
import { github_actions_list_runs } from "./generated/github_actions_list_runs.js";
import { github_actions_get_run } from "./generated/github_actions_get_run.js";
import { github_actions_cancel_run } from "./generated/github_actions_cancel_run.js";
import { github_actions_rerun } from "./generated/github_actions_rerun.js";
import { github_actions_get_logs } from "./generated/github_actions_get_logs.js";
import { jenkins_trigger_build } from "./generated/jenkins_trigger_build.js";
import { jenkins_get_build } from "./generated/jenkins_get_build.js";
import { jenkins_abort_build } from "./generated/jenkins_abort_build.js";
import { jenkins_get_console_output } from "./generated/jenkins_get_console_output.js";
import { datadog_create_monitor } from "./generated/datadog_create_monitor.js";
import { datadog_get_monitor } from "./generated/datadog_get_monitor.js";
import { datadog_update_monitor } from "./generated/datadog_update_monitor.js";
import { datadog_mute_monitor } from "./generated/datadog_mute_monitor.js";
import { datadog_list_monitors } from "./generated/datadog_list_monitors.js";
import { datadog_query_metrics } from "./generated/datadog_query_metrics.js";
import { datadog_post_event } from "./generated/datadog_post_event.js";
import { pagerduty_create_incident } from "./generated/pagerduty_create_incident.js";
import { pagerduty_acknowledge_incident } from "./generated/pagerduty_acknowledge_incident.js";
import { pagerduty_resolve_incident } from "./generated/pagerduty_resolve_incident.js";
import { vault_read_secret } from "./generated/vault_read_secret.js";
import { vault_write_secret } from "./generated/vault_write_secret.js";
import { vault_delete_secret } from "./generated/vault_delete_secret.js";
import { vault_list_secrets } from "./generated/vault_list_secrets.js";
import { vault_create_token } from "./generated/vault_create_token.js";
import { vault_revoke_token } from "./generated/vault_revoke_token.js";
import { snyk_test_project } from "./generated/snyk_test_project.js";
import { snyk_list_issues } from "./generated/snyk_list_issues.js";
import { snyk_ignore_issue } from "./generated/snyk_ignore_issue.js";
import { trivy_scan_image } from "./generated/trivy_scan_image.js";
import { snowflake_query } from "./generated/snowflake_query.js";
import { snowflake_create_table } from "./generated/snowflake_create_table.js";
import { snowflake_load_data } from "./generated/snowflake_load_data.js";
import { bigquery_query } from "./generated/bigquery_query.js";
import { bigquery_create_table } from "./generated/bigquery_create_table.js";
import { bigquery_load_data } from "./generated/bigquery_load_data.js";
import { databricks_run_job } from "./generated/databricks_run_job.js";
import { databricks_create_cluster } from "./generated/databricks_create_cluster.js";
import { databricks_run_notebook } from "./generated/databricks_run_notebook.js";
import { airflow_trigger_dag } from "./generated/airflow_trigger_dag.js";
import { zendesk_create_ticket } from "./generated/zendesk_create_ticket.js";
import { zendesk_update_ticket } from "./generated/zendesk_update_ticket.js";
import { zendesk_get_ticket } from "./generated/zendesk_get_ticket.js";
import { zendesk_search_tickets } from "./generated/zendesk_search_tickets.js";
import { zendesk_add_comment } from "./generated/zendesk_add_comment.js";
import { zendesk_list_tickets } from "./generated/zendesk_list_tickets.js";
import { intercom_create_conversation } from "./generated/intercom_create_conversation.js";
import { intercom_reply_conversation } from "./generated/intercom_reply_conversation.js";
import { intercom_close_conversation } from "./generated/intercom_close_conversation.js";
import { intercom_search_conversations } from "./generated/intercom_search_conversations.js";
import { hubspot_create_contact } from "./generated/hubspot_create_contact.js";
import { hubspot_update_contact } from "./generated/hubspot_update_contact.js";
import { hubspot_search_contacts } from "./generated/hubspot_search_contacts.js";
import { hubspot_create_deal } from "./generated/hubspot_create_deal.js";
import { hubspot_update_deal } from "./generated/hubspot_update_deal.js";
import { hubspot_create_company } from "./generated/hubspot_create_company.js";
import { mailchimp_add_subscriber } from "./generated/mailchimp_add_subscriber.js";
import { mailchimp_update_subscriber } from "./generated/mailchimp_update_subscriber.js";
import { mailchimp_send_campaign } from "./generated/mailchimp_send_campaign.js";
import { mailchimp_create_campaign } from "./generated/mailchimp_create_campaign.js";
import { stripe_create_customer } from "./generated/stripe_create_customer.js";
import { stripe_update_customer } from "./generated/stripe_update_customer.js";
import { stripe_create_charge } from "./generated/stripe_create_charge.js";
import { stripe_create_refund } from "./generated/stripe_create_refund.js";
import { stripe_list_charges } from "./generated/stripe_list_charges.js";
import { stripe_create_subscription } from "./generated/stripe_create_subscription.js";
import { stripe_cancel_subscription } from "./generated/stripe_cancel_subscription.js";
import { stripe_create_invoice } from "./generated/stripe_create_invoice.js";
import { stripe_send_invoice } from "./generated/stripe_send_invoice.js";
import { paypal_create_order } from "./generated/paypal_create_order.js";
import { bamboohr_get_employee } from "./generated/bamboohr_get_employee.js";
import { bamboohr_list_employees } from "./generated/bamboohr_list_employees.js";
import { bamboohr_create_employee } from "./generated/bamboohr_create_employee.js";
import { bamboohr_update_employee } from "./generated/bamboohr_update_employee.js";
import { bamboohr_request_time_off } from "./generated/bamboohr_request_time_off.js";
import { bamboohr_approve_time_off } from "./generated/bamboohr_approve_time_off.js";
import { workday_search_workers } from "./generated/workday_search_workers.js";
import { workday_get_worker } from "./generated/workday_get_worker.js";
import { workday_update_worker } from "./generated/workday_update_worker.js";
import { shopify_create_product } from "./generated/shopify_create_product.js";
import { shopify_update_product } from "./generated/shopify_update_product.js";
import { shopify_get_product } from "./generated/shopify_get_product.js";
import { shopify_list_products } from "./generated/shopify_list_products.js";
import { shopify_create_order } from "./generated/shopify_create_order.js";
import { shopify_fulfill_order } from "./generated/shopify_fulfill_order.js";
import { shopify_cancel_order } from "./generated/shopify_cancel_order.js";
import { shopify_update_inventory } from "./generated/shopify_update_inventory.js";
import { woocommerce_create_product } from "./generated/woocommerce_create_product.js";
import { woocommerce_update_product } from "./generated/woocommerce_update_product.js";
import { asana_create_task } from "./generated/asana_create_task.js";
import { asana_update_task } from "./generated/asana_update_task.js";
import { asana_add_comment } from "./generated/asana_add_comment.js";
import { monday_create_item } from "./generated/monday_create_item.js";
import { monday_update_item } from "./generated/monday_update_item.js";
import { monday_create_update } from "./generated/monday_create_update.js";
import { trello_create_card } from "./generated/trello_create_card.js";
import { trello_move_card } from "./generated/trello_move_card.js";
import { trello_add_comment } from "./generated/trello_add_comment.js";
import { clickup_create_task } from "./generated/clickup_create_task.js";

export const allTools = [
  github_create_pr,
  github_list_prs,
  github_merge_pr,
  github_create_issue,
  slack_post_message,
  slack_send_dm,
  jira_create_issue,
  jira_update_issue,
  email_send,
  ec2_launch_instance,
  ec2_stop_instance,
  ec2_terminate_instance,
  ec2_list_instances,
  ec2_describe_instance,
  s3_create_bucket,
  s3_delete_bucket,
  s3_upload_file,
  s3_download_file,
  s3_list_objects,
  k8s_create_deployment,
  k8s_scale_deployment,
  k8s_delete_deployment,
  k8s_get_deployment,
  k8s_list_deployments,
  k8s_rollout_restart,
  k8s_rollout_status,
  k8s_create_service,
  k8s_delete_service,
  k8s_list_services,
  github_actions_trigger,
  github_actions_list_runs,
  github_actions_get_run,
  github_actions_cancel_run,
  github_actions_rerun,
  github_actions_get_logs,
  jenkins_trigger_build,
  jenkins_get_build,
  jenkins_abort_build,
  jenkins_get_console_output,
  datadog_create_monitor,
  datadog_get_monitor,
  datadog_update_monitor,
  datadog_mute_monitor,
  datadog_list_monitors,
  datadog_query_metrics,
  datadog_post_event,
  pagerduty_create_incident,
  pagerduty_acknowledge_incident,
  pagerduty_resolve_incident,
  vault_read_secret,
  vault_write_secret,
  vault_delete_secret,
  vault_list_secrets,
  vault_create_token,
  vault_revoke_token,
  snyk_test_project,
  snyk_list_issues,
  snyk_ignore_issue,
  trivy_scan_image,
  snowflake_query,
  snowflake_create_table,
  snowflake_load_data,
  bigquery_query,
  bigquery_create_table,
  bigquery_load_data,
  databricks_run_job,
  databricks_create_cluster,
  databricks_run_notebook,
  airflow_trigger_dag,
  zendesk_create_ticket,
  zendesk_update_ticket,
  zendesk_get_ticket,
  zendesk_search_tickets,
  zendesk_add_comment,
  zendesk_list_tickets,
  intercom_create_conversation,
  intercom_reply_conversation,
  intercom_close_conversation,
  intercom_search_conversations,
  hubspot_create_contact,
  hubspot_update_contact,
  hubspot_search_contacts,
  hubspot_create_deal,
  hubspot_update_deal,
  hubspot_create_company,
  mailchimp_add_subscriber,
  mailchimp_update_subscriber,
  mailchimp_send_campaign,
  mailchimp_create_campaign,
  stripe_create_customer,
  stripe_update_customer,
  stripe_create_charge,
  stripe_create_refund,
  stripe_list_charges,
  stripe_create_subscription,
  stripe_cancel_subscription,
  stripe_create_invoice,
  stripe_send_invoice,
  paypal_create_order,
  bamboohr_get_employee,
  bamboohr_list_employees,
  bamboohr_create_employee,
  bamboohr_update_employee,
  bamboohr_request_time_off,
  bamboohr_approve_time_off,
  workday_search_workers,
  workday_get_worker,
  workday_update_worker,
  shopify_create_product,
  shopify_update_product,
  shopify_get_product,
  shopify_list_products,
  shopify_create_order,
  shopify_fulfill_order,
  shopify_cancel_order,
  shopify_update_inventory,
  woocommerce_create_product,
  woocommerce_update_product,
  asana_create_task,
  asana_update_task,
  asana_add_comment,
  monday_create_item,
  monday_update_item,
  monday_create_update,
  trello_create_card,
  trello_move_card,
  trello_add_comment,
  clickup_create_task,
];

export const TOOL_COUNT = 128;
