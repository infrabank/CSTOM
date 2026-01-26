# CSTOM 배포 가이드

## 📋 배포 개요

- **Frontend**: Vercel (Next.js 15 + PWA)
- **Backend**: Render (Django 5.0 + PostgreSQL)
- **Branch**: `001-cstom-mvp`
- **Status**: ✅ 46/46 tasks complete

---

## 🚀 1단계: Backend 배포 (Render)

### 1.1 Render 계정 생성 및 로그인
- https://render.com 접속
- GitHub 계정으로 로그인

### 1.2 PostgreSQL 데이터베이스 생성
1. Dashboard → "New +" → "PostgreSQL"
2. 설정:
   - **Name**: `cstom-db`
   - **Database**: `cstom`
   - **User**: `cstom_user`
   - **Region**: Singapore (가장 가까운 지역)
   - **Plan**: Free
3. "Create Database" 클릭
4. **Internal Database URL** 복사 (나중에 사용)

### 1.3 Web Service 생성
1. Dashboard → "New +" → "Web Service"
2. "Connect a repository" → `infrabank/CSTOM` 선택
3. 설정:
   - **Name**: `cstom-backend`
   - **Region**: Singapore
   - **Branch**: `001-cstom-mvp`
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**:
     ```bash
     pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate
     ```
   - **Start Command**:
     ```bash
     gunicorn cstom.wsgi:application
     ```
   - **Plan**: Free

### 1.4 환경 변수 설정
"Environment" 탭에서 다음 변수 추가:

```bash
# Django 설정
SECRET_KEY=<랜덤-키-생성-필요>
DEBUG=False
ALLOWED_HOSTS=cstom-backend.onrender.com,cstom-frontend.vercel.app
CORS_ALLOWED_ORIGINS=https://cstom-frontend.vercel.app

# 데이터베이스 (1.2에서 복사한 URL)
DATABASE_URL=<postgresql-internal-url>

# Celery (선택사항 - Redis 없이는 비활성화)
# CELERY_BROKER_URL=
# REDIS_URL=

# 이메일 (선택사항)
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USE_TLS=True
# EMAIL_HOST_USER=your-email@gmail.com
# EMAIL_HOST_PASSWORD=your-app-password
# DEFAULT_FROM_EMAIL=noreply@cstom.example.com
```

**SECRET_KEY 생성 방법:**
```python
# Python에서 실행
import secrets
print(secrets.token_urlsafe(50))
```

### 1.5 배포 및 확인
1. "Create Web Service" 클릭
2. 배포 로그 확인 (5-10분 소요)
3. 배포 완료 후 URL 확인: `https://cstom-backend.onrender.com`
4. 헬스체크: `https://cstom-backend.onrender.com/api/v1/health/` 접속
   - 예상 응답: `{"status": "ok"}`

### 1.6 슈퍼유저 생성
1. Render Dashboard → `cstom-backend` → "Shell" 탭
2. 다음 명령 실행:
   ```bash
   python manage.py createsuperuser
   ```
3. 사용자명, 이메일, 비밀번호 입력

---

## 🎨 2단계: Frontend 배포 (Vercel)

### 2.1 Vercel 계정 생성 및 로그인
- https://vercel.com 접속
- GitHub 계정으로 로그인

### 2.2 프로젝트 생성
1. Dashboard → "Add New..." → "Project"
2. "Import Git Repository" → `infrabank/CSTOM` 선택
3. 설정:
   - **Project Name**: `cstom-frontend`
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build` (기본값)
   - **Output Directory**: `.next` (기본값)

### 2.3 환경 변수 설정
"Environment Variables" 섹션에서 추가:

```bash
NEXT_PUBLIC_API_URL=https://cstom-backend.onrender.com
```

### 2.4 배포 및 확인
1. "Deploy" 클릭
2. 배포 로그 확인 (3-5분 소요)
3. 배포 완료 후 URL 확인: `https://cstom-frontend.vercel.app`
4. 브라우저에서 접속하여 로그인 페이지 확인

### 2.5 Backend CORS 업데이트
1. Render Dashboard → `cstom-backend` → "Environment"
2. `ALLOWED_HOSTS`와 `CORS_ALLOWED_ORIGINS`에 실제 Vercel URL 추가:
   ```bash
   ALLOWED_HOSTS=cstom-backend.onrender.com,<실제-vercel-url>
   CORS_ALLOWED_ORIGINS=https://<실제-vercel-url>
   ```
3. "Save Changes" → 자동 재배포

---

## ✅ 3단계: 배포 확인

### 3.1 Backend 확인
```bash
# 헬스체크
curl https://cstom-backend.onrender.com/api/v1/health/

# 로그인 테스트
curl -X POST https://cstom-backend.onrender.com/api/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}'
```

### 3.2 Frontend 확인
1. 브라우저에서 `https://<vercel-url>` 접속
2. 로그인 페이지 확인
3. 슈퍼유저로 로그인
4. 대시보드 접속 확인
5. 각 메뉴 동작 확인:
   - 계약 관리
   - 작업 관리
   - 장비 관리
   - SOP 문서
   - 지식베이스
   - 티켓팅

### 3.3 PWA 확인 (모바일)
1. 모바일 브라우저에서 접속
2. "홈 화면에 추가" 프롬프트 확인
3. 설치 후 앱처럼 실행 확인

---

## 🔧 4단계: 선택사항 - Celery 활성화 (유료)

### 4.1 Redis 인스턴스 생성
1. Render Dashboard → "New +" → "Redis"
2. 설정:
   - **Name**: `cstom-redis`
   - **Region**: Singapore
   - **Plan**: Starter ($7/월)
3. "Create Redis" 클릭
4. **Internal Redis URL** 복사

### 4.2 Backend 환경 변수 업데이트
```bash
CELERY_BROKER_URL=<redis-internal-url>
REDIS_URL=<redis-internal-url>
```

### 4.3 Celery Worker 생성
1. Dashboard → "New +" → "Background Worker"
2. 설정:
   - **Name**: `cstom-celery-worker`
   - **Repository**: `infrabank/CSTOM`
   - **Branch**: `001-cstom-mvp`
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `celery -A cstom worker -l info`
3. 환경 변수: Backend와 동일하게 설정

### 4.4 Celery Beat 생성
1. Dashboard → "New +" → "Background Worker"
2. 설정:
   - **Name**: `cstom-celery-beat`
   - **Repository**: `infrabank/CSTOM`
   - **Branch**: `001-cstom-mvp`
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `celery -A cstom beat -l info`
3. 환경 변수: Backend와 동일하게 설정

### 4.5 Celery 기능 확인
- ✅ 예방점검 자동 생성 (매일 00:00)
- ✅ 점검 리마인더 발송 (매일 09:00)
- ✅ SLA 위반 감지 (매시간)

---

## 📊 배포 상태

### 작동하는 기능 (Celery 없이)
- ✅ 사용자 인증 (JWT)
- ✅ 계약 관리
- ✅ 작업 관리
- ✅ 장비 관리 (CMDB)
- ✅ 의사결정 로그
- ✅ 변경/장애 관리
- ✅ 리포트
- ✅ 감사 로그
- ✅ SOP 문서 관리
- ✅ SLA 정의
- ✅ 지식베이스
- ✅ 티켓팅
- ✅ 알림 (인앱)
- ✅ 대시보드
- ✅ 인력 관리
- ✅ AI 예측
- ✅ QR 코드
- ✅ PWA

### Celery 필요 기능
- ⚠️ 예방점검 자동 생성 (수동 생성 가능)
- ⚠️ 점검 리마인더 이메일
- ⚠️ SLA 위반 자동 감지
- ⚠️ 이메일 알림 (인앱 알림은 작동)

---

## 🐛 트러블슈팅

### Backend 배포 실패
**증상**: Build 실패
**해결**:
1. Render 로그 확인
2. `requirements.txt` 의존성 확인
3. Python 버전 확인 (3.11 이상)

### Frontend 배포 실패
**증상**: Build 실패
**해결**:
1. Vercel 로그 확인
2. `package.json` 의존성 확인
3. Node.js 버전 확인 (18 이상)

### CORS 에러
**증상**: Frontend에서 API 호출 실패
**해결**:
1. Backend 환경 변수 확인:
   - `CORS_ALLOWED_ORIGINS`에 Vercel URL 포함
   - `ALLOWED_HOSTS`에 Vercel URL 포함
2. Render에서 재배포

### 데이터베이스 연결 실패
**증상**: 500 에러
**해결**:
1. `DATABASE_URL` 환경 변수 확인
2. PostgreSQL 인스턴스 상태 확인
3. Migration 실행 확인

### PWA 설치 안됨
**증상**: "홈 화면에 추가" 프롬프트 없음
**해결**:
1. HTTPS 확인 (Vercel은 자동)
2. `manifest.json` 확인
3. Service Worker 등록 확인 (DevTools → Application)

---

## 📞 지원

문제가 발생하면:
1. Render 로그 확인: Dashboard → Service → "Logs"
2. Vercel 로그 확인: Dashboard → Project → "Deployments" → 로그
3. Browser Console 확인 (F12)

---

## 🎉 배포 완료!

축하합니다! CSTOM이 성공적으로 배포되었습니다.

**다음 단계:**
1. 실제 데이터 입력 및 테스트
2. 사용자 피드백 수집
3. 필요시 Celery 활성화 ($7/월)
4. 커스텀 도메인 연결 (선택)
