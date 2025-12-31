"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useResumeStore, ResumeData } from "@/lib/store"
import { parseFileName } from "@/lib/file-parser"
import { v4 as uuidv4 } from 'uuid';
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { UploadCloud, FileText, Loader2, CheckCircle, XCircle } from "lucide-react"

export default function Home() {
  const {
    resumes,
    addResumes,
    getSortedResumes,
    globalStatus,
    setGlobalStatus,
    updateResumeStatus,
    updateResumeRound,
    currentAnalyzingIndex,
    setCurrentAnalyzingIndex,
    resetAll
  } = useResumeStore()
  const router = useRouter()

  // State to calculate total progress 
  // (Total files processed / Total files * 100) or granular?
  // Let's rely on currentAnalyzingIndex for progress bar roughly.

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => {
        const metadata = parseFileName(file.name);
        // Fallback if null, but parseFileName always returns something now.
        return {
          id: uuidv4(),
          file,
          metadata: metadata || { position: 'Unknown', applicantName: 'Unknown', channel: 'Unknown' },
          status: 'idle',
          progress: 0
        } as ResumeData;
      });
      addResumes(newFiles);
      e.target.value = ''; // Reset input
    }
  }

  const startAnalysis = async () => {
    if (resumes.length === 0) return;

    setGlobalStatus('analyzing');

    // Get sorted order to process locally, BUT we should probably process in the sorted order user sees?
    // Plan: "분석 순서는 지원채널, 포지션, 이름의 순서로... 정한다."
    // "분석 순서 기준으로 n번 파일이 끝나면 n+1번 파일을 분석한다."

    // We need to re-sort the 'resumes' array in the store OR just process in the sorted order.
    // However, the store's 'resumes' is the source of truth.
    // It's better if we just iterate over the sorted list.
    const sortedList = getSortedResumes();

    for (let i = 0; i < sortedList.length; i++) {
      const resume = sortedList[i];
      setCurrentAnalyzingIndex(i);

      // Update status to analyzing
      updateResumeStatus(resume.id, 'analyzing');

      try {
        if (!resume.file) {
          throw new Error(`파일 데이터를 찾을 수 없습니다: ${resume.metadata.applicantName}`);
        }
        const formData = new FormData();
        formData.append('file', resume.file);

        const res = await fetch('/api/analyze', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || `API Error: ${res.status}`);
        }

        // Handle Streaming Response for round-by-round progress
        const reader = res.body?.getReader();
        if (!reader) throw new Error("Stream reader not available");

        const decoder = new TextDecoder();
        let partialData = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          partialData += chunk;

          const lines = partialData.split("\n");
          partialData = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const data = JSON.parse(line);
              if (data.type === 'round') {
                updateResumeRound(resume.id, data.round);
              } else if (data.type === 'result') {
                updateResumeStatus(resume.id, 'completed', data.result, data.totalScore);
              } else if (data.type === 'error') {
                throw new Error(data.message || "AI Analysis Failed");
              }
            } catch (e) {
              console.error("Error parsing stream chunk", e);
            }
          }
        }
      } catch (error) {
        console.error(error);
        updateResumeStatus(resume.id, 'error', undefined, undefined, (error as Error).message || "분석 실패");
      }
    }

    setGlobalStatus('completed');
  }

  const handleReset = () => {
    if (confirm("모든 결과를 초기화하고 새로운 파일을 분석하시겠습니까?")) {
      resetAll();
    }
  }

  const getSuitability = (score?: number) => {
    if (score === undefined) return { label: '-', color: 'bg-gray-500 text-sm' };
    if (score >= 90) return { label: '적극 추천', color: 'bg-green-500 text-white text-sm' }; // Neon Green?
    if (score >= 80) return { label: '추천', color: 'bg-blue-500 text-white text-sm' };
    if (score >= 70) return { label: '조건부 추천', color: 'bg-yellow-500 text-black text-sm' };
    return { label: '부적합', color: 'bg-red-500 text-white text-sm' };
  }

  // View Components
  const sortedResumes = getSortedResumes();

  // Progress Calculation: account for current index and current round (1/3, 2/3, 3/3)
  const currentResume = sortedResumes[currentAnalyzingIndex];
  const roundProgress = currentResume?.status === 'analyzing' ? (currentResume.currentRound / 3) : 0;

  const progressPercent = resumes.length > 0
    ? ((currentAnalyzingIndex + Math.max(roundProgress, globalStatus === 'completed' ? 1 : 0)) / resumes.length) * 100
    : 0;

  return (
    <div className="flex flex-col gap-16 pb-20">
      {/* Header */}
      <div className="text-center space-y-4 pt-10">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
          입사 지원자 자동 분석
        </h1>
        <p className="text-xl text-muted-foreground">
          이력서를 업로드하고, AI가 분석한 전문적인 리포트로 지원자를 평가하세요.
        </p>
      </div>

      {/* Upload & Action Area */}
      <Card className="max-w-3xl mx-auto w-full card-glass overflow-hidden">
        <CardContent className="p-10 flex flex-col items-center gap-6 text-center">
          {globalStatus === 'idle' ? (
            <>
              <div className="bg-primary/10 p-6 rounded-full">
                <UploadCloud className="w-12 h-12 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">이력서 파일 업로드</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  PDF 포맷의 이력서 파일을 선택해주세요.<br />
                  (파일명 예시: 포지션_이름_지원채널.pdf)
                </p>
                <div className="flex gap-3 justify-center">
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button size="lg" variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                    파일 선택
                  </Button>
                  <Button
                    size="lg"
                    variant="default"
                    disabled={resumes.length === 0}
                    onClick={startAnalysis}
                  >
                    분석 시작
                  </Button>
                </div>
                {resumes.length > 0 && (
                  <p className="text-sm text-primary mt-2">
                    {resumes.length}개의 파일이 선택되었습니다.
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="w-full space-y-4">
              <div className="flex justify-between items-center px-2">
                <span className="font-semibold text-lg">
                  {globalStatus === 'completed' ? '분석 완료' : 'AI 분석 진행 중...'}
                </span>
                <span className="text-primary font-mono">{Math.min(100, Math.round(progressPercent))}%</span>
              </div>
              <Progress value={progressPercent} className="h-3 w-full" />
              {globalStatus === 'completed' && (
                <div className="flex flex-col items-center gap-4 mt-10">
                  <Button
                    variant="outline"
                    onClick={resetAll}
                    className="text-base px-6 py-5 hover:bg-primary/20 hover:text-primary hover:border-primary/50 transition-all duration-300"
                  >
                    새로 분석하기
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results List */}
      {resumes.length > 0 && (
        <div className="max-w-6xl mx-auto w-full px-4 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <FileText className="text-primary" /> 분석 결과
            </h2>
            <span className="text-base text-muted-foreground font-medium">
              총 {resumes.length}명
            </span>
          </div>

          <div className="rounded-xl border border-white/10 overflow-hidden backdrop-blur-sm bg-black/20">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="hover:bg-white/5 border-white/10">
                  <TableHead className="w-[60px] text-center text-base">연번</TableHead>
                  <TableHead className="text-center text-base">이름</TableHead>
                  <TableHead className="text-center text-base">포지션</TableHead>
                  <TableHead className="text-center text-base">지원채널</TableHead>
                  <TableHead className="text-center text-base">총점</TableHead>
                  <TableHead className="text-center text-base">적합도</TableHead>
                  <TableHead className="text-center w-[120px]">리포트</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedResumes.map((resume, index) => {
                  const suit = getSuitability(resume.totalScore);
                  return (
                    <TableRow key={resume.id} className="hover:bg-white/5 border-white/10 transition-colors">
                      <TableCell className="text-center font-mono text-muted-foreground text-base">{index + 1}</TableCell>
                      <TableCell className="text-center font-bold text-base">{resume.metadata.applicantName}</TableCell>
                      <TableCell className="text-center text-base">{resume.metadata.position}</TableCell>
                      <TableCell className="text-center text-base text-yellow-400/80">{resume.metadata.channel}</TableCell>
                      <TableCell className="text-center text-base">
                        {resume.status === 'completed' ? (
                          <span className="font-bold text-primary">{resume.totalScore}점</span>
                        ) : resume.status === 'analyzing' ? (
                          <Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" />
                        ) : resume.status === 'error' ? (
                          <XCircle className="w-5 h-5 text-destructive mx-auto" />
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {resume.status === 'completed' && (
                          <span className={`px-3 py-1 rounded-full font-bold shadow-sm ${suit.color}`}>
                            {suit.label}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="default"
                          disabled={resume.status !== 'completed'}
                          onClick={() => router.push(`/report/${resume.id}`)}
                          className="text-muted-foreground hover:text-blue-500"
                        >
                          확인 &rarr;
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}
