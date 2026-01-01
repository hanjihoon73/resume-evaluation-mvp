# Claude 모델 연동 및 멀티 AI 지원 계획 (v1.4)

사용자에게 Gemini 외에 Anthropic의 Claude 모델을 선택할 수 있는 옵션을 제공하여 분석의 다양성과 정확성을 높입니다.

## 1. 사전 준비 작업
- **의존성 설치**: `@anthropic-ai/sdk` 패키지 설치
- **환경 변수 설정**: `.env.local` 및 Vercel에 `ANTHROPIC_API_KEY` 추가

## 2. 세부 구현 단계

---

### [STEP 1] Anthropic SDK 연동 및 클라이언트 구현
- **목표**: Claude 모델 호출을 위한 기본 인프라를 구축합니다.
- **수정/신규 파일**:
    - [NEW] `src/lib/anthropic.ts`: Anthropic 클라이언트 초기화 및 모델 호출 함수 구현
- **검증**: 단순 텍스트 생성 테스트를 통해 API 연동 확인

---

### [STEP 2] 분석 엔진 리팩토링 (AI Provider Dispatcher)
- **목표**: 선택된 모델명에 따라 Gemini 혹은 Claude로 분기하여 분석을 실행하도록 엔진을 수정합니다.
- **수정 파일**:
    - [MODIFY] `src/lib/analysis-engine.ts`: `analyzeResumeText` 함수 내부에 모델명 접두사(예: 'claude-', 'gemini-')에 따른 분기 로직 추가
- **검증**: Gemini 모델과 Claude 모델 각각으로 분석 요청 시 정상 분기 여부 확인

---

### [STEP 3] 모델 리스트 API 확장
- **목표**: UI의 드롭다운 목록에 Claude 모델(Claude 3.5 Sonnet, Claude 3 Opus 등)을 추가합니다.
- **수정 파일**:
    - [MODIFY] `src/app/api/models/route.ts`: Anthropic 모델 리스트를 추가하여 반환
- **검증**: `/api/models` 호출 시 Claude 모델들이 목록에 포함되는지 확인

---

### [STEP 4] 에러 핸들링 및 UI 최적화
- **목표**: Claude 전용 에러(할당량 초과 등)를 처리하고 UI에 반영합니다.
- **수정 파일**:
    - [MODIFY] `src/lib/analysis-engine.ts`: Anthropic 에러 코드 매핑 및 한국어 메시지 변환
- **검증**: Claude 모델 사용 중 에러 발생 시 적절한 안내 메시지 노출 확인

## 3. 검증 계획

### 자동화/수동 테스트
- Claude 모델로 분석 시 기존과 동일한 JSON 형식이 반환되는지 확인
- 병렬 분석(3회) 및 Staggering 로직이 Claude 모델에서도 정상 작동하는지 확인
- API Key 미설정 시의 예외 처리 확인

---
> [!NOTE]
> Claude 모델은 Gemini와 프롬프트 준수 능력이 다를 수 있으므로, 초기에는 가장 성능이 좋은 `claude-3-5-sonnet` 모델을 우선적으로 지원할 예정입니다.
