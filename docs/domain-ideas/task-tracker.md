---
name: Task Tracker
slug: task-tracker
core-aggregates: [Project, Task, Comment, Assignment]
learning-focus: Multiple Aggregates, authorization policy, workflow
---

# Task Tracker

## Overview

A project-management system like Jira, Linear, or Trello. Projects contain Tasks, Tasks are assigned to members, and progress is represented by state transitions. Key learning points include permission models, project membership, comments, and customizable workflows. Higher tiers add a workflow engine, Notification BC, and time tracking.

DDD learning value: expressing permissions as domain rules, coordinating multiple Aggregates such as Project, Task, and Assignment, and implementing a workflow engine with custom state transitions.

## Universal Actors

- **Primary**: Member who creates and completes tasks.
- **Secondary**: Project admin who defines workflows and manages members.

## Universal Domain Events

- ProjectCreated
- ProjectMemberAdded
- ProjectMemberRemoved
- ProjectArchived
- TaskCreated
- TaskAssigned
- TaskReassigned
- TaskUnassigned
- TaskStatusChanged
- TaskCompleted
- TaskReopened
- CommentPosted
- CommentEdited
- DueDateSet / DueDateApproached / DueDateMissed
- TimeLogged
- WorkflowCustomized

---

## Tier: Basic

**Target learning pattern**: Single Aggregate, state transition.

**Scope**: One Task Aggregate. Create, edit, transition status, and complete. No Project; assume a single user.

### Pre-baked Discovery Answers

1. **Primary/Secondary Users**:
   - Primary: User
   - Secondary: N/A

2. **Domain Events (5-6)**:
   - TaskCreated
   - TaskUpdated
   - TaskStatusChanged
   - TaskCompleted
   - TaskReopened
   - TaskDeleted

3. **KPIs**: N/A

4. **Differentiation**: N/A

5. **Out of Scope**:
   - Project until intermediate tier
   - Membership and assignment
   - Authorization
   - Comment
   - Notification
   - Time tracking

### Suggested BC Candidate

- **Single BC**: `Task` -- single-user to-do list.

### Key Learning Goals

- VO: `TaskId`, `TaskTitle`, `Description`, `TaskStatus` (TODO/IN_PROGRESS/DONE), and `Priority`.
- Aggregate Root state-transition methods: `start()`, `complete()`, `reopen()`.
- Single-Aggregate CQRS.

---

## Tier: Intermediate

**Target learning pattern**: 2 Aggregates, authorization policy, cross-aggregate validation.

**Scope**: Project and Task Aggregates across 1-2 BCs. Manage project membership. Tasks belong to Projects and only members can manipulate them. Add Assignment.

### Pre-baked Discovery Answers

1. **Primary/Secondary Users**:
   - Primary: Member
   - Secondary: Project admin

2. **Domain Events (8-10)**:
   - ProjectCreated
   - ProjectMemberAdded
   - ProjectMemberRemoved
   - TaskCreated
   - TaskAssigned
   - TaskUnassigned
   - TaskStatusChanged
   - TaskCompleted
   - TaskReopened
   - UnauthorizedAccessRejected

3. **KPIs**: N/A

4. **Differentiation**: N/A

5. **Out of Scope**:
   - Comment until advanced tier
   - Notification
   - Workflow customization; use fixed transitions.
   - Time tracking
   - Authentication; assume User ID comes from outside.

### Suggested BC Candidates

- **BC-1: Project Management** (Supporting) -- Project and membership.
- **BC-2: Task Management** (Core) -- task lifecycle and assignment.

### Key Learning Goals

- Cross-BC Port: `ProjectMembershipQueryPort` for Task BC authorization checks.
- Domain Service: `TaskAuthorizationPolicy` for member validation.
- Authorization domain exceptions such as `NotProjectMemberException` and `NotTaskAssigneeException`.
- VO: `ProjectMemberId`, `Role` (OWNER/MEMBER/VIEWER), and `Assignment`.
- Aggregate references by ID only.

---

## Tier: Advanced

**Target learning pattern**: 3+ BCs, Domain Events, workflow engine, notification.

**Scope**: Separate Project, Task, Comment, Workflow, Notification, and Time Tracking BCs. Per-project custom workflows, notification for mentions and due dates, and time tracking.

### Pre-baked Discovery Answers

1. **Primary/Secondary Users**:
   - Primary: Member
   - Secondary: Project admin
   - Tertiary: Scheduler system for due-date detection and automatic notifications

2. **Domain Events (12-14)**:
   - ProjectCreated / ProjectArchived
   - ProjectMemberAdded / ProjectMemberRemoved
   - TaskCreated
   - TaskAssigned / TaskReassigned
   - TaskStatusChanged
   - TaskCompleted
   - CommentPosted with mention data
   - DueDateSet / DueDateApproached / DueDateMissed
   - TimeLogged
   - WorkflowCustomized

3. **KPIs**: N/A

4. **Differentiation**: N/A

5. **Out of Scope**:
   - Real SMS/email delivery; publish events only.
   - Authentication
   - UI
   - Statistics/reporting

### Suggested BC Candidates

- **BC-1: Project Management** (Supporting) -- Project and membership.
- **BC-2: Task Management** (Core) -- Task lifecycle and Assignment.
- **BC-3: Workflow Engine** (Core) -- project-specific custom state-transition rules using Specification.
- **BC-4: Collaboration** (Supporting) -- Comment and Mention.
- **BC-5: Notification** (Generic) -- consumes domain events and sends notification jobs.
- **BC-6: Time Tracking** (Supporting) -- TimeLog.

### Key Learning Goals

- Domain Event publish/subscribe.
- Workflow engine with per-project transitions through `WorkflowDefinition` and `TransitionRule`.
- Saga: completing a task activates dependent tasks.
- Policy engine with Specification pattern for transition validation.
- ACL: Workflow Engine abstracts Task status into its own model.
- Same-word-different-meaning: Member as permission holder in Project BC versus notification recipient in Notification BC.
- Time-based domain event such as DueDateApproached emitted by a scheduler.
