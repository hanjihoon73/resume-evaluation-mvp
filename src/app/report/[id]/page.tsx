"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useResumeStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Download, GraduationCap, Briefcase, Code, Cpu, HeartHandshake, CheckSquare, AlertTriangle, Loader2 } from "lucide-react"
import dynamic from "next/dynamic"
import { ResumePDF } from "@/components/report/resume-pdf"

// Dynamically import PDFDownloadLink to avoid SSR issues
const PDFDownloadLink = dynamic(
    () => import("@react-pdf/renderer").then((mod) => mod.PDFDownloadLink),
    {
        ssr: false,
        loading: () => <Button variant="outline" disabled>준비 중...</Button>,
    }
);

export default function ReportPage() {
    const params = useParams();
    const router = useRouter();
    const { resumes } = useResumeStore();
    const [isClient, setIsClient] = React.useState(false);

    React.useEffect(() => {
        setIsClient(true);
    }, []);

    const resume = React.useMemo(() => {
        return resumes.find(r => r.id === params.id);
    }, [resumes, params.id]);

    // 1. If not hydrated yet, show LOADING state to prevent flashing wrong message
    if (!isClient) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-muted-foreground">데이터를 불러오는 중입니다...</p>
            </div>
        )
    }

    // 2. If hydrated but data is truly missing, show ERROR state
    if (!resume || !resume.result) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                <p className="text-muted-foreground">데이터를 찾을 수 없습니다.</p>
                <Button variant="outline" onClick={() => router.push('/')}>홈으로 돌아가기</Button>
            </div>
        )
    }

    const { metadata, result, totalScore } = resume;

    // Helprs
    const getScoreColor = (score: number) => {
        if (score >= 90) return "text-green-500";
        if (score >= 80) return "text-blue-500";
        if (score >= 60) return "text-yellow-500";
        return "text-red-500";
    }

    const getSuitability = (score?: number) => {
        if (score === undefined) return { label: '-', color: 'bg-gray-500' };
        if (score >= 90) return { label: '적극 추천', color: 'bg-green-500 text-white' };
        if (score >= 80) return { label: '추천', color: 'bg-blue-500 text-white' };
        if (score >= 70) return { label: '조건부 추천', color: 'bg-yellow-500 text-black' };
        return { label: '부적합', color: 'bg-red-500 text-white' };
    }

    const getStarRating = (score: number) => {
        // 1 to 5 stars
        // 90+ 5, 80+ 4, 60+ 3, 30+ 2, else 1
        let stars = 1;
        if (score >= 90) stars = 5;
        else if (score >= 80) stars = 4;
        else if (score >= 60) stars = 3;
        else if (score >= 30) stars = 2;

        return "★".repeat(stars) + "☆".repeat(5 - stars);
    }

    const getSkillBadgeStyle = (level: string) => {
        switch (level) {
            case 'advanced':
                return 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30';
            case 'intermediate':
                return 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30';
            case 'beginner':
            default:
                return 'bg-gray-500/20 text-gray-400 border-gray-500/30 hover:bg-gray-500/30';
        }
    }

    const suit = getSuitability(totalScore);

    return (
        <div className="max-w-5xl mx-auto pb-20 space-y-8 animate-in fade-in duration-500">
            {/* Header Actions */}
            <div className="flex justify-between items-center py-4">
                <Button variant="ghost" onClick={() => router.push('/')} className="gap-2">
                    <ArrowLeft className="w-4 h-4" /> 목록으로 가기
                </Button>
                <PDFDownloadLink
                    document={<ResumePDF data={resume} />}
                    fileName={`리포트_${metadata.position}_${metadata.applicantName}_${metadata.channel}.pdf`}
                >
                    {/* @ts-ignore - render prop signature mismatch in types sometimes */}
                    {({ loading }) => (
                        <Button variant="premium" size="lg" disabled={loading} className="gap-2">
                            <Download className="w-4 h-4" />
                            {loading ? "PDF 생성 중..." : "PDF 다운로드"}
                        </Button>
                    )}
                </PDFDownloadLink>
            </div>

            {/* Title Section */}
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold tracking-tight">지원자 분석 리포트</h1>
            </div>

            {/* Basic Info Section - Horizontal Row */}
            <Card className="card-glass border-white/10 overflow-hidden">
                <div className="flex flex-wrap md:flex-nowrap divide-y md:divide-y-0 md:divide-x divide-white/5">
                    {/* 1. 포지션 */}
                    <div className="flex-1 min-w-[120px] p-4 flex flex-col items-center justify-center gap-1 group hover:bg-white/5 transition-colors">
                        <span className="font-bold text-base text-primary text-center">{metadata.position}</span>
                        <span className="text-[12px] uppercase tracking-widest text-muted-foreground font-bold group-hover:text-primary transition-colors">포지션</span>
                    </div>
                    {/* 2. 이름 */}
                    <div className="flex-1 min-w-[100px] p-4 flex flex-col items-center justify-center gap-1 group hover:bg-white/5 transition-colors">
                        <span className="font-bold text-base text-white">{metadata.applicantName}</span>
                        <span className="text-[12px] uppercase tracking-widest text-muted-foreground font-bold group-hover:text-primary transition-colors">이름</span>
                    </div>
                    {/* 3. 지원채널 */}
                    <div className="flex-1 min-w-[100px] p-4 flex flex-col items-center justify-center gap-1 group hover:bg-white/5 transition-colors">
                        <span className="font-bold text-base text-yellow-400">{metadata.channel}</span>
                        <span className="text-[12px] uppercase tracking-widest text-muted-foreground font-bold group-hover:text-primary transition-colors">지원채널</span>
                    </div>
                    {/* 4. 전공 */}
                    <div className="flex-1 min-w-[120px] p-4 flex flex-col items-center justify-center gap-1 group hover:bg-white/5 transition-colors">
                        <span className="font-semibold text-sm text-center">{result.basicInfo.major || '정보 없음'}</span>
                        <span className="text-[12px] uppercase tracking-widest text-muted-foreground font-bold group-hover:text-primary transition-colors">전공</span>
                    </div>
                    {/* 5. 최종학력 */}
                    <div className="flex-1 min-w-[100px] p-4 flex flex-col items-center justify-center gap-1 group hover:bg-white/5 transition-colors">
                        <span className="font-semibold text-base">{result.basicInfo.finalEducation || '-'}</span>
                        <span className="text-[12px] uppercase tracking-widest text-muted-foreground font-bold group-hover:text-primary transition-colors">최종학력</span>
                    </div>
                    {/* 6. 학점 */}
                    <div className="flex-1 min-w-[80px] p-4 flex flex-col items-center justify-center gap-1 group hover:bg-white/5 transition-colors">
                        <span className="font-semibold text-base">{result.basicInfo.gpa || '-'}</span>
                        <span className="text-[12px] uppercase tracking-widest text-muted-foreground font-bold group-hover:text-primary transition-colors">학점</span>
                    </div>
                    {/* 7. 나이 */}
                    <div className="flex-1 min-w-[80px] p-4 flex flex-col items-center justify-center gap-1 group hover:bg-white/5 transition-colors">
                        <span className="font-semibold text-base">
                            {result.basicInfo.birthYear
                                ? `${new Date().getFullYear() - parseInt(result.basicInfo.birthYear)}세`
                                : '-'}
                        </span>
                        <span className="text-[12px] uppercase tracking-widest text-muted-foreground font-bold group-hover:text-primary transition-colors">나이</span>
                    </div>
                    {/* 8. 경력기간 */}
                    <div className="flex-1 min-w-[120px] p-4 flex flex-col items-center justify-center gap-1 group hover:bg-white/5 transition-colors">
                        <span className="font-semibold text-base whitespace-nowrap">{result.basicInfo.totalCareerParams || '-'}</span>
                        <span className="text-[12px] uppercase tracking-widest text-muted-foreground font-bold group-hover:text-primary transition-colors">경력기간</span>
                    </div>
                </div>
            </Card>

            {/* Overall Score & Review Section */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Score Card */}
                <Card className="card-glass flex flex-col items-center justify-center p-8 bg-primary/5">
                    <div className="text-muted-foreground text-base uppercase tracking-widest font-bold mb-4">종합 점수</div>
                    <div className="flex items-baseline gap-2">
                        <div className="text-7xl font-extrabold tracking-tighter text-primary leading-none">
                            {totalScore}
                        </div>
                        <span className="text-lg text-muted-foreground/60 font-bold">/ 100</span>
                    </div>
                    <Badge className={`mt-6 text-sm px-4 py-1.5 font-bold shadow-lg ${suit.color}`}>
                        {suit.label}
                    </Badge>
                </Card>

                {/* Review Card */}
                <Card className="card-glass md:col-span-3 p-8 flex flex-col justify-center border-white/5">
                    <div className="flex items-center gap-2 mb-4">
                        <CheckSquare className="w-5 h-5 text-primary" />
                        <h3 className="font-bold text-lg">총평</h3>
                    </div>
                    <div className="space-y-3">
                        {Array.isArray(result.overallReview) ? (
                            <ul className="list-disc pl-5 space-y-2 text-base text-muted-foreground leading-relaxed">
                                {result.overallReview.map((point, i) => (
                                    <li key={i}>{point}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-base text-muted-foreground leading-relaxed">
                                {result.overallReview}
                            </p>
                        )}
                    </div>
                </Card>
            </div>

            {/* Pros & Cons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="card-glass bg-green-950/20 border-green-900/50">
                    <CardHeader><CardTitle className="text-green-400">장점 (Pros)</CardTitle></CardHeader>
                    <CardContent>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-green-100/80">
                            {result.pros.map((p, i) => <li key={i}>{p}</li>)}
                        </ul>
                    </CardContent>
                </Card>
                <Card className="card-glass bg-red-950/20 border-red-900/50">
                    <CardHeader><CardTitle className="text-red-400">단점 (Cons)</CardTitle></CardHeader>
                    <CardContent>
                        <ul className="list-disc pl-5 space-y-1 text-sm text-red-100/80">
                            {result.cons.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                    </CardContent>
                </Card>
            </div>

            {/* Tech Stack Visualization */}
            {result.techStack.skills && result.techStack.skills.length > 0 && (
                <Card className="card-glass border-white/10">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Code className="w-5 h-5 text-primary" />
                                기술 스택
                            </CardTitle>
                            <div className="flex gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> 상급</span>
                                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> 중급</span>
                                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-gray-500"></span> 초급</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-2">
                        {/* Backend */}
                        {result.techStack.skills.filter(s => s.category === 'backend').length > 0 && (
                            <div className="flex items-start gap-3">
                                <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold w-24 shrink-0 pt-1">백엔드</div>
                                <div className="flex flex-wrap gap-1.5">
                                    {result.techStack.skills.filter(s => s.category === 'backend').map((skill, i) => (
                                        <Badge key={i} className={getSkillBadgeStyle(skill.level)}>{skill.name}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Frontend */}
                        {result.techStack.skills.filter(s => s.category === 'frontend').length > 0 && (
                            <div className="flex items-start gap-3">
                                <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold w-24 shrink-0 pt-1">프론트엔드</div>
                                <div className="flex flex-wrap gap-1.5">
                                    {result.techStack.skills.filter(s => s.category === 'frontend').map((skill, i) => (
                                        <Badge key={i} className={getSkillBadgeStyle(skill.level)}>{skill.name}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Database */}
                        {result.techStack.skills.filter(s => s.category === 'database').length > 0 && (
                            <div className="flex items-start gap-3">
                                <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold w-24 shrink-0 pt-1">데이터베이스</div>
                                <div className="flex flex-wrap gap-1.5">
                                    {result.techStack.skills.filter(s => s.category === 'database').map((skill, i) => (
                                        <Badge key={i} className={getSkillBadgeStyle(skill.level)}>{skill.name}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Infra */}
                        {result.techStack.skills.filter(s => s.category === 'infra').length > 0 && (
                            <div className="flex items-start gap-3">
                                <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold w-24 shrink-0 pt-1">인프라/DevOps</div>
                                <div className="flex flex-wrap gap-1.5">
                                    {result.techStack.skills.filter(s => s.category === 'infra').map((skill, i) => (
                                        <Badge key={i} className={getSkillBadgeStyle(skill.level)}>{skill.name}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Etc */}
                        {result.techStack.skills.filter(s => s.category === 'etc').length > 0 && (
                            <div className="flex items-start gap-3">
                                <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold w-24 shrink-0 pt-1">기타</div>
                                <div className="flex flex-wrap gap-1.5">
                                    {result.techStack.skills.filter(s => s.category === 'etc').map((skill, i) => (
                                        <Badge key={i} className={getSkillBadgeStyle(skill.level)}>{skill.name}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <Separator className="bg-white/10 my-4" />

            {/* Detailed Analysis Cards */}
            <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <FileText className="text-primary" /> 상세 항목 분석
                </h2>
                <div className="flex flex-col gap-6">
                    {/* 1. Education */}
                    <DetailCard
                        title="관련 전공"
                        icon={GraduationCap}
                        score={result.education.score}
                        starRating={getStarRating(result.education.score)}
                        summary={result.education.summary}
                    />
                    {/* 2. Career */}
                    <DetailCard
                        title="근속 기간"
                        icon={Briefcase}
                        score={result.career.score}
                        starRating={getStarRating(result.career.score)}
                        summary={result.career.summary}
                    />
                    {/* 3. Tech */}
                    <DetailCard
                        title="기술 스택"
                        icon={Code}
                        score={result.techStack.score}
                        starRating={getStarRating(result.techStack.score)}
                        summary={result.techStack.summary}
                    />
                    {/* 4. AI 역량 */}
                    <DetailCard
                        title="AI 역량"
                        icon={Cpu}
                        score={result.aiCapability.score}
                        starRating={getStarRating(result.aiCapability.score)}
                        summary={result.aiCapability.summary}
                    />
                    {/* 5. 컬쳐핏 */}
                    <DetailCard
                        title="컬쳐핏"
                        icon={HeartHandshake}
                        score={result.cultureFit.score}
                        starRating={getStarRating(result.cultureFit.score)}
                        summary={result.cultureFit.summary}
                    />
                </div>
            </div>

            <Separator className="bg-white/10 my-4" />

            {/* Interview Checks */}
            <Card className="card-glass border-yellow-500/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-500">
                        <AlertTriangle className="w-5 h-5" /> 면접 시 확인 포인트
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        {result.interviewQuestions.map((q, i) => (
                            <li key={i} className="flex gap-3 text-sm">
                                <span className="text-yellow-500 font-bold min-w-[20px]">Q{i + 1}.</span>
                                <span>{q}</span>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>

        </div>
    )
}

function DetailCard({ title, icon: Icon, score, starRating, summary, className }: any) {
    return (
        <Card className={`card-glass flex flex-col ${className}`}>
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-base">
                    <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4 text-primary" />
                        {title}
                    </div>
                    <span className="text-primary font-bold text-lg">{score}점</span>
                </CardTitle>
                <div className="text-yellow-400 text-sm tracking-widest">{starRating}</div>
            </CardHeader>
            <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {summary}
                </p>
            </CardContent>
        </Card>
    )
}

function FileText({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><line x1="10" x2="8" y1="9" y2="9" /></svg>
    )
}
