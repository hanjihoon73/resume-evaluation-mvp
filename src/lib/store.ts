
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AnalysisResult } from '@/lib/analysis-engine';
import { ExtractedMetadata } from '@/lib/file-parser';

export interface ResumeData {
    id: string; // Unique ID (e.g. filename + timestamp)
    file?: File;
    metadata: ExtractedMetadata;
    status: 'idle' | 'analyzing' | 'completed' | 'error';
    progress: number;
    currentRound: number; // 0 to 3
    result?: AnalysisResult;
    totalScore?: number;
    error?: string;
}

interface ResumeStore {
    resumes: ResumeData[];
    globalStatus: 'idle' | 'analyzing' | 'completed';
    currentAnalyzingIndex: number;
    selectedModel: string;

    // Actions
    addResumes: (newResumes: ResumeData[]) => void;
    updateResumeStatus: (id: string, status: ResumeData['status'], result?: AnalysisResult, totalScore?: number, error?: string) => void;
    updateResumeRound: (id: string, round: number) => void;
    setGlobalStatus: (status: 'idle' | 'analyzing' | 'completed') => void;
    setCurrentAnalyzingIndex: (index: number) => void;
    setSelectedModel: (model: string) => void;
    resetAll: () => void;
    getSortedResumes: () => ResumeData[];
}

export const useResumeStore = create<ResumeStore>()(
    persist(
        (set, get) => ({
            resumes: [],
            globalStatus: 'idle',
            currentAnalyzingIndex: -1,
            selectedModel: 'gemini-flash-latest',

            addResumes: (newResumes) => set((state) => ({
                resumes: [...state.resumes, ...newResumes.map(r => ({ ...r, currentRound: 0 }))],
            })),

            updateResumeStatus: (id, status, result, totalScore, error) => set((state) => ({
                resumes: state.resumes.map(r => r.id === id ? { ...r, status, result, totalScore, error } : r)
            })),
            updateResumeRound: (id, round) => set((state) => ({
                resumes: state.resumes.map(r => r.id === id ? { ...r, currentRound: round } : r)
            })),

            setGlobalStatus: (status) => set({ globalStatus: status }),

            setCurrentAnalyzingIndex: (index) => set({ currentAnalyzingIndex: index }),
            setSelectedModel: (model) => set({ selectedModel: model }),

            resetAll: () => set({ resumes: [], globalStatus: 'idle', currentAnalyzingIndex: -1 }),

            getSortedResumes: () => {
                const { resumes } = get();
                return [...resumes].sort((a, b) => {
                    const channelCompare = a.metadata.channel.localeCompare(b.metadata.channel, 'ko');
                    if (channelCompare !== 0) return channelCompare;

                    const positionCompare = a.metadata.position.localeCompare(b.metadata.position, 'ko');
                    if (positionCompare !== 0) return positionCompare;

                    return a.metadata.applicantName.localeCompare(b.metadata.applicantName, 'ko');
                });
            }
        }),
        {
            name: 'resume-storage',
            storage: createJSONStorage(() => localStorage),
            // EXCLUDE 'file' property from persistence because File objects are not serializable
            partialize: (state) => ({
                ...state,
                resumes: state.resumes.map(({ file, ...rest }) => rest)
            }),
        }
    )
);
