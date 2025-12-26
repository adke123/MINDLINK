# 🔧 Supabase 프로젝트 세팅 가이드

## 📋 목차
1. [Supabase 프로젝트 생성](#1-supabase-프로젝트-생성)
2. [데이터베이스 테이블 생성](#2-데이터베이스-테이블-생성)
3. [Row Level Security 설정](#3-row-level-security-설정)
4. [Auth 설정](#4-auth-설정)
5. [API 키 확인](#5-api-키-확인)
6. [Edge Functions 설정](#6-edge-functions-설정)

---

## 1. Supabase 프로젝트 생성

### 1.1 계정 생성 및 프로젝트 만들기

1. [https://supabase.com](https://supabase.com) 접속
2. **Start your project** 클릭
3. GitHub 계정으로 로그인
4. **New Project** 클릭
5. 프로젝트 정보 입력:
   - **Name**: `mindlink` (또는 원하는 이름)
   - **Database Password**: 강력한 비밀번호 설정 (메모해두기!) (mindlink1331!!)
   - **Region**: `Northeast Asia (Seoul)` 선택 (한국 사용자 대상)
6. **Create new project** 클릭
7. 약 2분 정도 기다리면 프로젝트 생성 완료

---

## 2. 데이터베이스 테이블 생성

### 2.1 SQL Editor 열기

1. 좌측 메뉴에서 **SQL Editor** 클릭
2. **New query** 클릭
3. 아래 SQL을 순서대로 실행

### 2.2 테이블 생성 SQL

```sql
-- =============================================
-- 마음이음 (MindLink) 데이터베이스 스키마
-- 실행 순서: 이 파일 전체를 한 번에 실행하세요
-- =============================================

-- 1. ENUM 타입 생성
CREATE TYPE user_role AS ENUM ('senior', 'guardian');
CREATE TYPE emotion_type AS ENUM ('happy', 'sad', 'angry', 'neutral', 'fear', 'surprise', 'disgust');
CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'rejected');
CREATE TYPE notification_type AS ENUM ('medication', 'greeting', 'call_request', 'alert', 'system');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE game_type AS ENUM ('card_match', 'chosung_quiz', 'number_memory', 'calculation');

-- 2. Users 테이블 (Supabase Auth와 연동)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role user_role NOT NULL,
    profile_image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Connections 테이블 (시니어-보호자 연결)
CREATE TABLE public.connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    senior_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    guardian_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    invite_code TEXT UNIQUE NOT NULL,
    status connection_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ
);

-- 4. Emotion Logs 테이블 (감정 기록)
CREATE TABLE public.emotion_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    emotion emotion_type NOT NULL,
    confidence DECIMAL(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    detected_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Game Scores 테이블 (게임 점수)
CREATE TABLE public.game_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    game_type game_type NOT NULL,
    score INTEGER NOT NULL CHECK (score >= 0),
    max_score INTEGER NOT NULL CHECK (max_score > 0),
    duration_seconds INTEGER, -- 게임 소요 시간
    played_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Memories 테이블 (AI 장기 기억)
CREATE TABLE public.memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- 'family', 'hobby', 'food', 'health', 'daily' 등
    content TEXT NOT NULL,
    importance INTEGER DEFAULT 1 CHECK (importance >= 1 AND importance <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_referenced_at TIMESTAMPTZ
);

-- 7. Notifications 테이블 (알림)
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    to_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- 8. Daily Reports 테이블 (일일 리포트)
CREATE TABLE public.daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    dominant_emotion emotion_type,
    emotion_score DECIMAL(3,2) CHECK (emotion_score >= 0 AND emotion_score <= 1), -- 0: 매우 부정, 1: 매우 긍정
    total_interactions INTEGER DEFAULT 0,
    game_count INTEGER DEFAULT 0,
    avg_game_score DECIMAL(5,2),
    risk_level risk_level DEFAULT 'low',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, report_date)
);

-- 9. Conversations 테이블 (대화 기록 - 선택적)
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    emotion emotion_type,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 인덱스 생성 (성능 최적화)
-- =============================================

CREATE INDEX idx_emotion_logs_user_date ON public.emotion_logs(user_id, detected_at DESC);
CREATE INDEX idx_game_scores_user_date ON public.game_scores(user_id, played_at DESC);
CREATE INDEX idx_notifications_to_user ON public.notifications(to_user_id, is_read, created_at DESC);
CREATE INDEX idx_daily_reports_user_date ON public.daily_reports(user_id, report_date DESC);
CREATE INDEX idx_connections_senior ON public.connections(senior_id);
CREATE INDEX idx_connections_guardian ON public.connections(guardian_id);
CREATE INDEX idx_connections_invite_code ON public.connections(invite_code);
CREATE INDEX idx_conversations_user_date ON public.conversations(user_id, created_at DESC);

-- =============================================
-- 트리거: updated_at 자동 갱신
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- =============================================
-- 헬퍼 함수들
-- =============================================

-- 6자리 초대 코드 생성 함수
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- 혼동 문자 제외 (0,O,1,I)
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 시니어의 초대 코드 생성/조회 함수
CREATE OR REPLACE FUNCTION get_or_create_invite_code(senior_user_id UUID)
RETURNS TEXT AS $$
DECLARE
    existing_code TEXT;
    new_code TEXT;
BEGIN
    -- 기존 pending 상태의 초대 코드 확인
    SELECT invite_code INTO existing_code
    FROM public.connections
    WHERE senior_id = senior_user_id AND status = 'pending' AND guardian_id IS NULL
    LIMIT 1;
    
    IF existing_code IS NOT NULL THEN
        RETURN existing_code;
    END IF;
    
    -- 새 코드 생성 (중복 체크)
    LOOP
        new_code := generate_invite_code();
        BEGIN
            INSERT INTO public.connections (senior_id, invite_code)
            VALUES (senior_user_id, new_code);
            RETURN new_code;
        EXCEPTION WHEN unique_violation THEN
            -- 중복이면 다시 시도
            CONTINUE;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 감정 점수 계산 함수 (긍정: 1, 부정: 0)
CREATE OR REPLACE FUNCTION calculate_emotion_score(e emotion_type)
RETURNS DECIMAL AS $$
BEGIN
    RETURN CASE e
        WHEN 'happy' THEN 1.0
        WHEN 'surprise' THEN 0.7
        WHEN 'neutral' THEN 0.5
        WHEN 'fear' THEN 0.3
        WHEN 'sad' THEN 0.2
        WHEN 'angry' THEN 0.1
        WHEN 'disgust' THEN 0.1
        ELSE 0.5
    END;
END;
$$ LANGUAGE plpgsql;
```

### 2.3 SQL 실행하기

1. 위 SQL 전체를 복사
2. SQL Editor에 붙여넣기
3. **Run** 버튼 클릭 (또는 Ctrl+Enter)
4. "Success. No rows returned" 메시지 확인

---

## 3. Row Level Security 설정

### 3.1 RLS 활성화 및 정책 생성

```sql
-- =============================================
-- Row Level Security (RLS) 정책
-- =============================================

-- 모든 테이블에 RLS 활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emotion_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Users 테이블 정책
-- =============================================

-- 본인 정보 조회
CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
USING (auth.uid() = id);

-- 본인 정보 수정
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
USING (auth.uid() = id);

-- 연결된 사용자 정보 조회 (보호자가 시니어 정보 조회)
CREATE POLICY "Guardians can view connected seniors"
ON public.users FOR SELECT
USING (
    id IN (
        SELECT senior_id FROM public.connections
        WHERE guardian_id = auth.uid() AND status = 'accepted'
    )
);

-- 새 사용자 생성 (회원가입 시)
CREATE POLICY "Users can insert own profile"
ON public.users FOR INSERT
WITH CHECK (auth.uid() = id);

-- =============================================
-- Connections 테이블 정책
-- =============================================

-- 본인이 관련된 연결 조회
CREATE POLICY "Users can view own connections"
ON public.connections FOR SELECT
USING (senior_id = auth.uid() OR guardian_id = auth.uid());

-- 시니어가 초대 코드 생성
CREATE POLICY "Seniors can create invite codes"
ON public.connections FOR INSERT
WITH CHECK (
    senior_id = auth.uid() AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'senior')
);

-- 보호자가 연결 요청 (초대 코드로)
CREATE POLICY "Guardians can accept invites"
ON public.connections FOR UPDATE
USING (
    status = 'pending' AND
    guardian_id IS NULL AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'guardian')
);

-- =============================================
-- Emotion Logs 테이블 정책
-- =============================================

-- 본인 감정 기록 조회
CREATE POLICY "Users can view own emotions"
ON public.emotion_logs FOR SELECT
USING (user_id = auth.uid());

-- 보호자가 연결된 시니어 감정 조회
CREATE POLICY "Guardians can view connected senior emotions"
ON public.emotion_logs FOR SELECT
USING (
    user_id IN (
        SELECT senior_id FROM public.connections
        WHERE guardian_id = auth.uid() AND status = 'accepted'
    )
);

-- 본인 감정 기록 생성
CREATE POLICY "Users can insert own emotions"
ON public.emotion_logs FOR INSERT
WITH CHECK (user_id = auth.uid());

-- =============================================
-- Game Scores 테이블 정책
-- =============================================

-- 본인 게임 점수 조회
CREATE POLICY "Users can view own game scores"
ON public.game_scores FOR SELECT
USING (user_id = auth.uid());

-- 보호자가 연결된 시니어 게임 점수 조회
CREATE POLICY "Guardians can view connected senior game scores"
ON public.game_scores FOR SELECT
USING (
    user_id IN (
        SELECT senior_id FROM public.connections
        WHERE guardian_id = auth.uid() AND status = 'accepted'
    )
);

-- 본인 게임 점수 생성
CREATE POLICY "Users can insert own game scores"
ON public.game_scores FOR INSERT
WITH CHECK (user_id = auth.uid());

-- =============================================
-- Memories 테이블 정책
-- =============================================

-- 본인 기억 조회/생성/수정/삭제
CREATE POLICY "Users can manage own memories"
ON public.memories FOR ALL
USING (user_id = auth.uid());

-- =============================================
-- Notifications 테이블 정책
-- =============================================

-- 본인에게 온 알림 조회
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (to_user_id = auth.uid());

-- 본인에게 온 알림 읽음 처리
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (to_user_id = auth.uid());

-- 연결된 사용자에게 알림 전송
CREATE POLICY "Users can send notifications to connected users"
ON public.notifications FOR INSERT
WITH CHECK (
    -- 시니어 → 보호자 또는 보호자 → 시니어 (연결된 경우만)
    EXISTS (
        SELECT 1 FROM public.connections
        WHERE status = 'accepted' AND (
            (senior_id = auth.uid() AND guardian_id = to_user_id) OR
            (guardian_id = auth.uid() AND senior_id = to_user_id)
        )
    )
    OR from_user_id IS NULL -- 시스템 알림
);

-- =============================================
-- Daily Reports 테이블 정책
-- =============================================

-- 본인 리포트 조회
CREATE POLICY "Users can view own reports"
ON public.daily_reports FOR SELECT
USING (user_id = auth.uid());

-- 보호자가 연결된 시니어 리포트 조회
CREATE POLICY "Guardians can view connected senior reports"
ON public.daily_reports FOR SELECT
USING (
    user_id IN (
        SELECT senior_id FROM public.connections
        WHERE guardian_id = auth.uid() AND status = 'accepted'
    )
);

-- 시스템이 리포트 생성 (서비스 역할 키 필요)
CREATE POLICY "System can manage reports"
ON public.daily_reports FOR ALL
USING (true)
WITH CHECK (true);

-- =============================================
-- Conversations 테이블 정책
-- =============================================

-- 본인 대화 기록 조회/생성
CREATE POLICY "Users can manage own conversations"
ON public.conversations FOR ALL
USING (user_id = auth.uid());
```

---

## 4. Auth 설정

### 4.1 이메일 인증 설정

1. 좌측 메뉴 **Authentication** 클릭
2. **Providers** 탭 클릭
3. **Email** 활성화 확인
4. 설정:
   - ✅ Enable Email Signup
   - ❌ Confirm email (개발 중에는 끄기, 배포 시 켜기)
   - ❌ Secure email change

### 4.2 회원가입 시 사용자 프로필 자동 생성

```sql
-- Auth 트리거: 회원가입 시 users 테이블에 자동 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'senior')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

---

## 5. API 키 확인

### 5.1 프로젝트 설정에서 키 확인

1. 좌측 메뉴 **Project Settings** (톱니바퀴 아이콘)
2. **API** 탭 클릭
3. 다음 값들을 메모:

```
Project URL: https://xxxxxxxx.supabase.co
anon (public) key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (비밀! 절대 노출 금지)
```

### 5.2 환경 변수 파일 예시 (.env.local)

```env
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 6. Realtime 설정

### 6.1 Realtime 활성화

1. 좌측 메뉴 **Database** 클릭
2. **Replication** 탭 클릭
3. 다음 테이블들 활성화:
   - ✅ notifications
   - ✅ emotion_logs
   - ✅ connections

또는 SQL로:

```sql
-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.emotion_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;
```

---

## 7. 테스트 데이터 삽입 (선택사항)

개발 테스트용 더미 데이터:

```sql
-- 테스트용 사용자는 Auth를 통해 생성해야 합니다.
-- 아래는 이미 Auth로 가입한 사용자가 있다고 가정한 예시입니다.

-- 감정 로그 테스트 데이터 (user_id는 실제 값으로 교체)
-- INSERT INTO public.emotion_logs (user_id, emotion, confidence)
-- VALUES 
--     ('your-user-uuid', 'happy', 0.85),
--     ('your-user-uuid', 'neutral', 0.72),
--     ('your-user-uuid', 'sad', 0.65);
```

---

## ✅ 세팅 완료 체크리스트

- [ ] Supabase 프로젝트 생성
- [ ] 테이블 생성 SQL 실행
- [ ] RLS 정책 SQL 실행
- [ ] Auth 트리거 SQL 실행
- [ ] Realtime 활성화
- [ ] API 키 메모
- [ ] 이메일 인증 설정

---

## 🔗 다음 단계

1. **React 프로젝트 생성** 및 Supabase 연동
2. **시니어 앱** 개발 시작
3. **Flask AI 서버** 구축

---

## 📚 참고 링크

- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security 가이드](https://supabase.com/docs/guides/auth/row-level-security)
