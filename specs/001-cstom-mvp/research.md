# Research: CSTOM MVP Core

**Date**: 2026-01-18

## Decision: Backend Framework

**Decision**: Use Django (REST) for the MVP backend.

**Rationale**:
- Built-in admin and auth/permission model accelerates RBAC setup and audit workflows.
- Mature ecosystem for audit logging and immutable history patterns.
- Proven stability for government/enterprise workflows.

**Alternatives considered**:
- NestJS: Strong TypeScript ecosystem but requires more custom admin/auth/audit plumbing.

**Sources**:
- https://docs.djangoproject.com/en/stable/ref/contrib/admin/
- https://docs.djangoproject.com/en/stable/topics/auth/

## Decision: Next.js Server Components Patterns

**Decision**: Use Server Components for data fetching and rendering; Client Components only for interactive widgets and forms.

**Rationale**:
- Server Components allow direct data access and reduce API layers for admin dashboards.
- Server Actions handle mutations with server-side auth checks.
- Route groups keep admin area isolated without URL changes.

**Alternatives considered**:
- API routes only: more boilerplate and slower iteration for internal admin UI.

**Sources**:
- https://github.com/vercel/next.js/blob/v15.4.0-canary.82/docs/01-app/01-getting-started/07-fetching-data.mdx
- https://nextjs.org/docs/16.1.3/app/api-reference/file-conventions/route-groups
- https://github.com/vercel/next.js/blob/v15.4.0-canary.82/docs/01-app/02-guides/forms.mdx

## Decision: Append-Only Audit Log in PostgreSQL

**Decision**: Use append-only audit tables with JSONB payloads, time-based indexing, and strict immutability (no update/delete).

**Rationale**:
- JSONB enables flexible change capture without schema churn.
- BRIN indexes suit time-ordered append-only tables.
- Triggers and permissions enforce immutability.

**Alternatives considered**:
- Full event-sourcing: higher complexity for MVP.

**Sources**:
- https://www.postgresql.org/docs/current/brin.html
- https://www.bytebase.com/blog/postgres-audit-logging/

## Decision: JWT RBAC + Audit Events

**Decision**: Use JWT with minimal role claims; resolve permissions server-side; audit all auth/authz and data changes.

**Rationale**:
- Small tokens reduce risk and allow permission changes without token refresh.
- Explicit audit coverage for role changes and sensitive actions.

**Alternatives considered**:
- Embedding full permission trees in JWT (token bloat, harder to revoke).

**Sources**:
- https://www.osohq.com/learn/rbac-best-practices
- https://www.permit.io/blog/how-to-use-jwts-for-authorization-best-practices-and-common-mistakes
- https://github.com/keycloak/keycloak/blob/main/docs/documentation/server_admin/topics/clients/oidc/con-token-role-mappings.adoc

## Decision: Report Generation (PDF/Docx)

**Decision**: Use template-based report generation with strict validation and output integrity checks.

**Rationale**:
- Templates ensure consistent monthly/audit report structure.
- Strict validation prevents missing data fields.
- Checksums support audit integrity.

**Alternatives considered**:
- Manual document creation: inconsistent and non-auditable.

**Sources**:
- https://github.com/paperless-ngx/paperless-ngx/blob/dev/src/documents/templating/workflows.py#L2-L10
- https://www.npmjs.com/package/docx-templates
- https://glassalpha.com/guides/compliance-workflow/
