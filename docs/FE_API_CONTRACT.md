# Frontend API Contract for Data Labeling System

## 1. Introduction
This document defines the REST API contract required to support the current Frontend implementation.
**Current Status**: Frontend relies on `mockData.js` and local constants. Backend implementation is required to replace these mocks.

### 1.1 Global Conventions
*   **Base URL**: `/api/v1`
*   **Protocol**: HTTPS
*   **Content-Type**: `application/json`
*   **Date Format**: ISO 8601 (e.g., `2023-10-25T10:00:00Z`)
*   **Authentication**:
    *   Header: `Authorization: Bearer <jwt_token>`
*   **Pagination** (Standard):
    *   Request: `?page=1&limit=10`
    *   Response Envelope:
        ```json
        {
          "data": [ ... ],
          "meta": {
            "page": 1,
            "limit": 10,
            "total": 150,
            "totalPages": 15
          }
        }
        ```
*   **Filtering** (Standard):
    *   Simple: `?status=TODO`
    *   Search: `?q=traffic` (Matches name or ID)
*   **Sorting**:
    *   `?sort=lastUpdated:desc` (Field : Direction)

### 1.2 Standard Error Response
All 4xx and 5xx responses MUST follow this schema:
```json
{
  "code": "ERROR_CODE_STRING",
  "message": "Human readable message for toast notifications",
  "details": {
    "field_name": ["Validation error message"]
  }
}
```
**Common Codes**:
*   `UNAUTHORIZED` (401): Token missing or invalid.
*   `FORBIDDEN` (403): User lacks role for action.
*   `NOT_FOUND` (404): Resource does not exist.
*   `VALIDATION_ERROR` (400): Bad input data.

---

## 2. Domain Models

### 2.1 Enums
| Enum | Values |
| :--- | :--- |
| **Role** | `annotator`, `reviewer`, `manager`, `admin` |
| **TaskStatus** | `TODO`, `IN_PROGRESS`, `SUBMITTED`, `REJECTED`, `APPROVED` |
| **Priority** | `HIGH`, `MEDIUM`, `LOW` |
| **ErrorType** | `accuracy`, `missing`, `wrong_class` (Used in Review Rejection) |

### 2.2 Data Transfer Objects (DTOs)

#### **User**
```typescript
interface User {
  id: string;
  username: string;
  displayName: string; // "Demo User"
  role: Role;
  avatarUrl?: string;
  createdAt: string;
}
```

#### **Project**
```typescript
interface Project {
  id: string;
  name: string;
  type: string;        // e.g. "Bounding Box", "Polygon"
  description?: string;
  guidelines?: string; // HTML/Markdown string
}
// Extended with Stats for Dashboard
interface ProjectStats extends Project {
  taskCount: number;
  completedCount: number;
  progressPercentage: number; // 0-100
}
```

#### **Annotation** (Bounding Box)
```typescript
interface Annotation {
  id: number | string;
  classId: number;     // References Config Class ID
  x: number;           // Top-left X
  y: number;           // Top-left Y
  w: number;           // Width
  h: number;           // Height
}
```

#### **Task**
```typescript
interface Task {
  id: string;
  projectId: string;
  projectName: string; // Denormalized for list views
  status: TaskStatus;
  priority: Priority;
  imageUrl: string;
  lastUpdated: string;
  assigneeName: string; // "Annotator A"
  rejectComment?: string | null;
  annotations?: Annotation[]; // Included in Detail View
}
```

---

## 3. Endpoints

### 3.1 Authentication

#### `POST /auth/login`
*   **Description**: Authenticate user and return token.
*   **Used By**: `Login.jsx`
*   **Request**:
    ```json
    { "username": "demo", "password": "password" }
    ```
*   **Response**:
    ```json
    {
      "token": "jwt_token_string",
      "user": { ...User }
    }
    ```

#### `GET /auth/me`
*   **Description**: Get current user profile (session rehydration).
*   **Used By**: `AuthContext.jsx`
*   **Response**: `{ ...User }`

---

### 3.2 Annotator Actions

#### `GET /tasks`
*   **Description**: List tasks assigned to the current user (Annotator).
*   **Used By**: `TaskList.jsx`
*   **QueryParams**:
    *   `status`: (Optional) Filter by status (e.g. `TODO,IN_PROGRESS`)
    *   `q`: (Optional) Search text
*   **Response**: Paginated list of `Task` (Summary view, no annotations).

#### `GET /tasks/:id`
*   **Description**: Get full details of a task, including image and existing annotations.
*   **Used By**: `Workspace.jsx`
*   **Response**: `Task` (Detail view).

#### `PUT /tasks/:id/draft`
*   **Description**: Save current work without changing status.
*   **Used By**: `Workspace.jsx` (Save Draft)
*   **Request**:
    ```json
    {
      "annotations": [
        { "id": "temp-1", "classId": 1, "x": 10, "y": 10, "w": 50, "h": 50 }
      ]
    }
    ```
*   **Response**: `200 OK`

#### `POST /tasks/:id/submit`
*   **Description**: Submit task for review. Validates required annotations.
*   **Used By**: `Workspace.jsx` (Submit)
*   **Request**: `{ "annotations": [...] }`
*   **Response**: `200 OK`
*   **Side Effect**: Status changes to `SUBMITTED`.

---

### 3.3 Reviewer Actions

#### `GET /reviews/queue`
*   **Description**: List tasks waiting for review.
*   **Used By**: `ReviewQueue.jsx`
*   **QueryParams**: `?status=SUBMITTED` (Implicit default)
*   **Response**: Paginated list of `Task`.

#### `GET /reviews/:taskId`
*   **Description**: Get task details for review mode.
*   **Used By**: `ReviewWorkspace.jsx`
*   **Response**: `Task` (Detail view).

#### `POST /reviews/:taskId/approve`
*   **Description**: Approve a task.
*   **Used By**: `ReviewWorkspace.jsx`
*   **Response**: `200 OK`
*   **Side Effect**: Status changes to `APPROVED`.

#### `POST /reviews/:taskId/reject`
*   **Description**: Reject a task with feedback.
*   **Used By**: `ReviewWorkspace.jsx`
*   **Request**:
    ```json
    {
      "comment": "Bounding box is too loose.",
      "errorType": "accuracy"
    }
    ```
*   **Response**: `200 OK`
*   **Side Effect**: Status changes to `REJECTED`. Assignee sees comment.

---

### 3.4 Manager Analytics

#### `GET /manager/stats`
*   **Description**: Global KPIs for the dashboard.
*   **Used By**: `Dashboard.jsx`
*   **Response**:
    ```json
    {
      "totalProjects": 12,
      "activeAnnotators": 8,
      "avgThroughputPerHour": 342,
      "qualityScore": 98.2,
      "systemHealth": { "api": "up", "db": "up", "latencyMs": 12 }
    }
    ```

#### `GET /projects`
*   **Description**: List all projects with progress stats.
*   **Used By**: `Dashboard.jsx` (Projects Table)
*   **Response**: Paginated list of `ProjectStats`.

#### `GET /projects/:projectId`
*   **Description**: Get single project details.
*   **Used By**: (Future screen)

---

## 4. Configuration & Metadata
Currently, `CLASSES` and `TOOLS` are hardcoded in the Frontend. The Backend should expose these in the future to allow dynamic configuration per project.

#### `GET /projects/:projectId/config`
*   **Status**: **RECOMMENDED** (Not yet implemented in FE)
*   **Response**:
    ```json
    {
      "classes": [
        { "id": 1, "name": "Traffic Light", "color": "#ef4444" },
        { "id": 2, "name": "Stop Sign", "color": "#f97316" }
      ],
      "tools": ["select", "bbox", "polygon"]
    }
    ```

## 5. Implementation Roadmap (Backend)
1.  **Auth Service**: Implement `login` and `me`.
2.  **Core Task API**: Implement `GET /tasks` (with filters) and `GET /tasks/:id`.
3.  **Annotation Storage**: DB schema for saving annotations (JSON or relational).
4.  **Workflow Logic**: Implement Status transitions (Submit -> Review -> Approve/Reject).
5.  **Analytics**: Implement complex queries for Manager Dashboard.
