# FocusFlow

## Overview

A productivity-focused task management application for the Internet Computer. Users can organize tasks into projects, set priorities and due dates, filter and sort their task lists, and export data to CSV. All data is stored on-chain with full user ownership through Internet Identity authentication.

## Authentication

- Internet Identity required for all operations
- Anonymous access is not permitted
- User data is isolated by principal - users can only access their own tasks and projects
- Display name can be set for personalization

## Core Features

### Task Management

- Create, update, and delete tasks
- Task properties:
  - Title (required, max 255 characters)
  - Description (optional, max 1000 characters)
  - Due date (optional)
  - Priority: high, medium, or low
  - Project assignment (optional)
  - Completion status
- Toggle task completion with single action
- Maximum of 1000 tasks per user

### Project Organization

- Create, rename, and delete projects
- Project names limited to 100 characters
- Maximum of 50 projects per user
- Assign tasks to projects for organization
- Deleting a project unassigns its tasks (does not delete them)

### Filtering System

- **View Filters**:
  - Today: Tasks due today
  - Upcoming: Tasks due after today
  - All: All tasks regardless of due date
- **Additional Filters**:
  - By project
  - By priority (high, medium, low)
  - By status (active or completed)
  - By search query (case-insensitive title search)

### Sorting Options

- Due date (ascending/descending) - tasks without due dates sorted last
- Priority (ascending/descending)
- Created date (ascending/descending)
- Alphabetical by title (ascending/descending)

### Pagination

- Server-side pagination for performance
- Configurable page size (default 10, max 100)
- Includes total items, total pages, and navigation indicators

### CSV Export

- Export filtered and sorted tasks to CSV format
- Includes: ID, title, description, due date, priority, project name, completion status, created date
- Proper CSV escaping for special characters
- Export disabled when no tasks match current filters

## Backend Data Storage

- **Tasks**: Persistent storage with owner principal, timestamps, and all task metadata
- **Projects**: Persistent storage with owner principal and creation timestamp
- **Users**: Display name preferences keyed by principal
- Maintains state across canister upgrades

## Backend Operations

- All update operations require authentication
- Owner verification on all task and project modifications
- Input validation with descriptive error messages via Debug.trap
- Efficient filtering and sorting at the backend level
- Paginated queries to handle large task lists

## User Interface

- Sidebar navigation with project list
- Main task list with filtering tabs (Today, Upcoming, All)
- Task creation and editing modals
- Project management modals
- Filter modal for advanced filtering options
- Task controls for sorting and export
- Profile modal for display name
- Confirmation dialogs for destructive actions
- Toast notifications for user feedback
- Responsive pagination controls

## Design System

- Clean, focused interface optimized for productivity
- Clear visual hierarchy for task priority levels
- Responsive design for various screen sizes
- Modal-based workflows for focused interactions
- Icon-based actions with clear affordances

## Error Handling

- Authentication required errors for anonymous users
- Authorization errors for accessing others' data
- Validation errors for invalid input (empty titles, too-long text, invalid priorities)
- Resource limit errors when approaching maximums
- Task/project not found errors for invalid IDs
- Empty export prevention when no tasks match filters
