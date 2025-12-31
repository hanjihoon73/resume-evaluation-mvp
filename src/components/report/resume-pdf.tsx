
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
        padding: 30,
        fontFamily: 'Pretendard',
        fontSize: 10,
        color: '#333',
        backgroundColor: '#ffffff',
    },
    header: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        paddingBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#111',
    },
    subtitle: {
        fontSize: 12,
        color: '#666',
    },
    section: {
        marginBottom: 15,
        padding: 10,
        backgroundColor: '#f9fafb',
        borderRadius: 5,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#2563eb', // Blue-600
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        paddingBottom: 4,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    label: {
        width: 80,
        fontWeight: 'bold',
        color: '#4b5563',
    },
    value: {
        flex: 1,
        color: '#111',
    },
    scoreBadge: {
        padding: '4px 8px',
        backgroundColor: '#eff6ff',
        color: '#1d4ed8',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 'bold',
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    card: {
        marginBottom: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        paddingBottom: 5,
    },
    cardTitle: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    cardScore: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#2563eb',
    },
    textBlock: {
        lineHeight: 1.5,
        marginBottom: 5,
    },
    checkList: {
        marginTop: 5,
        paddingTop: 5,
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    checkItem: {
        flexDirection: 'row',
        marginBottom: 2,
    },
    bullet: {
        width: 10,
        color: '#ef4444', // Red for attention
    },
});

interface ResumePDFProps {
    data: ResumeData;
}

export const ResumePDF: React.FC<ResumePDFProps> = ({ data }) => {
    const { metadata, result, totalScore } = data;
    if (!result) return null;

    const getSuitabilityLabel = (score: number) => {
        if (score >= 90) return '적극 추천';
        if (score >= 80) return '추천';
        if (score >= 70) return '조건부 추천';
        return '부적합';
    };

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
                    <Text style={styles.subtitle}>{metadata.position} | {metadata.applicantName} | {metadata.channel}</Text>
                </View>

                {/* Basic Info */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>기본 정보</Text>
                    <View style={styles.row}>
                        <Text style={styles.label}>이름</Text>
                        <Text style={styles.value}>{metadata.applicantName}</Text>
                        <Text style={styles.label}>포지션</Text>
                        <Text style={styles.value}>{metadata.position}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>지원채널</Text>
                        <Text style={styles.value}>{metadata.channel}</Text>
                        <Text style={styles.label}>최종학력</Text>
                        <Text style={styles.value}>{result.basicInfo.finalEducation || '-'}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>학점</Text>
                        <Text style={styles.value}>{result.basicInfo.gpa || '-'}</Text>
                        <Text style={styles.label}>나이</Text>
                        <Text style={styles.value}>
                            {result.basicInfo.birthYear
                                ? `${new Date().getFullYear() - parseInt(result.basicInfo.birthYear)}세 (${result.basicInfo.birthYear}년생)`
                                : '-'}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.label}>경력기간</Text>
                        <Text style={styles.value}>{result.basicInfo.totalCareerParams || '-'}</Text>
                    </View>
                </View>

                {/* Overall Review */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>종합 평가</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>총점: {totalScore}점</Text>
                        <Text style={{ fontSize: 14, color: totalScore && totalScore >= 70 ? '#16a34a' : '#dc2626' }}>
                            {getSuitabilityLabel(totalScore || 0)}
                        </Text>
                    </View>
                    <Text style={styles.textBlock}>{result.overallReview}</Text>

                    <View style={{ marginTop: 10 }}>
                        <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>장점</Text>
                        {result.pros.map((p, i) => <Text key={i} style={{ fontSize: 9, marginBottom: 2 }}>• {p}</Text>)}
                    </View>
                    <View style={{ marginTop: 10 }}>
                        <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>단점</Text>
                        {result.cons.map((c, i) => <Text key={i} style={{ fontSize: 9, marginBottom: 2 }}>• {c}</Text>)}
                    </View>
                </View>

                {/* Detailed Sections */}
                <View>
                    <Text style={{ fontSize: 16, marginBottom: 10, fontWeight: 'bold' }}>세부 항목 평가</Text>

                    {[
                        { title: '관련 전공', data: result.education },
                        { title: '근속 기간', data: result.career },
                        { title: '기술 스택', data: result.techStack },
                        { title: 'AI 역량', data: result.aiCapability },
                        { title: '컬처핏', data: result.cultureFit },
                    ].map((item, idx) => (
                        <View key={idx} style={styles.card}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.cardTitle}>{item.title}</Text>
                                <View style={{ flexDirection: 'row' }}>
                                    <Text style={{ marginRight: 5 }}>{getStarRating(item.data.score)}</Text>
                                    <Text style={styles.cardScore}>{item.data.score}점</Text>
                                </View>
                            </View>
                            <Text style={styles.textBlock}>{item.data.summary}</Text>
                        </View>
                    ))}
                </View>

                {/* Interview Questions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>면접 체크포인트</Text>
                    {result.interviewQuestions.map((q, i) => (
                        <View key={i} style={styles.checkItem}>
                            <Text style={styles.bullet}>?</Text>
                            <Text style={styles.value}>{q}</Text>
                        </View>
                    ))}
                </View>

            </Page>
        </Document>
    );
};
