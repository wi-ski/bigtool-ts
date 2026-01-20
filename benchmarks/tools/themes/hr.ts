/**
 * HR & People Operations Tools - 30 tools
 */
export const HR_TOOLS = [
  { name: "bamboohr_get_employee", desc: "Get BambooHR employee details", params: [
    { name: "employee_id", type: "number", desc: "Employee ID", required: true },
    { name: "fields", type: "array", desc: "Fields to return" },
  ]},
  { name: "bamboohr_list_employees", desc: "List BambooHR employees", params: [
    { name: "department", type: "string", desc: "Filter by department" },
    { name: "location", type: "string", desc: "Filter by location" },
  ]},
  { name: "bamboohr_create_employee", desc: "Create a BambooHR employee", params: [
    { name: "first_name", type: "string", desc: "First name", required: true },
    { name: "last_name", type: "string", desc: "Last name", required: true },
    { name: "email", type: "string", desc: "Work email" },
    { name: "department", type: "string", desc: "Department" },
    { name: "hire_date", type: "string", desc: "Hire date" },
    { name: "job_title", type: "string", desc: "Job title" },
  ]},
  { name: "bamboohr_update_employee", desc: "Update a BambooHR employee", params: [
    { name: "employee_id", type: "number", desc: "Employee ID", required: true },
    { name: "fields", type: "string", desc: "Fields to update as JSON", required: true },
  ]},
  { name: "bamboohr_request_time_off", desc: "Request time off in BambooHR", params: [
    { name: "employee_id", type: "number", desc: "Employee ID", required: true },
    { name: "start_date", type: "string", desc: "Start date", required: true },
    { name: "end_date", type: "string", desc: "End date", required: true },
    { name: "time_off_type_id", type: "number", desc: "Time off type ID", required: true },
    { name: "note", type: "string", desc: "Request note" },
  ]},
  { name: "bamboohr_approve_time_off", desc: "Approve time off request", params: [
    { name: "request_id", type: "number", desc: "Request ID", required: true },
    { name: "note", type: "string", desc: "Approval note" },
  ]},
  { name: "workday_search_workers", desc: "Search workers in Workday", params: [
    { name: "query", type: "string", desc: "Search query" },
    { name: "department", type: "string", desc: "Filter by department" },
    { name: "location", type: "string", desc: "Filter by location" },
  ]},
  { name: "workday_get_worker", desc: "Get Workday worker details", params: [
    { name: "worker_id", type: "string", desc: "Worker ID", required: true },
  ]},
  { name: "workday_update_worker", desc: "Update a Workday worker", params: [
    { name: "worker_id", type: "string", desc: "Worker ID", required: true },
    { name: "updates", type: "string", desc: "Updates as JSON", required: true },
  ]},
  { name: "workday_create_position", desc: "Create a position in Workday", params: [
    { name: "job_profile", type: "string", desc: "Job profile ID", required: true },
    { name: "organization", type: "string", desc: "Organization ID", required: true },
    { name: "location", type: "string", desc: "Location ID" },
  ]},
  { name: "greenhouse_create_candidate", desc: "Create a Greenhouse candidate", params: [
    { name: "first_name", type: "string", desc: "First name", required: true },
    { name: "last_name", type: "string", desc: "Last name", required: true },
    { name: "email", type: "string", desc: "Email address", required: true },
    { name: "phone", type: "string", desc: "Phone number" },
    { name: "application_job_id", type: "number", desc: "Job to apply for" },
  ]},
  { name: "greenhouse_update_candidate", desc: "Update a Greenhouse candidate", params: [
    { name: "candidate_id", type: "number", desc: "Candidate ID", required: true },
    { name: "first_name", type: "string", desc: "New first name" },
    { name: "last_name", type: "string", desc: "New last name" },
    { name: "tags", type: "array", desc: "Tags to add" },
  ]},
  { name: "greenhouse_move_application", desc: "Move application to stage", params: [
    { name: "application_id", type: "number", desc: "Application ID", required: true },
    { name: "stage_id", type: "number", desc: "Target stage ID", required: true },
  ]},
  { name: "greenhouse_reject_application", desc: "Reject a Greenhouse application", params: [
    { name: "application_id", type: "number", desc: "Application ID", required: true },
    { name: "rejection_reason_id", type: "number", desc: "Rejection reason ID" },
    { name: "rejection_email", type: "boolean", desc: "Send rejection email" },
  ]},
  { name: "greenhouse_schedule_interview", desc: "Schedule a Greenhouse interview", params: [
    { name: "application_id", type: "number", desc: "Application ID", required: true },
    { name: "interview_id", type: "number", desc: "Interview type ID", required: true },
    { name: "start", type: "string", desc: "Start time ISO", required: true },
    { name: "end", type: "string", desc: "End time ISO", required: true },
    { name: "interviewers", type: "array", desc: "Interviewer IDs" },
  ]},
  { name: "lever_create_candidate", desc: "Create a Lever candidate", params: [
    { name: "name", type: "string", desc: "Full name", required: true },
    { name: "email", type: "string", desc: "Email address" },
    { name: "phone", type: "string", desc: "Phone number" },
    { name: "posting_id", type: "string", desc: "Posting to apply for" },
    { name: "origin", type: "string", desc: "Candidate origin" },
  ]},
  { name: "lever_add_note", desc: "Add a note to Lever candidate", params: [
    { name: "candidate_id", type: "string", desc: "Candidate ID", required: true },
    { name: "value", type: "string", desc: "Note content", required: true },
  ]},
  { name: "lever_change_stage", desc: "Change candidate stage in Lever", params: [
    { name: "opportunity_id", type: "string", desc: "Opportunity ID", required: true },
    { name: "stage_id", type: "string", desc: "Target stage ID", required: true },
  ]},
  { name: "rippling_get_employee", desc: "Get Rippling employee details", params: [
    { name: "employee_id", type: "string", desc: "Employee ID", required: true },
  ]},
  { name: "rippling_list_employees", desc: "List Rippling employees", params: [
    { name: "department", type: "string", desc: "Filter by department" },
    { name: "status", type: "string", desc: "Filter by status" },
  ]},
  { name: "rippling_terminate_employee", desc: "Terminate a Rippling employee", params: [
    { name: "employee_id", type: "string", desc: "Employee ID", required: true },
    { name: "termination_date", type: "string", desc: "Termination date", required: true },
    { name: "termination_reason", type: "string", desc: "Termination reason" },
  ]},
  { name: "gusto_create_employee", desc: "Create a Gusto employee", params: [
    { name: "first_name", type: "string", desc: "First name", required: true },
    { name: "last_name", type: "string", desc: "Last name", required: true },
    { name: "email", type: "string", desc: "Email address" },
    { name: "date_of_birth", type: "string", desc: "Date of birth" },
    { name: "ssn", type: "string", desc: "Social security number" },
  ]},
  { name: "gusto_run_payroll", desc: "Run Gusto payroll", params: [
    { name: "company_id", type: "string", desc: "Company ID", required: true },
    { name: "pay_period_id", type: "string", desc: "Pay period ID", required: true },
  ]},
  { name: "gusto_get_pay_stubs", desc: "Get Gusto pay stubs", params: [
    { name: "employee_id", type: "string", desc: "Employee ID", required: true },
    { name: "start_date", type: "string", desc: "Start date" },
    { name: "end_date", type: "string", desc: "End date" },
  ]},
  { name: "lattice_create_review", desc: "Create a Lattice performance review", params: [
    { name: "reviewee_id", type: "string", desc: "Reviewee ID", required: true },
    { name: "reviewer_id", type: "string", desc: "Reviewer ID", required: true },
    { name: "cycle_id", type: "string", desc: "Review cycle ID", required: true },
  ]},
  { name: "lattice_submit_feedback", desc: "Submit feedback in Lattice", params: [
    { name: "recipient_id", type: "string", desc: "Recipient ID", required: true },
    { name: "content", type: "string", desc: "Feedback content", required: true },
    { name: "visibility", type: "string", desc: "Visibility level" },
  ]},
  { name: "lattice_set_goal", desc: "Set a goal in Lattice", params: [
    { name: "owner_id", type: "string", desc: "Goal owner ID", required: true },
    { name: "title", type: "string", desc: "Goal title", required: true },
    { name: "description", type: "string", desc: "Goal description" },
    { name: "due_date", type: "string", desc: "Due date" },
    { name: "key_results", type: "string", desc: "Key results as JSON" },
  ]},
  { name: "culture_amp_launch_survey", desc: "Launch a Culture Amp survey", params: [
    { name: "survey_id", type: "string", desc: "Survey ID", required: true },
    { name: "participants", type: "array", desc: "Participant IDs" },
    { name: "due_date", type: "string", desc: "Survey due date" },
  ]},
  { name: "culture_amp_get_results", desc: "Get Culture Amp survey results", params: [
    { name: "survey_id", type: "string", desc: "Survey ID", required: true },
    { name: "format", type: "string", desc: "Result format" },
  ]},
  { name: "fifteen_five_create_check_in", desc: "Create a 15Five check-in", params: [
    { name: "user_id", type: "string", desc: "User ID", required: true },
    { name: "wins", type: "string", desc: "Weekly wins" },
    { name: "challenges", type: "string", desc: "Challenges faced" },
    { name: "pulse_score", type: "number", desc: "Pulse score (1-5)" },
  ]},
];
