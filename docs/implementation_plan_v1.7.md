# 기술 스택 시각화 섹션 추가

이력서 분석 리포트에 지원자의 기술 스택을 **카테고리별로 분류**하고, **숙련도를 뱃지 색상으로 구분**하여 시각적으로 표시하는 섹션을 추가합니다.

## 숙련도 레벨 정의

| 레벨 | 색상 | 기준 |
|------|------|------|
| **상급** | 🟢 초록색 | 3년 이상 실무 경험 또는 핵심 기술로 명시 |
| **중급** | 🔵 파란색 | 1~3년 경험 또는 프로젝트에서 활용 |
| **초급** | ⚪ 회색 | 1년 미만 또는 학습/경험 수준 |

## 카테고리 분류

- **백엔드**: Java, Kotlin, Spring Boot, Node.js, Python 등
- **프론트엔드**: React, TypeScript, Next.js, Vue.js 등
- **데이터베이스**: MySQL, PostgreSQL, MongoDB, Redis 등
- **인프라/DevOps**: AWS, Docker, Kubernetes, CI/CD 등
- **기타**: Git, Jira, Figma 등

---

## Proposed Changes

### AI 분석 모듈

#### [MODIFY] [system-prompt.ts](file:///d:/SynologyDrive/dev_projects/resume-evaluation-mvp/src/lib/system-prompt.ts)

AI 프롬프트에 기술 스택 상세 추출 로직 추가:
- `techStack` 필드에 `skills` 배열 추가
- 각 skill은 `{ name, category, level }` 형태로 반환

```json
"techStack": {
  "score": 85,
  "summary": "...",
  "skills": [
    { "name": "Java", "category": "backend", "level": "advanced" },
    { "name": "Spring Boot", "category": "backend", "level": "advanced" },
    { "name": "React", "category": "frontend", "level": "intermediate" },
    { "name": "AWS EC2", "category": "infra", "level": "intermediate" }
  ]
}
```

---

#### [MODIFY] [analysis-engine.ts](file:///d:/SynologyDrive/dev_projects/resume-evaluation-mvp/src/lib/analysis-engine.ts)

`AnalysisResult` 타입에 skills 배열 타입 추가:

```typescript
export interface Skill {
    name: string;
    category: 'backend' | 'frontend' | 'database' | 'infra' | 'etc';
    level: 'advanced' | 'intermediate' | 'beginner';
}

export interface AnalysisResult {
    // ... 기존 필드
    techStack: { 
        score: number; 
        summary: string; 
        skills?: Skill[];  // 새로 추가
    };
}
```

---

### 리포트 UI

#### [MODIFY] [page.tsx](file:///d:/SynologyDrive/dev_projects/resume-evaluation-mvp/src/app/report/[id]/page.tsx)

기술 스택 섹션 UI 컴포넌트 추가:
- 장점/단점 섹션 바로 아래에 배치
- 카테고리별로 그룹핑하여 표시
- 숙련도에 따른 뱃지 색상 적용:
  - `advanced` → 초록색 배경
  - `intermediate` → 파란색 배경
  - `beginner` → 회색 배경

---

#### [MODIFY] [resume-pdf.tsx](file:///d:/SynologyDrive/dev_projects/resume-evaluation-mvp/src/components/report/resume-pdf.tsx)

PDF 리포트에도 동일한 기술 스택 시각화 추가

---

## Verification Plan

### Manual Verification

1. 개발 서버 실행 (`npm run dev`)
2. 이력서 PDF 업로드 후 분석 완료 대기
3. 리포트 페이지에서 확인 사항:
   - [ ] 기술 스택 섹션이 장점/단점 아래에 표시되는지
   - [ ] 카테고리별로 기술이 그룹핑되어 있는지
   - [ ] 숙련도에 따라 뱃지 색상이 다르게 표시되는지 (초록/파랑/회색)
4. PDF 다운로드 후 확인 사항:
   - [ ] PDF에도 기술 스택 섹션이 포함되는지
