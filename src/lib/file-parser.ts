export interface ExtractedMetadata {
    position: string;
    applicantName: string;
    channel: string;
}

export function parseFileName(fileName: string): ExtractedMetadata | null {
    // Expected format: Position_Name_Channel.pdf
    // Remove extension
    const nameWithoutExt = fileName.replace(/\.pdf$/i, '');

    // Split by underscore
    const parts = nameWithoutExt.split('_');

    if (parts.length < 3) {
        // If format doesn't match roughly, try to map what we have or return null
        // Fallback: If only 2 parts, assume Position_Name and unknown channel
        if (parts.length === 2) {
            return {
                position: parts[0],
                applicantName: parts[1],
                channel: '기타'
            };
        }
        // Deep fallback
        return {
            position: '미지정',
            applicantName: nameWithoutExt,
            channel: '기타'
        };
    }

    // If more than 3 parts, join the middle ones as name, or follow specific rule?
    // Planning doc says: 포지션_이름_지원채널.pdf
    // Let's assume the first is position, last is channel, middle is name.

    const position = parts[0];
    const channel = parts[parts.length - 1];
    const applicantName = parts.slice(1, parts.length - 1).join('_'); // Handle names with underscores if any

    return {
        position,
        applicantName,
        channel
    };
}
