import { FileText, FileJson } from 'lucide-react';
import { Button } from '@/renderer/components/ui/button';
import {Annotation, SessionData} from "@/shared/types/session.ts";

interface ExportControlsProps {
  sessionData: SessionData;
  annotations: Annotation[];
}

export function ExportControls({ sessionData, annotations }: ExportControlsProps) {
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
    
    // Group by category
    const categories = Array.from(new Set(annotations.map(a => a.category)));
    
    categories.forEach(category => {
      const categoryAnnotations = annotations
        .filter(a => a.category === category)
        .sort((a, b) => a.time - b.time);
      
      if (categoryAnnotations.length > 0) {
        lines.push(`${category.toUpperCase()} (${categoryAnnotations.length})`);
        lines.push('-'.repeat(50));
        lines.push('');
        
        categoryAnnotations.forEach(annotation => {
          lines.push(`Time: ${formatTime(annotation.time)}`);
          lines.push(`Label: ${annotation.label}`);
          if (annotation.description) {
            lines.push(`Description: ${annotation.description}`);
          }
          lines.push(`Created: ${annotation.timestamp.toLocaleString()}`);
          lines.push('');
        });
        
        lines.push('');
      }
    });
    
    // Summary statistics
    lines.push('='.repeat(50));
    lines.push('SUMMARY');
    lines.push('='.repeat(50));
    lines.push('');
    
    categories.forEach(category => {
      const count = annotations.filter(a => a.category === category).length;
      lines.push(`${category}: ${count}`);
    });
    
    return lines.join('\n');
  };

  const generateJSONReport = () => {
    return {
      session: {
        date: sessionData.sessionDate.toISOString(),
        video: sessionData.recordData.videoPath,
        duration: sessionData.recordData.duration,
      },
      annotations: annotations.map(a => ({
        id: a.id,
        time: a.time,
        label: a.label,
        description: a.description,
        category: a.category,
        color: a.color,
        timestamp: a.timestamp.toISOString(),
      })),
      summary: {
        totalAnnotations: annotations.length,
        categories: Array.from(new Set(annotations.map(a => a.category))).map(cat => ({
          name: cat,
          count: annotations.filter(a => a.category === cat).length,
        })),
      },
    };
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
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

  const handleExportJSON = () => {
    const report = generateJSONReport();
    const filename = `debriefing-report-${new Date().toISOString().split('T')[0]}.json`;
    downloadFile(JSON.stringify(report, null, 2), filename, 'application/json');
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
        <FileText className="size-4 mr-2" />
        Export Report (.txt)
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleExportJSON}
        className="text-zinc-300 hover:bg-zinc-800 hover:text-white"
        disabled={annotations.length === 0}
      >
        <FileJson className="size-4 mr-2" />
        Export Data (.json)
      </Button>
    </div>
  );
}
