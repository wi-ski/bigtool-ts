/**
 * Project Management Tools - 15 tools (to reach 356 total)
 */
export const PROJECT_TOOLS = [
  {
    name: "asana_create_task",
    desc: "Create an Asana task",
    params: [
      { name: "name", type: "string", desc: "Task name", required: true },
      {
        name: "project_id",
        type: "string",
        desc: "Project ID",
        required: true,
      },
      { name: "notes", type: "string", desc: "Task notes" },
      { name: "due_date", type: "string", desc: "Due date" },
      { name: "assignee", type: "string", desc: "Assignee ID" },
    ],
  },
  {
    name: "asana_update_task",
    desc: "Update an Asana task",
    params: [
      { name: "task_id", type: "string", desc: "Task ID", required: true },
      { name: "name", type: "string", desc: "New name" },
      { name: "completed", type: "boolean", desc: "Mark complete" },
    ],
  },
  {
    name: "asana_add_comment",
    desc: "Add comment to Asana task",
    params: [
      { name: "task_id", type: "string", desc: "Task ID", required: true },
      { name: "text", type: "string", desc: "Comment text", required: true },
    ],
  },
  {
    name: "monday_create_item",
    desc: "Create a Monday.com item",
    params: [
      { name: "board_id", type: "string", desc: "Board ID", required: true },
      { name: "item_name", type: "string", desc: "Item name", required: true },
      { name: "group_id", type: "string", desc: "Group ID" },
      { name: "column_values", type: "string", desc: "Column values as JSON" },
    ],
  },
  {
    name: "monday_update_item",
    desc: "Update a Monday.com item",
    params: [
      { name: "item_id", type: "string", desc: "Item ID", required: true },
      {
        name: "column_values",
        type: "string",
        desc: "Column values as JSON",
        required: true,
      },
    ],
  },
  {
    name: "monday_create_update",
    desc: "Add update to Monday.com item",
    params: [
      { name: "item_id", type: "string", desc: "Item ID", required: true },
      { name: "body", type: "string", desc: "Update body", required: true },
    ],
  },
  {
    name: "trello_create_card",
    desc: "Create a Trello card",
    params: [
      { name: "list_id", type: "string", desc: "List ID", required: true },
      { name: "name", type: "string", desc: "Card name", required: true },
      { name: "desc", type: "string", desc: "Description" },
      { name: "due", type: "string", desc: "Due date" },
    ],
  },
  {
    name: "trello_move_card",
    desc: "Move a Trello card",
    params: [
      { name: "card_id", type: "string", desc: "Card ID", required: true },
      {
        name: "list_id",
        type: "string",
        desc: "Target list ID",
        required: true,
      },
    ],
  },
  {
    name: "trello_add_comment",
    desc: "Add comment to Trello card",
    params: [
      { name: "card_id", type: "string", desc: "Card ID", required: true },
      { name: "text", type: "string", desc: "Comment text", required: true },
    ],
  },
  {
    name: "clickup_create_task",
    desc: "Create a ClickUp task",
    params: [
      { name: "list_id", type: "string", desc: "List ID", required: true },
      { name: "name", type: "string", desc: "Task name", required: true },
      { name: "description", type: "string", desc: "Description" },
      { name: "priority", type: "number", desc: "Priority (1-4)" },
      { name: "due_date", type: "number", desc: "Due date timestamp" },
    ],
  },
  {
    name: "clickup_update_task",
    desc: "Update a ClickUp task",
    params: [
      { name: "task_id", type: "string", desc: "Task ID", required: true },
      { name: "name", type: "string", desc: "New name" },
      { name: "status", type: "string", desc: "New status" },
    ],
  },
  {
    name: "clickup_add_comment",
    desc: "Add comment to ClickUp task",
    params: [
      { name: "task_id", type: "string", desc: "Task ID", required: true },
      { name: "comment_text", type: "string", desc: "Comment", required: true },
    ],
  },
  {
    name: "basecamp_create_todo",
    desc: "Create a Basecamp to-do",
    params: [
      {
        name: "project_id",
        type: "string",
        desc: "Project ID",
        required: true,
      },
      {
        name: "todolist_id",
        type: "string",
        desc: "To-do list ID",
        required: true,
      },
      {
        name: "content",
        type: "string",
        desc: "To-do content",
        required: true,
      },
      { name: "due_on", type: "string", desc: "Due date" },
    ],
  },
  {
    name: "basecamp_complete_todo",
    desc: "Complete a Basecamp to-do",
    params: [
      {
        name: "project_id",
        type: "string",
        desc: "Project ID",
        required: true,
      },
      { name: "todo_id", type: "string", desc: "To-do ID", required: true },
    ],
  },
  {
    name: "basecamp_post_message",
    desc: "Post a Basecamp message",
    params: [
      {
        name: "project_id",
        type: "string",
        desc: "Project ID",
        required: true,
      },
      {
        name: "message_board_id",
        type: "string",
        desc: "Message board ID",
        required: true,
      },
      { name: "subject", type: "string", desc: "Subject", required: true },
      { name: "content", type: "string", desc: "Content", required: true },
    ],
  },
];
