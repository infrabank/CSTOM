---

description: "Task list for CSTOM MVP Core"
---

# Tasks: CSTOM MVP Core

**Input**: Design documents from `/specs/001-cstom-mvp/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/
**Tests**: Not requested in spec.md

**Assumptions**:
- plan.md is still a template; project structure inferred from research.md (Django backend + Next.js frontend).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/` for Django, `frontend/` for Next.js

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and baseline configuration

- [X] T001 Initialize Django project in backend/manage.py
- [X] T002 Initialize Next.js app in frontend/package.json
- [X] T003 [P] Add backend env template in backend/.env.example
- [X] T004 [P] Add frontend env template in frontend/.env.example
- [X] T005 Configure Postgres connection in backend/cstom/settings.py

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [X] T006 Configure DRF and JWT settings in backend/cstom/settings.py
- [X] T007 [P] Create AuditEvent model in backend/audit/models.py
- [X] T008 [P] Create Role and User models in backend/users/models.py
- [X] T009 [P] Implement JWT auth utilities in backend/common/auth.py
- [X] T010 [P] Implement base permission classes in backend/common/permissions.py
- [X] T011 Wire API routing in backend/cstom/urls.py
- [X] T012 [P] Add audit logging hooks in backend/audit/signals.py
- [X] T013 Create initial migrations in backend/audit/migrations/0001_initial.py and backend/users/migrations/0001_initial.py
- [X] T014 [P] Add API error helpers in backend/common/errors.py

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - 사업 등록과 상태 관리 (Priority: P1)

**Goal**: Register contracts with status, scope, and risk flags and track updates

**Independent Test**: PM creates a contract, updates status/risk/scope, and can retrieve current state and history

### Implementation for User Story 1

- [X] T015 [US1] Create Contract model in backend/contracts/models.py
- [X] T016 [US1] Add ContractStatusHistory model in backend/contracts/models.py
- [X] T017 [US1] Add Contract serializers in backend/contracts/serializers.py
- [X] T018 [US1] Implement Contract service in backend/contracts/services.py
- [X] T019 [US1] Implement Contract API views in backend/contracts/views.py
- [X] T020 [US1] Wire Contract routes in backend/contracts/urls.py
- [X] T021 [US1] Register Contract admin in backend/contracts/admin.py
- [X] T022 [P] [US1] Create contracts list page in frontend/src/app/(admin)/contracts/page.tsx
- [X] T023 [P] [US1] Create contract detail page in frontend/src/app/(admin)/contracts/[contractId]/page.tsx
- [X] T024 [US1] Add contract form actions in frontend/src/app/(admin)/contracts/actions.ts

---

## Phase 4: User Story 2 - 작업과 판단 로그 기록 (Priority: P2)

**Goal**: Record tasks and append-only decision logs with rationale and risk acknowledgement

**Independent Test**: User creates a task, adds a decision log, and sees decision details in task view

### Implementation for User Story 2

- [X] T025 [US2] Create Task model in backend/tasks/models.py
- [X] T026 [US2] Create DecisionLog model in backend/decisions/models.py
- [X] T027 [US2] Add Task serializers in backend/tasks/serializers.py
- [X] T028 [US2] Add DecisionLog serializers in backend/decisions/serializers.py
- [X] T029 [US2] Implement Task service in backend/tasks/services.py
- [X] T030 [US2] Implement DecisionLog service in backend/decisions/services.py
- [X] T031 [US2] Implement Task API views in backend/tasks/views.py
- [X] T032 [US2] Implement DecisionLog API views in backend/decisions/views.py
- [X] T033 [US2] Wire Task routes in backend/tasks/urls.py
- [X] T034 [US2] Wire DecisionLog routes in backend/decisions/urls.py
- [X] T035 [P] [US2] Add task detail page in frontend/src/app/(admin)/tasks/[taskId]/page.tsx
- [X] T036 [P] [US2] Add decision log form in frontend/src/components/decision-log-form.tsx

---

## Phase 5: User Story 3 - 변경과 장애의 통합 이력 및 연결 (Priority: P3)

**Goal**: Record change/incident events and link related events with summaries

**Independent Test**: User records an event, links it to another, and sees timeline plus summary text

### Implementation for User Story 3

- [X] T037 [US3] Create ChangeIncident model in backend/events/models.py
- [X] T038 [US3] Add ChangeIncident serializers in backend/events/serializers.py
- [X] T039 [US3] Implement ChangeIncident service in backend/events/services.py
- [X] T040 [US3] Implement summary generation in backend/events/summary.py
- [X] T041 [US3] Implement ChangeIncident API views in backend/events/views.py
- [X] T042 [US3] Wire ChangeIncident routes in backend/events/urls.py
- [X] T043 [P] [US3] Add events list page in frontend/src/app/(admin)/events/page.tsx
- [X] T044 [P] [US3] Add event detail page in frontend/src/app/(admin)/events/[eventId]/page.tsx
- [X] T045 [US3] Add event linking actions in frontend/src/app/(admin)/events/actions.ts

---

## Phase 6: User Story 4 - 보고서 자동 생성 (Priority: P4)

**Goal**: Generate monthly/incident/audit reports with automatic summaries

**Independent Test**: PM generates a monthly report and sees contract summary and event counts

### Implementation for User Story 4

- [X] T046 [US4] Create Report model in backend/reports/models.py
- [X] T047 [US4] Add Report serializers in backend/reports/serializers.py
- [X] T048 [US4] Implement report aggregation in backend/reports/services.py
- [X] T049 [US4] Add report templates in backend/reports/templates/monthly_report.txt
- [X] T050 [US4] Implement Report API views in backend/reports/views.py
- [X] T051 [US4] Wire Report routes in backend/reports/urls.py
- [X] T052 [P] [US4] Add reports list page in frontend/src/app/(admin)/reports/page.tsx
- [X] T053 [P] [US4] Add report detail page in frontend/src/app/(admin)/reports/[reportId]/page.tsx
- [X] T054 [US4] Add report generation actions in frontend/src/app/(admin)/reports/actions.ts

---

## Phase 7: User Story 5 - 역할 기반 권한 통제 (Priority: P5)

**Goal**: Enforce role-based access with PM-only DecisionLog edits and read-only customer access

**Independent Test**: Different roles access the same record and see permissions enforced per role

### Implementation for User Story 5

- [X] T055 [P] [US5] Add role seed data in backend/users/fixtures/roles.json
- [X] T056 [US5] Implement role assignment API in backend/users/views.py
- [X] T057 [US5] Wire role routes in backend/users/urls.py
- [X] T058 [US5] Add role-based permissions in backend/users/permissions.py
- [X] T059 [US5] Enforce DecisionLog edit rules in backend/decisions/permissions.py
- [X] T060 [US5] Add users admin page in frontend/src/app/(admin)/users/page.tsx

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T061 [P] Add audit logging coverage map in backend/audit/coverage.py
- [X] T062 [P] Add RBAC policy matrix in backend/users/policies.py
- [X] T063 [P] Add report integrity hashing helper in backend/reports/integrity.py

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - blocks all user stories
- **User Stories (Phase 3-7)**: Depend on Foundational phase completion
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational; no dependencies on other stories
- **User Story 2 (P2)**: Starts after Foundational; uses Contract references from US1
- **User Story 3 (P3)**: Starts after Foundational; uses Contract references from US1
- **User Story 4 (P4)**: Starts after Foundational; depends on data produced by US1-3
- **User Story 5 (P5)**: Starts after Foundational; applies to US1-4 endpoints and data

### Within Each User Story

- Models before serializers
- Serializers before services
- Services before API views
- API views before frontend pages

---

## Parallel Example: User Story 1

```text
Task: T022 Create contracts list page in frontend/src/app/(admin)/contracts/page.tsx
Task: T023 Create contract detail page in frontend/src/app/(admin)/contracts/[contractId]/page.tsx
```

## Parallel Example: User Story 2

```text
Task: T035 Add task detail page in frontend/src/app/(admin)/tasks/[taskId]/page.tsx
Task: T036 Add decision log form in frontend/src/components/decision-log-form.tsx
```

## Parallel Example: User Story 3

```text
Task: T043 Add events list page in frontend/src/app/(admin)/events/page.tsx
Task: T044 Add event detail page in frontend/src/app/(admin)/events/[eventId]/page.tsx
```

## Parallel Example: User Story 4

```text
Task: T052 Add reports list page in frontend/src/app/(admin)/reports/page.tsx
Task: T053 Add report detail page in frontend/src/app/(admin)/reports/[reportId]/page.tsx
```

## Parallel Example: User Story 5

```text
Task: T055 Add role seed data in backend/users/fixtures/roles.json
Task: T060 Add users admin page in frontend/src/app/(admin)/users/page.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate User Story 1 independently

### Incremental Delivery

1. Setup + Foundational
2. User Story 1
3. User Story 2
4. User Story 3
5. User Story 4
6. User Story 5

---

## Notes

- Tasks are derived from spec.md user stories, data-model.md entities, and contracts/contracts.md endpoints.
- Tests are omitted because spec.md does not request a TDD approach.
