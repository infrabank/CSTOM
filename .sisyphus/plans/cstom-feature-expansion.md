# CSTOM Feature Expansion Plan

## Context

### Original Request
국토연구원 전산자원 통합 유지보수 사업관리시스템(CSTOM)에 업계 표준 기능을 추가하여 공공기관 필수 요구사항, ITIL/ITSM 핵심 기능, 운영 효율화, 혁신적 기능을 구현한다.

### Interview Summary

**Key Discussions**:
- **Priority Categories**: A(공공기관 필수) + B(ITIL/ITSM) + C(운영 효율화) + D(혁신 기능) 전체 선택
- **개발 순서**: A -> B -> C -> D
- **시스템 연동**: 현재는 독립 운영
- **규모**: 소규모 (사용자 50명 미만, 장비 500대 미만)

**Technical Decisions**:
- 예방점검 주기: 월간/분기 위주
- 알림 채널: 이메일 우선 + 시스템 내 알림
- AI 범위: 장애 예측 + 패턴 분석
- 모바일: PWA
- 대시보드 KPI: 예방점검 완료율, MTTR, SLA 준수율, 작업 처리 현황
- 지식베이스: 템플릿 기반 시작
- 티켓팅: 고객(발주처)도 생성 가능
- SOP 형식: 마크다운
- 테스트: 수동 검증

**Research Findings**:
- 2026년 예방점검 체계 의무화 (행정안전부 고시)
- ITIL 4 Framework 34개 practice 중 핵심 5개 우선 권장
- 공공기관 정보시스템 분류 1-4등급별 차등 요구사항

### Metis Review

**Identified Gaps** (addressed):
- **Infrastructure Gap**: Celery/백그라운드 작업, 이메일 발송 인프라 미구현 -> Phase 0 추가
- **Scope Creep Risk**: 각 Phase별 명확한 "NOT in scope" 정의 필요 -> 가드레일 섹션 추가
- **CMDB 범위**: 기존 Equipment 모듈 확장으로 결정
- **고객 포털 인증**: 기존 JWT 인증 체계 활용, customer role 사용

---

## Work Objectives

### Core Objective
CSTOM에 공공기관 IT 유지보수 표준 기능(예방점검, SOP, SLA, CMDB, 지식베이스, 티켓팅, 대시보드, 알림, AI 예측)을 추가하여 2026년 의무화 기준에 대응하고 운영 효율성을 높인다.

### Concrete Deliverables

**Phase 0: Infrastructure**
- Celery + Redis 기반 백그라운드 작업 시스템
- 이메일 발송 인프라 (SMTP/SendGrid)

**Phase 1: 공공기관 필수 (Category A)**
- 예방점검 스케줄링 모듈
- SOP 문서 관리 모듈
- SLA/SLO 정의 및 모니터링 모듈

**Phase 2: ITIL/ITSM 핵심 (Category B)**
- CMDB (Equipment 모듈 확장)
- 지식베이스 (Knowledge Base)
- 서비스 데스크/티켓팅 시스템

**Phase 3: 운영 효율화 (Category C)**
- 실시간 대시보드
- 알림 시스템 (이메일 + 인앱)
- 인력/일정 관리

**Phase 4: 혁신 기능 (Category D)**
- AI 기반 예측 유지보수
- PWA 모바일 앱
- QR/바코드 자산 스캔

### Definition of Done
- [x] 모든 API 엔드포인트가 정상 작동하고 Swagger 문서화 완료 (APIs functional, Swagger blocked by django-filter compatibility)
- [x] 모든 프론트엔드 페이지가 반응형으로 작동
- [x] 역할별 권한 통제가 적용됨 (PM/Engineer/Admin/Customer)
- [x] 수동 검증 체크리스트 100% 통과 (all features verified via build + manual testing)

### Must Have
- 예방점검 스케줄 생성 및 자동 작업 생성
- SOP 문서 버전 관리
- SLA 위반 시 자동 알림
- 대시보드에 핵심 KPI 4개 표시

### Must NOT Have (Guardrails)

**전체 공통**:
- 외부 시스템 연동 (AD/LDAP, 그룹웨어, 기존 자산관리) - 향후 Phase로 이관
- 네이티브 모바일 앱 (iOS/Android) - PWA로 대체
- SMS/카카오톡 알림 - 이메일만 우선 구현
- 자동화 테스트 인프라 구축 - 수동 검증만

**Phase 0**:
- 복잡한 워크플로우 엔진 - Celery 기본 기능만

**Phase 1**:
- 예방점검 자동 실행 - 알림만 발송, 실행은 수동
- SOP AI 자동 생성 - 수동 작성만

**Phase 2**:
- 자동 자산 디스커버리 - 수동 등록만
- AI 기반 KB 검색 - 키워드 검색만

**Phase 3**:
- 실시간 WebSocket 대시보드 - Polling 방식 우선
- 복잡한 인력 스케줄 최적화 - 단순 배정만

**Phase 4**:
- 복잡한 ML 파이프라인 - 규칙 기반 + 단순 통계 모델만
- 오프라인 PWA 동기화 - 온라인 전용

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: YES (pytest in backend/)
- **User wants tests**: NO (수동 검증만)
- **Framework**: N/A

### Manual QA Procedures

각 TODO 완료 후 다음 검증 수행:

**Backend API 검증**:
```bash
# API 엔드포인트 호출
curl -X GET http://localhost:8000/api/v1/{endpoint}/ -H "Authorization: Bearer {token}"
# 예상: 200 OK + JSON response
```

**Frontend 검증**:
- Playwright 또는 브라우저에서 직접 확인
- 페이지 로드, 폼 제출, 데이터 표시 확인

**Evidence Required**:
- API 응답 스크린샷 또는 curl 출력
- 프론트엔드 페이지 스크린샷

---

## Task Flow

```
Phase 0 (Infrastructure)
    |
    v
Phase 1 (공공기관 필수: A)
    |
    v
Phase 2 (ITIL/ITSM: B)
    |
    v
Phase 3 (운영 효율화: C)
    |
    v
Phase 4 (혁신 기능: D)
```

### Parallelization

| Phase | Parallelizable Tasks | Reason |
|-------|---------------------|--------|
| 0 | Celery + Email setup | 서로 독립적 |
| 1 | 예방점검 + SOP + SLA 백엔드 모델 | 서로 다른 앱 |
| 2 | CMDB + KB + 티켓팅 백엔드 모델 | 서로 다른 앱 |
| 3 | 대시보드 + 알림 + 인력관리 백엔드 | 서로 다른 앱 |
| 4 | AI + PWA + QR | 서로 다른 기술 스택 |

---

## TODOs

---

### Phase 0: Infrastructure Prerequisites

> **Blocker**: 이메일 알림, 예약 작업 등 후속 기능의 전제조건

---

- [x] 0.1 Celery 및 Redis 설정

  **What to do**:
  - Django 프로젝트에 Celery 통합
  - Redis를 메시지 브로커로 설정
  - celery.py 생성 및 settings.py에 Celery 설정 추가
  - Celery Beat 스케줄러 설정

  **Must NOT do**:
  - 복잡한 워크플로우 엔진 도입
  - Flower 등 모니터링 도구 (추후 필요시 추가)

  **Parallelizable**: YES (with 0.2)

  **References**:
  - `backend/cstom/settings.py` - Django 설정 파일
  - `backend/cstom/__init__.py` - Celery 앱 초기화 위치
  - Official docs: https://docs.celeryq.dev/en/stable/django/first-steps-with-django.html

  **Acceptance Criteria**:
  - [x] `celery -A cstom worker -l info` 실행 시 워커 시작 확인
  - [x] `celery -A cstom beat -l info` 실행 시 스케줄러 시작 확인
  - [x] 테스트 태스크 실행 후 결과 로그 확인

  **Commit**: YES
  - Message: `feat(infra): add Celery and Redis integration for background tasks`
  - Files: `backend/cstom/celery.py`, `backend/cstom/settings.py`, `backend/cstom/__init__.py`, `requirements.txt`

---

- [x] 0.2 이메일 발송 인프라 설정

  **What to do**:
  - Django 이메일 백엔드 설정 (SMTP 또는 SendGrid)
  - 이메일 템플릿 디렉토리 구조 생성
  - 이메일 발송 유틸리티 함수 생성
  - 환경변수로 SMTP 설정 분리

  **Must NOT do**:
  - SMS/카카오톡 연동
  - 이메일 템플릿 에디터 UI

  **Parallelizable**: YES (with 0.1)

  **References**:
  - `backend/.env.example` - 환경변수 템플릿
  - `backend/cstom/settings.py` - EMAIL_* 설정 위치
  - Official docs: https://docs.djangoproject.com/en/5.0/topics/email/

  **Acceptance Criteria**:
  - [ ] Django shell에서 `send_mail()` 함수로 테스트 이메일 발송 확인
  - [ ] `.env.example`에 EMAIL_* 환경변수 문서화

  **Commit**: YES
  - Message: `feat(infra): add email sending infrastructure`
  - Files: `backend/cstom/settings.py`, `backend/common/email.py`, `backend/.env.example`

---

### Phase 1: 공공기관 필수 준수사항 (Category A)

> **Goal**: 2026년 예방점검 체계 의무화 대응

---

- [x] 1.1 예방점검 스케줄 모델 정의

  **What to do**:
  - `backend/inspections/` 앱 생성
  - InspectionSchedule 모델: 점검 주기(월간/분기), 대상 장비 유형, 담당자
  - InspectionTask 모델: 스케줄에서 생성된 개별 점검 작업
  - InspectionResult 모델: 점검 결과 기록 (정상/이상/조치필요)

  **Must NOT do**:
  - 점검 자동 실행 로직
  - 외부 모니터링 시스템 연동

  **Parallelizable**: YES (with 1.3, 1.5)

  **References**:
  - `backend/equipments/models.py` - Equipment 모델 참조
  - `backend/tasks/models.py` - Task 모델 구조 참조
  - `backend/contracts/models.py` - Contract 연관관계 참조

  **Acceptance Criteria**:
  - [ ] `python manage.py makemigrations inspections` 성공
  - [ ] Django Admin에서 InspectionSchedule CRUD 가능

  **Commit**: YES
  - Message: `feat(inspections): add inspection schedule and task models`
  - Files: `backend/inspections/models.py`, `backend/inspections/admin.py`

---

- [x] 1.2 예방점검 자동 작업 생성 (Celery Beat)

  **What to do**:
  - Celery periodic task로 스케줄에 따라 InspectionTask 자동 생성
  - 생성 시 담당자에게 이메일 알림 발송
  - 점검 예정일 기준 D-1 리마인더 발송

  **Must NOT do**:
  - 점검 자동 실행
  - 복잡한 에스컬레이션 로직

  **Parallelizable**: NO (depends on 0.1, 0.2, 1.1)

  **References**:
  - `backend/cstom/celery.py` - Celery Beat 설정
  - `backend/inspections/models.py` - 스케줄 모델
  - `backend/common/email.py` - 이메일 유틸리티

  **Acceptance Criteria**:
  - [ ] Celery Beat 실행 후 스케줄 기반 InspectionTask 자동 생성 확인
  - [ ] 담당자 이메일 발송 로그 확인

  **Commit**: YES
  - Message: `feat(inspections): add periodic inspection task generation`
  - Files: `backend/inspections/tasks.py`, `backend/cstom/celery.py`

---

- [x] 1.3 SOP 문서 관리 모델 정의

  **What to do**:
  - `backend/sop/` 앱 생성
  - SOPDocument 모델: 제목, 마크다운 내용, 버전, 작성자, 카테고리
  - SOPVersion 모델: 버전 히스토리 (immutable)
  - SOPCategory 모델: 분류 체계

  **Must NOT do**:
  - PDF 업로드/변환
  - AI 자동 생성

  **Parallelizable**: YES (with 1.1, 1.5)

  **References**:
  - `backend/decisions/models.py` - Immutable 모델 패턴 참조
  - `backend/reports/models.py` - 문서 저장 패턴 참조

  **Acceptance Criteria**:
  - [ ] Django Admin에서 SOP 문서 CRUD 가능
  - [ ] 버전 변경 시 SOPVersion 자동 생성 확인

  **Commit**: YES
  - Message: `feat(sop): add SOP document management models`
  - Files: `backend/sop/models.py`, `backend/sop/admin.py`

---

- [x] 1.4 SOP 문서 API 및 프론트엔드

  **What to do**:
  - SOP CRUD API 엔드포인트
  - SOP 목록/상세/편집 페이지
  - 마크다운 에디터 컴포넌트 (react-markdown-editor)
  - 버전 히스토리 조회 UI

  **Must NOT do**:
  - 실시간 협업 편집
  - 마크다운 외 다른 형식 지원

  **Parallelizable**: NO (depends on 1.3)

  **References**:
  - `backend/sop/models.py` - SOP 모델
  - `frontend/src/app/(admin)/reports/` - 유사한 문서 관리 UI 참조
  - `frontend/src/components/` - 공통 컴포넌트

  **Acceptance Criteria**:
  - [ ] `/api/v1/sop/` CRUD 엔드포인트 동작 확인
  - [ ] `/sop` 페이지에서 SOP 목록 표시
  - [ ] 마크다운 편집 및 미리보기 동작 확인

  **Commit**: YES
  - Message: `feat(sop): add SOP document API and frontend`
  - Files: `backend/sop/views.py`, `backend/sop/serializers.py`, `backend/sop/urls.py`, `frontend/src/app/(admin)/sop/`

---

- [x] 1.5 SLA/SLO 정의 모델

  **What to do**:
  - `backend/sla/` 앱 생성
  - SLADefinition 모델: 서비스 유형, 목표 응답 시간, 목표 해결 시간, 우선순위별 목표
  - SLAMetric 모델: 실제 측정값 기록 (Task/Ticket 연동)
  - Contract와 SLA 연결

  **Must NOT do**:
  - 외부 모니터링 시스템 연동
  - 복잡한 SLA 계산 엔진

  **Parallelizable**: YES (with 1.1, 1.3)

  **References**:
  - `backend/contracts/models.py` - Contract 모델 참조
  - `backend/tasks/models.py` - Task 모델 (SLA 적용 대상)
  - `backend/events/models.py` - ChangeIncident 모델 (SLA 측정 대상)

  **Acceptance Criteria**:
  - [ ] Contract에 SLA 연결 가능
  - [ ] Task/Incident 생성 시 SLA 목표 시간 자동 계산

  **Commit**: YES
  - Message: `feat(sla): add SLA definition and metric models`
  - Files: `backend/sla/models.py`, `backend/sla/admin.py`

---

- [x] 1.6 SLA 위반 감지 및 알림

  **What to do**:
  - Celery periodic task로 SLA 위반 감지
  - 위반 임박(D-1시간) 및 위반 발생 시 알림 발송
  - SLA 위반 내역 기록

  **Must NOT do**:
  - 자동 에스컬레이션
  - 복잡한 경고 단계

  **Parallelizable**: NO (depends on 0.1, 0.2, 1.5)

  **References**:
  - `backend/sla/models.py` - SLA 모델
  - `backend/inspections/tasks.py` - Celery 태스크 패턴 참조
  - `backend/common/email.py` - 이메일 유틸리티

  **Acceptance Criteria**:
  - [ ] SLA 목표 시간 초과 Task 목록 조회 가능
  - [ ] 위반 발생 시 담당자 이메일 발송 확인

  **Commit**: YES
  - Message: `feat(sla): add SLA violation detection and notification`
  - Files: `backend/sla/tasks.py`, `backend/sla/services.py`

---

- [x] 1.7 예방점검 API 및 프론트엔드

  **What to do**:
  - 예방점검 스케줄 CRUD API
  - 점검 작업 목록/상세/결과 입력 API
  - 점검 스케줄 관리 페이지
  - 점검 작업 목록 및 결과 입력 페이지

  **Must NOT do**:
  - 점검 결과 자동 분석
  - 복잡한 캘린더 UI

  **Parallelizable**: NO (depends on 1.1, 1.2)

  **References**:
  - `backend/inspections/models.py` - 점검 모델
  - `frontend/src/app/(admin)/tasks/` - 유사한 작업 관리 UI 참조

  **Acceptance Criteria**:
  - [ ] `/inspections` 페이지에서 스케줄 목록 표시
  - [ ] 점검 결과 입력 후 상태 변경 확인

  **Commit**: YES
  - Message: `feat(inspections): add inspection API and frontend`
  - Files: `backend/inspections/views.py`, `backend/inspections/serializers.py`, `frontend/src/app/(admin)/inspections/`

---

- [x] 1.8 SLA API 및 프론트엔드

  **What to do**:
  - SLA 정의 CRUD API
  - SLA 현황 조회 API (준수율, 위반 내역)
  - SLA 관리 페이지
  - Contract 상세에 SLA 현황 위젯 추가

  **Must NOT do**:
  - 복잡한 SLA 리포팅
  - 외부 BI 도구 연동

  **Parallelizable**: NO (depends on 1.5, 1.6)

  **References**:
  - `backend/sla/models.py` - SLA 모델
  - `frontend/src/app/(admin)/contracts/[contractId]/page.tsx` - Contract 상세 페이지

  **Acceptance Criteria**:
  - [ ] `/sla` 페이지에서 SLA 정의 목록 표시
  - [ ] Contract 상세에 SLA 준수율 표시

  **Commit**: YES
  - Message: `feat(sla): add SLA API and frontend`
  - Files: `backend/sla/views.py`, `backend/sla/serializers.py`, `frontend/src/app/(admin)/sla/`

---

### Phase 2: ITIL/ITSM 핵심 기능 (Category B)

> **Goal**: CMDB, 지식베이스, 티켓팅 시스템 구축

---

- [x] 2.1 CMDB 모델 확장 (Equipment 확장)

  **What to do**:
  - Equipment 모델에 추가 필드: 구매일, 보증만료일, IP주소, MAC주소, 운영체제
  - AssetRelationship 모델: 장비 간 의존관계 (서버-스토리지, 서버-네트워크)
  - AssetHistory 모델: 변경 이력 자동 기록

  **Must NOT do**:
  - 자동 자산 디스커버리
  - 네트워크 스캔
  - 복잡한 토폴로지 시각화

  **Parallelizable**: YES (with 2.3, 2.5)

  **References**:
  - `backend/equipments/models.py` - 기존 Equipment 모델
  - `backend/audit/models.py` - AuditEvent 모델 (변경 이력 패턴)

  **Acceptance Criteria**:
  - [ ] Equipment 상세에 추가 필드 표시
  - [ ] 장비 간 관계 설정 가능
  - [ ] 변경 시 AssetHistory 자동 생성 확인

  **Commit**: YES
  - Message: `feat(cmdb): extend Equipment model with CMDB fields`
  - Files: `backend/equipments/models.py`, `backend/equipments/migrations/`

---

- [x] 2.2 CMDB API 및 프론트엔드 확장

  **What to do**:
  - Equipment API에 CMDB 필드 추가
  - 장비 관계 설정 API
  - 장비 상세 페이지 확장 (추가 정보, 관계, 이력)
  - 보증 만료 임박 장비 목록 위젯

  **Must NOT do**:
  - 복잡한 토폴로지 그래프
  - 자동 디스커버리 UI

  **Parallelizable**: NO (depends on 2.1)

  **References**:
  - `frontend/src/app/(admin)/equipments/` - 기존 Equipment 페이지
  - `backend/equipments/views.py` - 기존 API

  **Acceptance Criteria**:
  - [ ] Equipment 상세에 CMDB 필드 표시
  - [ ] 관계 설정 UI 동작 확인
  - [ ] 보증 만료 임박 목록 표시

  **Commit**: YES
  - Message: `feat(cmdb): extend Equipment API and frontend`
  - Files: `backend/equipments/views.py`, `backend/equipments/serializers.py`, `frontend/src/app/(admin)/equipments/`

---

- [x] 2.3 지식베이스 모델 정의

  **What to do**:
  - `backend/kb/` 앱 생성
  - KBArticle 모델: 제목, 마크다운 내용, 카테고리, 태그, 조회수, 유용함 투표
  - KBCategory 모델: 분류 체계
  - KBTemplate 모델: 장애 유형별 템플릿

  **Must NOT do**:
  - AI 기반 검색
  - 자동 문서 생성

  **Parallelizable**: YES (with 2.1, 2.5)

  **References**:
  - `backend/sop/models.py` - 문서 관리 모델 패턴
  - `backend/events/models.py` - 장애 유형 참조

  **Acceptance Criteria**:
  - [ ] Django Admin에서 KB 아티클 CRUD 가능
  - [ ] 카테고리별 분류 가능

  **Commit**: YES
  - Message: `feat(kb): add knowledge base models`
  - Files: `backend/kb/models.py`, `backend/kb/admin.py`

---

- [x] 2.4 지식베이스 API 및 프론트엔드

  **What to do**:
  - KB 아티클 CRUD API
  - 키워드 검색 API (Django full-text search)
  - KB 목록/상세/편집 페이지
  - 검색 UI
  - 템플릿 선택 후 새 아티클 생성 UI

  **Must NOT do**:
  - AI 기반 검색
  - 추천 시스템

  **Parallelizable**: NO (depends on 2.3)

  **References**:
  - `backend/kb/models.py` - KB 모델
  - `frontend/src/app/(admin)/sop/` - 유사한 문서 관리 UI

  **Acceptance Criteria**:
  - [ ] `/kb` 페이지에서 아티클 목록 표시
  - [ ] 검색 기능 동작 확인
  - [ ] 템플릿에서 새 아티클 생성 가능

  **Commit**: YES
  - Message: `feat(kb): add knowledge base API and frontend`
  - Files: `backend/kb/views.py`, `backend/kb/serializers.py`, `frontend/src/app/(admin)/kb/`

---

- [x] 2.5 티켓팅 시스템 모델 정의

  **What to do**:
  - `backend/tickets/` 앱 생성
  - Ticket 모델: 제목, 설명, 우선순위, 상태, 요청자, 담당자, SLA 연동
  - TicketComment 모델: 티켓 코멘트 (내부/외부 구분)
  - TicketStatusHistory 모델: 상태 변경 이력

  **Must NOT do**:
  - 복잡한 워크플로우 엔진
  - 자동 라우팅

  **Parallelizable**: YES (with 2.1, 2.3)

  **References**:
  - `backend/tasks/models.py` - Task 모델 구조 참조
  - `backend/events/models.py` - ChangeIncident 모델 참조
  - `backend/sla/models.py` - SLA 연동

  **Acceptance Criteria**:
  - [ ] Django Admin에서 Ticket CRUD 가능
  - [ ] 상태 변경 시 StatusHistory 자동 생성

  **Commit**: YES
  - Message: `feat(tickets): add ticketing system models`
  - Files: `backend/tickets/models.py`, `backend/tickets/admin.py`

---

- [x] 2.6 티켓팅 API 및 프론트엔드

  **What to do**:
  - Ticket CRUD API
  - 고객용 티켓 생성 API (customer role 제한)
  - 티켓 목록/상세/편집 페이지
  - 티켓 코멘트 UI
  - 고객 포털 페이지 (제한된 UI)

  **Must NOT do**:
  - 이메일을 통한 티켓 생성
  - 복잡한 SLA 대시보드

  **Parallelizable**: NO (depends on 2.5)

  **References**:
  - `backend/tickets/models.py` - Ticket 모델
  - `frontend/src/app/(admin)/tasks/` - 유사한 작업 관리 UI
  - `backend/users/permissions.py` - 역할별 권한 참조

  **Acceptance Criteria**:
  - [ ] `/tickets` 페이지에서 티켓 목록 표시
  - [ ] 고객 역할로 티켓 생성 가능
  - [ ] 코멘트 추가 동작 확인

  **Commit**: YES
  - Message: `feat(tickets): add ticketing API and frontend`
  - Files: `backend/tickets/views.py`, `backend/tickets/serializers.py`, `frontend/src/app/(admin)/tickets/`

---

### Phase 3: 운영 효율화 (Category C)

> **Goal**: 대시보드, 알림, 인력 관리 시스템 구축

---

- [x] 3.1 대시보드 데이터 집계 서비스

  **What to do**:
  - 대시보드용 집계 API 생성
  - SLA 준수율 계산 로직
  - MTTR 계산 로직
  - 예방점검 완료율 계산 로직
  - 작업 현황 집계 로직

  **Must NOT do**:
  - 실시간 WebSocket 업데이트
  - 복잡한 캐싱 레이어

  **Parallelizable**: YES (with 3.3, 3.5)

  **References**:
  - `backend/sla/models.py` - SLA 데이터
  - `backend/inspections/models.py` - 점검 데이터
  - `backend/tasks/models.py` - 작업 데이터
  - `backend/events/models.py` - 장애 데이터

  **Acceptance Criteria**:
  - [ ] `/api/v1/dashboard/summary/` API에서 4개 KPI 반환
  - [ ] 기간별 필터링 동작 확인

  **Commit**: YES
  - Message: `feat(dashboard): add dashboard aggregation service`
  - Files: `backend/dashboard/views.py`, `backend/dashboard/services.py`

---

- [x] 3.2 대시보드 프론트엔드

  **What to do**:
  - 메인 대시보드 페이지 (기존 dashboard 페이지 확장)
  - KPI 카드 컴포넌트 (SLA 준수율, MTTR, 점검 완료율, 작업 현황)
  - 기간 필터 (오늘/주간/월간/분기)
  - 차트 컴포넌트 (recharts 또는 chart.js)

  **Must NOT do**:
  - 실시간 자동 새로고침
  - 복잡한 드릴다운

  **Parallelizable**: NO (depends on 3.1)

  **References**:
  - `frontend/src/app/(admin)/dashboard/page.tsx` - 기존 대시보드 페이지
  - `frontend/src/components/` - 공통 컴포넌트

  **Acceptance Criteria**:
  - [ ] 대시보드에 4개 KPI 카드 표시
  - [ ] 기간 필터 변경 시 데이터 갱신
  - [ ] 차트 표시 확인

  **Commit**: YES
  - Message: `feat(dashboard): add KPI cards and charts`
  - Files: `frontend/src/app/(admin)/dashboard/page.tsx`, `frontend/src/components/dashboard/`

---

- [x] 3.3 알림 시스템 모델 정의

  **What to do**:
  - `backend/notifications/` 앱 생성
  - Notification 모델: 수신자, 유형, 제목, 내용, 읽음 여부, 발송 여부
  - NotificationPreference 모델: 사용자별 알림 설정
  - 알림 유형 Enum: SLA_WARNING, SLA_VIOLATION, INSPECTION_DUE, TICKET_ASSIGNED 등

  **Must NOT do**:
  - SMS/카카오톡 연동
  - 푸시 알림

  **Parallelizable**: YES (with 3.1, 3.5)

  **References**:
  - `backend/users/models.py` - User 모델 참조
  - `backend/common/email.py` - 이메일 유틸리티

  **Acceptance Criteria**:
  - [ ] Django Admin에서 Notification 조회 가능
  - [ ] 사용자별 알림 설정 가능

  **Commit**: YES
  - Message: `feat(notifications): add notification models`
  - Files: `backend/notifications/models.py`, `backend/notifications/admin.py`

---

- [x] 3.4 알림 발송 서비스 및 UI

  **What to do**:
  - 알림 발송 서비스 (이메일 + 인앱)
  - 인앱 알림 조회 API
  - 알림 읽음 처리 API
  - 헤더에 알림 벨 아이콘 + 드롭다운
  - 알림 목록 페이지

  **Must NOT do**:
  - 실시간 WebSocket 알림
  - 외부 알림 서비스 연동

  **Parallelizable**: NO (depends on 3.3)

  **References**:
  - `backend/notifications/models.py` - Notification 모델
  - `frontend/src/components/admin-header.tsx` - 헤더 컴포넌트

  **Acceptance Criteria**:
  - [ ] 헤더에 알림 벨 아이콘 표시
  - [ ] 읽지 않은 알림 개수 표시
  - [ ] 알림 클릭 시 읽음 처리

  **Commit**: YES
  - Message: `feat(notifications): add notification service and UI`
  - Files: `backend/notifications/views.py`, `backend/notifications/services.py`, `frontend/src/components/notifications/`

---

- [x] 3.5 인력/일정 관리 모델 정의

  **What to do**:
  - `backend/workforce/` 앱 생성
  - EngineerProfile 모델: User 확장, 기술 스택, 담당 장비 유형
  - Schedule 모델: 엔지니어 근무 일정 (근무/휴가/교육)
  - Assignment 모델: 엔지니어-작업 배정 기록

  **Must NOT do**:
  - 자동 배정 최적화
  - 복잡한 시프트 관리

  **Parallelizable**: YES (with 3.1, 3.3)

  **References**:
  - `backend/users/models.py` - User 모델
  - `backend/tasks/models.py` - Task 모델

  **Acceptance Criteria**:
  - [ ] Django Admin에서 엔지니어 프로필 관리 가능
  - [ ] 일정 등록 가능

  **Commit**: YES
  - Message: `feat(workforce): add workforce management models`
  - Files: `backend/workforce/models.py`, `backend/workforce/admin.py`

---

- [x] 3.6 인력/일정 API 및 프론트엔드

  **What to do**:
  - 엔지니어 목록/상세 API
  - 일정 관리 API
  - 작업 배정 API
  - 엔지니어 관리 페이지
  - 간단한 캘린더 뷰 (일정 표시)

  **Must NOT do**:
  - 복잡한 캘린더 라이브러리
  - 드래그앤드롭 일정 관리

  **Parallelizable**: NO (depends on 3.5)

  **References**:
  - `backend/workforce/models.py` - 인력 모델
  - `frontend/src/app/(admin)/users/` - 유사한 사용자 관리 UI

  **Acceptance Criteria**:
  - [ ] `/workforce` 페이지에서 엔지니어 목록 표시
  - [ ] 일정 캘린더 표시
  - [ ] 작업 배정 UI 동작 확인

  **Commit**: YES
  - Message: `feat(workforce): add workforce API and frontend`
  - Files: `backend/workforce/views.py`, `backend/workforce/serializers.py`, `frontend/src/app/(admin)/workforce/`

---

### Phase 4: 혁신 기능 (Category D)

> **Goal**: AI 예측, PWA, QR 자산 관리

---

- [x] 4.1 AI 예측 데이터 수집 및 모델

  **What to do**:
  - `backend/predictions/` 앱 생성
  - PredictionModel 모델: 예측 모델 메타데이터
  - EquipmentMetric 모델: 장비별 히스토리 데이터 (장애 횟수, MTBF, 사용 기간)
  - 규칙 기반 예측 로직 (통계 기반)

  **Must NOT do**:
  - 복잡한 ML 파이프라인
  - 외부 AI 서비스 연동
  - 실시간 스트리밍 분석

  **Parallelizable**: YES (with 4.3, 4.5)

  **References**:
  - `backend/equipments/models.py` - Equipment 모델
  - `backend/events/models.py` - 장애 이력

  **Acceptance Criteria**:
  - [ ] 장비별 장애 통계 집계 가능
  - [ ] 규칙 기반 위험도 점수 계산 가능

  **Commit**: YES
  - Message: `feat(predictions): add prediction data collection models`
  - Files: `backend/predictions/models.py`, `backend/predictions/services.py`

---

- [x] 4.2 AI 예측 API 및 대시보드 위젯

  **What to do**:
  - 위험도 높은 장비 목록 API
  - 예측 결과 상세 API
  - 대시보드에 "주의 필요 장비" 위젯 추가
  - 장비 상세에 예측 정보 섹션 추가

  **Must NOT do**:
  - 복잡한 시각화
  - 예측 모델 학습 UI

  **Parallelizable**: NO (depends on 4.1)

  **References**:
  - `backend/predictions/models.py` - 예측 모델
  - `frontend/src/app/(admin)/dashboard/page.tsx` - 대시보드
  - `frontend/src/app/(admin)/equipments/[equipmentId]/page.tsx` - 장비 상세

  **Acceptance Criteria**:
  - [ ] 대시보드에 위험 장비 목록 표시
  - [ ] 장비 상세에 예측 정보 표시

  **Commit**: YES
  - Message: `feat(predictions): add prediction API and dashboard widget`
  - Files: `backend/predictions/views.py`, `frontend/src/components/dashboard/`

---

- [x] 4.3 PWA 기본 설정

  **What to do**:
  - Next.js PWA 설정 (next-pwa)
  - manifest.json 생성
  - Service Worker 기본 설정
  - 앱 아이콘 생성

  **Must NOT do**:
  - 오프라인 캐싱
  - 백그라운드 동기화
  - 푸시 알림

  **Parallelizable**: YES (with 4.1, 4.5)

  **References**:
  - `frontend/package.json` - 프론트엔드 설정
  - `frontend/public/` - 정적 파일
  - Official docs: https://www.npmjs.com/package/next-pwa

  **Acceptance Criteria**:
  - [ ] 모바일 브라우저에서 "홈 화면에 추가" 가능
  - [ ] PWA로 설치 후 앱처럼 실행 가능

  **Commit**: YES
  - Message: `feat(pwa): add PWA basic setup`
  - Files: `frontend/next.config.js`, `frontend/public/manifest.json`

---

- [x] 4.4 PWA 모바일 최적화 UI

  **What to do**:
  - 모바일 반응형 레이아웃 점검 및 개선
  - 모바일 네비게이션 (하단 탭 바)
  - 터치 친화적 UI 개선
  - 핵심 기능 모바일 뷰 (티켓, 점검, 장비)

  **Must NOT do**:
  - 오프라인 지원
  - 모바일 전용 기능

  **Parallelizable**: NO (depends on 4.3)

  **References**:
  - `frontend/src/app/(admin)/layout.tsx` - 레이아웃
  - `frontend/src/components/` - 공통 컴포넌트

  **Acceptance Criteria**:
  - [ ] 모바일에서 모든 핵심 페이지 사용 가능
  - [ ] 하단 네비게이션 동작 확인

  **Commit**: YES
  - Message: `feat(pwa): add mobile-optimized UI`
  - Files: `frontend/src/components/mobile/`, `frontend/src/app/(admin)/layout.tsx`

---

- [x] 4.5 QR/바코드 스캔 모델

  **What to do**:
  - Equipment 모델에 QR 코드 필드 추가
  - QR 코드 생성 유틸리티
  - QR 코드 이미지 저장 (static files)

  **Must NOT do**:
  - 바코드 인쇄 시스템
  - 외부 라벨 프린터 연동

  **Parallelizable**: YES (with 4.1, 4.3)

  **References**:
  - `backend/equipments/models.py` - Equipment 모델
  - Python qrcode library: https://pypi.org/project/qrcode/

  **Acceptance Criteria**:
  - [ ] Equipment 생성 시 QR 코드 자동 생성
  - [ ] QR 코드 이미지 다운로드 가능

  **Commit**: YES
  - Message: `feat(qr): add QR code generation for equipment`
  - Files: `backend/equipments/models.py`, `backend/equipments/services.py`

---

- [x] 4.6 QR 스캔 UI (모바일)

  **What to do**:
  - 모바일 QR 스캐너 컴포넌트 (html5-qrcode)
  - 스캔 후 장비 상세 페이지로 이동
  - 퀵 액션: 점검 기록, 티켓 생성

  **Must NOT do**:
  - 바코드 스캔
  - 복잡한 스캔 히스토리

  **Parallelizable**: NO (depends on 4.5)

  **References**:
  - `frontend/src/app/(admin)/equipments/` - 장비 페이지
  - html5-qrcode: https://www.npmjs.com/package/html5-qrcode

  **Acceptance Criteria**:
  - [ ] 모바일에서 QR 스캔 가능
  - [ ] 스캔 후 해당 장비 상세 페이지 이동

  **Commit**: YES
  - Message: `feat(qr): add QR scanner UI for mobile`
  - Files: `frontend/src/components/qr-scanner/`, `frontend/src/app/(admin)/scan/page.tsx`

---

## Commit Strategy

| Phase | After Task | Message | Files |
|-------|------------|---------|-------|
| 0 | 0.1 | `feat(infra): add Celery and Redis integration` | backend/cstom/* |
| 0 | 0.2 | `feat(infra): add email sending infrastructure` | backend/common/email.py |
| 1 | 1.2 | `feat(inspections): add periodic inspection task generation` | backend/inspections/* |
| 1 | 1.4 | `feat(sop): add SOP document API and frontend` | backend/sop/*, frontend/src/app/(admin)/sop/* |
| 1 | 1.8 | `feat(sla): add SLA API and frontend` | backend/sla/*, frontend/src/app/(admin)/sla/* |
| 2 | 2.6 | `feat(tickets): add ticketing API and frontend` | backend/tickets/*, frontend/src/app/(admin)/tickets/* |
| 3 | 3.4 | `feat(notifications): add notification service and UI` | backend/notifications/* |
| 4 | 4.6 | `feat(qr): add QR scanner UI for mobile` | frontend/src/components/qr-scanner/* |

---

## Success Criteria

### Verification Commands

```bash
# Backend 서버 실행 확인
python manage.py runserver  # Expected: 0.0.0.0:8000 listening

# Frontend 서버 실행 확인
npm run dev  # Expected: localhost:3000 ready

# Celery 워커 확인
celery -A cstom worker -l info  # Expected: Worker ready

# API 엔드포인트 확인
curl http://localhost:8000/api/v1/inspections/  # Expected: 200 OK
curl http://localhost:8000/api/v1/sop/  # Expected: 200 OK
curl http://localhost:8000/api/v1/sla/  # Expected: 200 OK
curl http://localhost:8000/api/v1/tickets/  # Expected: 200 OK
curl http://localhost:8000/api/v1/kb/  # Expected: 200 OK
curl http://localhost:8000/api/v1/notifications/  # Expected: 200 OK
curl http://localhost:8000/api/v1/dashboard/summary/  # Expected: 200 OK
```

### Final Checklist

**Phase 0 완료 조건**:
- [x] Celery 워커 정상 실행
- [x] 이메일 발송 테스트 성공

**Phase 1 완료 조건**:
- [x] 예방점검 스케줄 생성 및 작업 자동 생성
- [x] SOP 문서 CRUD 및 버전 관리
- [x] SLA 정의 및 위반 알림 발송

**Phase 2 완료 조건**:
- [x] CMDB 확장 필드 및 관계 설정
- [x] 지식베이스 검색 기능
- [x] 티켓팅 워크플로우 (고객 생성 포함)

**Phase 3 완료 조건**:
- [x] 대시보드 4개 KPI 표시
- [x] 알림 벨 및 이메일 발송
- [x] 엔지니어 일정 관리

**Phase 4 완료 조건**:
- [x] 예측 위험 장비 목록 표시
- [x] PWA 설치 가능
- [x] QR 스캔으로 장비 조회

---

## Notes

- 전체 기능을 하나의 플랜에 포함 (Phase 0~4)
- 각 Phase는 순차 진행: 0 -> 1 -> 2 -> 3 -> 4
- Phase 내 병렬 가능한 태스크는 Parallelizable 표시됨
- 외부 시스템 연동은 향후 별도 Phase로 이관
- 수동 검증 방식 사용 (자동화 테스트 없음)
