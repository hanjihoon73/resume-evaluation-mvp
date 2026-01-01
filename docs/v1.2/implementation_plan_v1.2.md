# AI 모델을 Claude로 변경 (v1.2)

기존의 Google Gemini 모델을 Anthropic의 Claude 모델로 교체하여 분석의 질을 높이고 다변화화하기 위한 작업입니다.

## 사전 준비 사항
1. **Anthropic API Key**: Anthropic Console에서 발급받은 API 키가 필요합니다.
2. **SDK 설치**: `@anthropic-ai/sdk` 라이브러리를 설치해야 합니다.

## 제안된 변경 사항

---

### [의존성 관리]
- `@anthropic-ai/sdk` 패키지 추가

---

### [AI 클라이언트 레이어]

#### [NEW] [claude.ts](file:///d:/SynologyDrive/dev_projects/resume-evaluation-mvp/src/lib/claude.ts)
- Anthropic SDK를 초기화하고 Claude 모델(`claude-3-5-sonnet-latest` 등)을 설정하는 클라이언트 파일입니다.

#### [DELETE] [gemini.ts](file:///d:/SynologyDrive/dev_projects/resume-evaluation-mvp/src/lib/gemini.ts)
- 더 이상 사용하지 않는 Gemini 설정 파일을 삭제합니다.

---

### [분석 엔진 레이어]

#### [MODIFY] [analysis-engine.ts](file:///d:/SynologyDrive/dev_projects/resume-evaluation-mvp/src/lib/analysis-engine.ts)
- Gemini의 `generateContent` API 대신 Claude의 `messages.create` API를 사용하도록 수정합니다.
- System Prompt와 User Message 구조를 Claude 규격에 맞게 조정합니다.

---

### [환경 변수 설정]

#### [MODIFY] [.env.local](file:///d:/SynologyDrive/dev_projects/resume-evaluation-mvp/.env.local)
- `GEMINI_API_KEY`를 제거(또는 유지)하고 `ANTHROPIC_API_KEY`를 추가합니다.

## 검증 계획

### 자동화된 테스트
- `npm run dev` 실행 후 분석 기능 작동 여부 확인
- API 응답 형식이 기존 `AnalysisResult` 인터페이스와 일치하는지 확인

### 수동 확인 사항
- Vercel 환경 변수 세팅 안내 (ANTHROPIC_API_KEY 추가)
- 분석 결과의 품질(정확도 및 뉘앙스) 비교 확인
