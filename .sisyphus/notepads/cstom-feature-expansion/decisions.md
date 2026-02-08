# Decisions: CSTOM Feature Expansion

## [2026-01-25T15:00] Session Start

### Architectural Decisions
- Phase 0 added for infrastructure (Celery + Email) before feature work
- PWA over native mobile apps
- Email over SMS/카카오톡
- Manual QA over automated testing
- Redis as Celery broker (not RabbitMQ)
- Recharts for dashboard visualizations
- html5-qrcode for QR scanner

### Scope Decisions
- NO external system integration (AD/LDAP, etc.) in this phase
- NO offline PWA support (online only)
- NO complex ML pipelines (rule-based + simple statistics)
