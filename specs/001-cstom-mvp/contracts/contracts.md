# API Contracts: CSTOM MVP Core

**Date**: 2026-01-18

## Contracts

### Contracts

- **POST** `/contracts` Create contract
- **GET** `/contracts` List contracts
- **GET** `/contracts/{contractId}` Get contract detail
- **PATCH** `/contracts/{contractId}` Update contract status/risk/scope

### Tasks

- **POST** `/contracts/{contractId}/tasks` Create task
- **GET** `/contracts/{contractId}/tasks` List tasks
- **GET** `/tasks/{taskId}` Get task detail

### Decision Logs

- **POST** `/tasks/{taskId}/decisions` Add decision log (append-only)
- **GET** `/tasks/{taskId}/decisions` List decision logs

### Change/Incident

- **POST** `/contracts/{contractId}/events` Create change/incident record
- **GET** `/contracts/{contractId}/events` List change/incident records
- **GET** `/events/{eventId}` Get event detail
- **PATCH** `/events/{eventId}` Link related change/incident

### Reports

- **POST** `/contracts/{contractId}/reports` Generate report
- **GET** `/contracts/{contractId}/reports` List reports
- **GET** `/reports/{reportId}` Get report

### RBAC & Users

- **POST** `/users` Create user
- **GET** `/users` List users
- **PATCH** `/users/{userId}/roles` Assign role
- **GET** `/roles` List roles

### Audit

- **GET** `/audit/events` List audit events (admin/pm)
