/**
 * Export controls component.
 *
 * Provides buttons to export session data in various formats.
 * Currently supports text report export only.
 *
 * The text report includes:
 *   - Session date, video path, duration, annotation count
 *   - All annotations sorted chronologically (time, label, optional description)
 *   - A summary statistics section
 *
 * The file is exported by creating a Blob URL, programmatically clicking a
 * temporary anchor element, and revoking the URL — all within the renderer
 * (no IPC required, uses the browser download API).
 */
import {useTranslation} from 'react-i18next';
import {FileText} from 'lucide-react';
import {Button} from '@/renderer/components/ui/button';
import {Annotation, Session} from "@/shared/types/session.ts";

interface ExportControlsProps {
    session: Session;
    annotations: Annotation[];
}

/**
 * Toolbar component with export action buttons.
 *
 * @param props.session     - Active session (provides date, video path, duration).
 * @param props.annotations - Current annotations list to include in the export.
 */
export function ExportControls({session, annotations}: ExportControlsProps) {
    const {t} = useTranslation();

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const generateTextReport = () => {
        const lines: string[] = [];

        lines.push(t('export.reportTitle'));
        lines.push('='.repeat(50));
        lines.push('');
        lines.push(`${t('export.sessionDate')}: ${session.sessionData.sessionDate.toLocaleString()}`);
        lines.push(`${t('export.video')}: ${session.sessionData.videoPath}`);
        lines.push(`${t('export.duration')}: ${formatTime(session.recordData.duration)}`);
        lines.push(`${t('export.totalAnnotations')}: ${annotations.length}`);
        lines.push('');
        lines.push('='.repeat(50));
        lines.push('');

        annotations = annotations.sort((a, b) => a.time - b.time);

        if (annotations.length > 0) {
            annotations.forEach(annotation => {
                lines.push(`${t('export.time')}: ${formatTime(annotation.time)}`);
                lines.push(`${t('export.label')}: ${annotation.label}`);
                if (annotation.description) {
                    lines.push(`${t('export.description')}: ${annotation.description}`);
                }
                lines.push('');
            });

            lines.push('');
        }

        // Summary statistics
        lines.push('='.repeat(50));
        lines.push(t('export.summary'));
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
                className="text-muted-foreground hover:bg-accent hover:text-foreground"
            >
                <FileText className="size-4 mr-2"/>
                {t('export.exportReport')}
            </Button>
        </div>
    );
}
