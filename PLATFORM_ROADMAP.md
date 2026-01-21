# 🚀 MatchUp Pro: 플랫폼 고도화 전략 (Platform Evolution Strategy)

## 1. 핵심 컨셉 (Core Concept)
**"누구나 구경하고, 누구나 만들 수 있는 오픈형 테니스 플랫폼"**
- **Existing (As-Is):** 폐쇄형 앱. 로그인해야만 접근 가능. 단일 클럽(무명) 전용.
- **Future (To-Be):** 개방형 플랫폼.
    - **Guest:** 로그인 없이 클럽 둘러보기, 랭킹 구경, 클럽 분위기 탐색.
    - **Member:** 소속 클럽의 경기/회계 관리.
    - **Creator:** 내 클럽 개설 신청 및 브랜딩(로고, 소개).
    - **Super Master:** 플랫폼 전체 관리 및 클럽 승인 권한.

---

## 2. 사용자 경험(UX) 프로세스 (User Flow)

### A. 일반 방문자 (Guest Mode)
1.  **메인 랜딩 페이지:**
    *   "내 주변 가장 핫한 테니스 클럽을 찾아보세요."
    *   명예의 전당 (전체 클럽 통합 랭킹 Top 3 등 흥미 유발).
    *   **[클럽 둘러보기]** 버튼 (로그인 없이 진입).
2.  **클럽 탐색 (Marketplace):**
    *   등록된 클럽 리스트 카드 뷰 (로고, 클럽명, 회원 수, 주고 활동 지역).
    *   클럽 클릭 시 **[클럽 상세 페이지]** 이동.
        *   공개 정보: 클럽 로고, 소개글, 회원 리스트(닉네임만), 공개된 경기 결과.
        *   비공개 정보: 회계, 상세 일정 (블러 처리 또는 "가입 후 확인 가능").

### B. 클럽 예비 개설자 (Creator Mode)
1.  **회원가입/로그인:** 소셜 로그인으로 가입.
2.  **클럽 생성 신청:**
    *   클럽명, **로고 이미지 업로드**, 한줄 소개, 활동 지역 입력.
    *   신청 완료 시: *"슈퍼 마스터의 승인을 기다리고 있습니다. (영업일 기준 1일 소요)"* 메시지 출력.
    *   상태값: `PENDING` (대기 중).

### C. 슈퍼 마스터 (Super Admin) - *User: 수철*
1.  **관리자 대시보드:**
    *   신규 클럽 신청 알림 확인.
    *   신청 내용(로고, 소개) 검토 후 **[승인]** 또는 **[반려]** 버튼 클릭.
2.  **승인 시:**
    *   해당 클럽의 상태가 `ACTIVE`로 변경.
    *   신청자에게 자동으로 `PRESIDENT` 권한 부여 & 해당 클럽의 `admin`으로 설정.

### D. 클럽 멤버 (Member Mode)
1.  **가입 신청:** 원하는 클럽 페이지에서 **[가입 하기]** 클릭 -> 클럽 회장 승인 대기.
2.  **활동:** 승인 후 해당 클럽의 일정, 랭킹, 회비 기능 *전체 접근* 가능.
3.  **멀티태스킹:** 다른 클럽도 구경 가능(Guest 모드와 동일).

---

## 3. 기술적 아키텍처 (Technical Architecture)

### 1단계: 데이터베이스 구조 확장 (Schema Expansion)
기존 구조에 `Clubs` 개념을 최상위 엔티티로 추가합니다.

```sql
-- 1. Clubs 테이블 (신규)
create table public.clubs (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  code text unique, -- 초대코드 (ex: 'UNKNOWN-2024')
  logo_url text, -- 클럽 로고 이미지 주소
  description text, -- 클럽 소개
  region text, -- 활동 지역 (ex: '서울/강남')
  status text default 'PENDING', -- 'PENDING'(승인대기) | 'ACTIVE'(활동중) | 'REJECTED'(거절됨)
  owner_id uuid references public.profiles(id), -- 클럽 개설자
  created_at timestamp with time zone default now()
);

-- 2. Profiles 테이블 수정
alter table public.profiles 
add column current_club_id uuid references public.clubs(id);
-- (추후 확장성을 위해 club_members 테이블로 분리 가능하나 MVP는 컬럼 추가로 시작)
```

### 2단계: 권한 정책 고도화 (RLS Policies)
*   **Public Access:** `clubs` 테이블의 `status = 'ACTIVE'`인 데이터는 **누구나(anon included)** 조회 가능.
*   **Club Level Access:** `matches`, `finances` 데이터는 `current_club_id`가 일치하는 유저만 조회 가능.
*   **Super Admin:** `status`에 관계없이 모든 클럽 조회 및 수정 가능.

### 3단계: 미들웨어 및 라우팅 (Middleware & Routing)
*   현재: 로그인 안 하면 무조건 `/login`으로 튕겨냄.
*   변경: 
    *   `/`, `/clubs`, `/clubs/[id]` -> **공개 접근 허용**.
    *   `/my-club/*` (일정, 회계 등) -> **로그인 필수 & 클럽 가입 필수**.

---

## 4. 디자인 고도화 포인트 (Design Polish)
다른 클럽 사람들도 보게 되므로 "브랜딩"이 중요해집니다.

1.  **클럽 카드 (Club Card):**
    *   인스타그램 프로필처럼 로고가 중앙에 위치하고, 배경에서 은은한 그라데이션이 퍼지는 고급스러운 카드 디자인.
2.  **뱃지 시스템 (Badges):**
    *   "신규 클럽", "인기 클럽(멤버 50+)", "활동 왕성(주 1회 경기)" 등의 뱃지를 자동 부여하여 신뢰도 상승.
3.  **다크 모드 + 네온 (Signature):**
    *   지금의 다크/네온(Lime) 컨셉을 유지하되, 각 클럽이 고유의 **"테마 컬러"**를 설정할 수 있게 하여 다양성 확보 (예: 무명=라임, 다른클럽=오렌지).

---

## 5. 실행 로드맵 (Action Plan)

1.  **DB 마이그레이션:** `clubs` 테이블 생성 및 기존 데이터를 '무명 클럽'으로 귀속.
2.  **공개 페이지 개발:** 로그인 없는 랜딩 페이지 (`/`) 및 클럽 리스트 페이지 제작.
3.  **클럽 생성 신청 기능:** 로고 업로드(Storage) 및 신청 폼 개발.
4.  **슈퍼 어드민 페이지:** 클럽 승인/관리 기능 개발 (수철님 전용).
5.  **배포 및 오픈:** 외부 동호회 모집.

이 계획대로 진행하면 "무명 리스트"는 단순한 앱이 아니라 **"대한민국 아마추어 테니스 리그 플랫폼"**으로 성장할 수 있습니다. 
