
import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import { ResumeData } from '@/lib/store';

// Register font
Font.register({
    family: 'Pretendard',
    fonts: [
        {
            src: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.8/packages/pretendard/dist/public/static/Pretendard-Regular.otf',
            fontWeight: 400,
        },
        {
            src: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.8/packages/pretendard/dist/public/static/Pretendard-Bold.otf',
            fontWeight: 700,
        }
    ]
});

// Styles
const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Pretendard',
        fontSize: 10,
        color: '#333',
        backgroundColor: '#ffffff',
    },
    header: {
        marginBottom: 30,
        textAlign: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#111',
        letterSpacing: -1,
    },
    // New Grid-based Basic Info
    infoGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        borderWidth: 1,
        borderColor: '#f1f5f9',
        borderRadius: 8,
        backgroundColor: '#f8fafc',
        marginBottom: 24,
        overflow: 'hidden',
    },
    infoItem: {
        width: '25%', // 4 items per row
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderRightWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#f1f5f9',
    },
    infoValue: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#0ea5e9', // Cyan Primary
        marginBottom: 2,
    },
    infoLabel: {
        fontSize: 8,
        color: '#64748b',
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    // Score & Review Section
    overallSection: {
        flexDirection: 'row',
        gap: 15,
        marginBottom: 24,
    },
    scoreCard: {
        width: '30%',
        backgroundColor: '#f0f9ff', // Primary light bg
        borderRadius: 8,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#e0f2fe',
    },
    scoreLabel: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#0369a1',
        marginBottom: 8,
    },
    scoreValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#0ea5e9',
    },
    suitability: {
        marginTop: 8,
        padding: '3px 8px',
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    reviewCard: {
        flex: 1,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        padding: 15,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#0f172a',
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailCard: {
        marginBottom: 12,
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    detailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 8,
    },
    detailTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#334155',
    },
    detailScore: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#0ea5e9',
    },
    textBlock: {
        lineHeight: 1.6,
        fontSize: 10,
        color: '#475569',
    },
    bulletPoint: {
        fontSize: 10,
        lineHeight: 1.6,
        color: '#475569',
        marginBottom: 4,
        paddingLeft: 4,
    },
    checkpointBox: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#f8fafc',
        borderRadius: 8,
    },
    checkpointTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#0ea5e9',
        marginBottom: 8,
    },
    checkpointItem: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    qMark: {
        width: 15,
        color: '#f43f5e',
        fontWeight: 'bold',
    }
});

interface ResumePDFProps {
    data: ResumeData;
}

export const ResumePDF: React.FC<ResumePDFProps> = ({ data }) => {
    const { metadata, result, totalScore } = data;
    if (!result) return null;

    const getSuitabilityInfo = (score: number) => {
        if (score >= 90) return { label: '적극 추천', color: '#059669' };
        if (score >= 80) return { label: '추천', color: '#2563eb' };
        if (score >= 70) return { label: '조건부 추천', color: '#d97706' };
        return { label: '부적합', color: '#dc2626' };
    };

    const suit = getSuitabilityInfo(totalScore || 0);

    const getStarRating = (score: number) => {
        if (score >= 90) return '★★★★★';
        if (score >= 80) return '★★★★☆';
        if (score >= 60) return '★★★☆☆';
        if (score >= 30) return '★★☆☆☆';
        return '★☆☆☆☆';
    };

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>지원자 분석 리포트</Text>
                </View>

                {/* Basic Info Grid (4x2) */}
                <View style={styles.infoGrid}>
                    {/* Row 1 */}
                    <View style={styles.infoItem}>
                        <Text style={styles.infoValue}>{metadata.position}</Text>
                        <Text style={styles.infoLabel}>포지션</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoValue}>{metadata.applicantName}</Text>
                        <Text style={styles.infoLabel}>이름</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoValue}>{metadata.channel}</Text>
                        <Text style={styles.infoLabel}>지원채널</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoValue}>{result.basicInfo.major || '정보 없음'}</Text>
                        <Text style={styles.infoLabel}>전공</Text>
                    </View>
                    {/* Row 2 */}
                    <View style={styles.infoItem}>
                        <Text style={styles.infoValue}>{result.basicInfo.finalEducation || '-'}</Text>
                        <Text style={styles.infoLabel}>최종학력</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoValue}>{result.basicInfo.gpa || '-'}</Text>
                        <Text style={styles.infoLabel}>학점</Text>
                    </View>
                    <View style={styles.infoItem}>
                        <Text style={styles.infoValue}>
                            {result.basicInfo.birthYear
                                ? `${new Date().getFullYear() - parseInt(result.basicInfo.birthYear)}세`
                                : '-'}
                        </Text>
                        <Text style={styles.infoLabel}>나이</Text>
                    </View>
                    <View style={[styles.infoItem, { borderRightWidth: 0 }]}>
                        <Text style={styles.infoValue}>{result.basicInfo.totalCareerParams || '-'}</Text>
                        <Text style={styles.infoLabel}>경력기간</Text>
                    </View>
                </View>

                {/* Overall Score & Review */}
                <View style={styles.overallSection}>
                    <View style={styles.scoreCard}>
                        <Text style={styles.scoreLabel}>종합 점수</Text>
                        <Text style={styles.scoreValue}>{totalScore}</Text>
                        <View style={[styles.suitability, { backgroundColor: suit.color }]}>
                            <Text>{suit.label}</Text>
                        </View>
                    </View>

                    <View style={styles.reviewCard}>
                        <View style={styles.sectionTitle}>
                            <Text>총평</Text>
                        </View>
                        {Array.isArray(result.overallReview) ? (
                            <View>
                                {result.overallReview.map((point, i) => (
                                    <Text key={i} style={styles.bulletPoint}>• {point}</Text>
                                ))}
                            </View>
                        ) : (
                            <Text style={styles.textBlock}>{result.overallReview}</Text>
                        )}
                    </View>
                </View>

                {/* Pros & Cons Section */}
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
                    <View style={[styles.reviewCard, { borderLeftWidth: 4, borderLeftColor: '#22c55e' }]}>
                        <Text style={[styles.sectionTitle, { color: '#166534' }]}>장점 (Pros)</Text>
                        <View>
                            {result.pros.map((p, i) => (
                                <Text key={i} style={styles.bulletPoint}>• {p}</Text>
                            ))}
                        </View>
                    </View>
                    <View style={[styles.reviewCard, { borderLeftWidth: 4, borderLeftColor: '#ef4444' }]}>
                        <Text style={[styles.sectionTitle, { color: '#991b1b' }]}>단점 (Cons)</Text>
                        <View>
                            {result.cons.map((c, i) => (
                                <Text key={i} style={styles.bulletPoint}>• {c}</Text>
                            ))}
                        </View>
                    </View>
                </View>

                {/* Detailed Sections */}
                <View wrap={false}>
                    <Text style={[styles.sectionTitle, { fontSize: 14, marginBottom: 15 }]}>세부 항목 평가</Text>

                    {[
                        { title: '관련 전공', data: result.education },
                        { title: '근속 기간', data: result.career },
                        { title: '기술 스택', data: result.techStack },
                        { title: 'AI 역량', data: result.aiCapability },
                        { title: '컬처핏', data: result.cultureFit },
                    ].map((item, idx) => (
                        <View key={idx} style={styles.detailCard} wrap={false}>
                            <View style={styles.detailHeader}>
                                <Text style={styles.detailTitle}>{item.title}</Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Text style={{ fontSize: 10, color: '#94a3b8', marginRight: 6 }}>{getStarRating(item.data.score)}</Text>
                                    <Text style={styles.detailScore}>{item.data.score}점</Text>
                                </View>
                            </View>
                            <Text style={styles.textBlock}>{item.data.summary}</Text>
                        </View>
                    ))}
                </View>

                {/* Interview Checkpoints */}
                <View style={styles.checkpointBox} wrap={false}>
                    <Text style={styles.checkpointTitle}>면접 체크포인트</Text>
                    {result.interviewQuestions.map((q, i) => (
                        <View key={i} style={styles.checkpointItem}>
                            <Text style={styles.qMark}>?</Text>
                            <Text style={styles.textBlock}>{q}</Text>
                        </View>
                    ))}
                </View>

            </Page>
        </Document>
    );
};
