import {FileText} from 'lucide-react';
import {Button} from '@/renderer/components/ui/button';
import {Annotation, SessionData} from "@/shared/types/session.ts";

interface ExportControlsProps {
    sessionData: SessionData;
    annotations: Annotation[];
}

export function ExportControls({sessionData, annotations}: ExportControlsProps) {
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const generateTextReport = () => {
        const lines: string[] = [];

        lines.push('DEBRIEFING SESSION REPORT');
        lines.push('='.repeat(50));
        lines.push('');
        lines.push(`Session Date: ${sessionData.sessionDate.toLocaleString()}`);
        lines.push(`Video: ${sessionData.recordData.videoPath}`);
        lines.push(`Duration: ${formatTime(sessionData.recordData.duration)}`);
        lines.push(`Total Annotations: ${annotations.length}`);
        lines.push('');
        lines.push('='.repeat(50));
        lines.push('');

        annotations = annotations.sort((a, b) => a.time - b.time);

        if (annotations.length > 0) {
            annotations.forEach(annotation => {
                lines.push(`Time: ${formatTime(annotation.time)}`);
                lines.push(`Label: ${annotation.label}`);
                if (annotation.description) {
                    lines.push(`Description: ${annotation.description}`);
                }
                lines.push('');
            });

            lines.push('');
        }

        // Summary statistics
        lines.push('='.repeat(50));
        lines.push('SUMMARY');
        lines.push('='.repeat(50));
        lines.push('');

        return lines.join('\n');
    };

    const downloadFile = (content: string, filename: string, type: string) => {
        const blob = new Blob([content], {type});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleExportText = () => {
        const report = generateTextReport();
        const filename = `debriefing-report-${new Date().toISOString().split('T')[0]}.txt`;
        downloadFile(report, filename, 'text/plain');
    };

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="ghost"
                size="sm"
                onClick={handleExportText}
                className="text-zinc-300 hover:bg-zinc-800 hover:text-white"
                disabled={annotations.length === 0}
            >
                <FileText className="size-4 mr-2"/>
                Export Report (.txt)
            </Button>
        </div>
    );
}
