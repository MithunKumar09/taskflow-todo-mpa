# API

Local base URL: `http://127.0.0.1:3000`. JSON writes require `Content-Type: application/json`. This shared demo has no authentication. Responses include `x-request-id` and `Cache-Control: no-store`.

| Method | Path              | Success                                                    |
| ------ | ----------------- | ---------------------------------------------------------- |
| GET    | /health           | 200 {"status":"ok"} after a database probe                 |
| GET    | /api/v1/todos     | 200 {data: Todo[], meta: {page, limit, total, totalPages}} |
| POST   | /api/v1/todos     | 201 {data: Todo}, Location header                          |
| GET    | /api/v1/todos/:id | 200 {data: Todo}                                           |
| PATCH  | /api/v1/todos/:id | 200 {data: Todo}                                           |
| DELETE | /api/v1/todos/:id | 204, empty body                                            |

## Todo DTO

```json
{
  "id": "a689bf04-9ce1-4273-a8ba-441dbb6fb151",
  "title": "Review release",
  "description": null,
  "status": "PENDING",
  "priority": "MEDIUM",
  "dueAt": null,
  "completedAt": null,
  "createdAt": "2026-10-07T10:00:00.000Z",
  "updatedAt": "2026-10-07T10:00:00.000Z"
}
```

Server-generated UUIDs identify records. Timestamps serialize in UTC ISO format; nullable values serialize as null. Browser display and datetime input use the user's local timezone.

## Create and patch

POST accepts required title and optional description, priority, dueAt. Defaults are PENDING, MEDIUM, and null for nullable fields. Unknown/server-owned fields and status on create are rejected.

PATCH accepts title, description, status, priority, dueAt and requires at least one supplied field. Omitted fields are preserved; null clears description/dueAt. Status values: PENDING, IN_PROGRESS, COMPLETED. Priority values: LOW, MEDIUM, HIGH.

Title/description are trimmed. Title length is 1–160 after trimming; description length is at most 5000. Blank optional descriptions normalize to null. Dates require valid ISO date-time with Z or numeric timezone offset; plain dates and timezone-free values are invalid.

Explicit COMPLETED records that operation's completedAt. PENDING/IN_PROGRESS clears it. Omitted status preserves completedAt. These fields update atomically with last-write-wins editing and no revision/conflict machinery.

```http
PATCH /api/v1/todos/a689bf04-9ce1-4273-a8ba-441dbb6fb151
Content-Type: application/json

{"status":"COMPLETED"}
```

## List query

| Parameter | Values/default                                                |
| --------- | ------------------------------------------------------------- |
| q         | Case-insensitive title substring, trimmed, max 160            |
| status    | Optional status enum                                          |
| priority  | Optional priority enum                                        |
| sort      | createdAt_desc (default), createdAt_asc, dueAt, priority_desc |
| page      | Integer ≥1, default 1                                         |
| limit     | Integer 1–100, default 20                                     |

Filters combine with AND. Unknown fields, malformed pagination, and excessive/unsafe offsets are rejected. Due dates sort ascending with nulls last; priority sorts HIGH → MEDIUM → LOW. Every sort has stable UUID tie-breaking.

```http
GET /api/v1/todos?q=review&status=PENDING&priority=HIGH&sort=dueAt&page=1&limit=20
```

Filtered empty results report total 0 and totalPages 0. Out-of-range pages return an empty array with actual metadata. Page and count use independent reads.

## Safe failures

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": [{ "field": "title", "message": "Enter a title." }],
    "requestId": "server-generated-request-id"
  }
}
```

| Status | Cause/code                                                            |
| ------ | --------------------------------------------------------------------- |
| 400    | VALIDATION_ERROR; INVALID_REQUEST for framework/malformed JSON errors |
| 404    | TODO_NOT_FOUND; ROUTE_NOT_FOUND for unknown routes                    |
| 413    | PAYLOAD_TOO_LARGE, body above 64KiB                                   |
| 415    | UNSUPPORTED_MEDIA_TYPE                                                |
| 429    | RATE_LIMITED with plugin retry/header information                     |
| 500    | INTERNAL_SERVER_ERROR                                                 |
| 503    | DATABASE_UNAVAILABLE from health                                      |

Details are empty unless validation issues are available. Stack traces and database secrets stay out of responses. Use the request ID for diagnosis.

Todo routes permit 100 requests/minute per IP normally; test mode uses a higher limit with separate enforcement tests. Health is exempt. CORS permits WEB_ORIGIN and is not an authentication boundary. The [Postman collection](../postman/TaskFlow.postman_collection.json) exercises positive and negative contracts.
