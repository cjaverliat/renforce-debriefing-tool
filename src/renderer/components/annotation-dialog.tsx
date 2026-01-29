import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/renderer/components/ui/button';
import { Input } from '@/renderer/components/ui/input';
import { Textarea } from '@/renderer/components/ui/textarea';
import { Label } from '@/renderer/components/ui/label';

interface AnnotationDialogProps {
  isOpen: boolean;
  currentTime: number;
  onClose: () => void;
  onSave: (annotation: {
    time: number;
    label: string;
    description: string;
    color: string;
  }) => void;
}

const ANNOTATION_COLORS = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
];

export function AnnotationDialog({
  isOpen,
  currentTime,
  onClose,
  onSave,
}: AnnotationDialogProps) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(ANNOTATION_COLORS[0].value);

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = () => {
    if (!label.trim()) return;
    
    onSave({
      time: currentTime,
      label: label.trim(),
      description: description.trim(),
      color,
    });

    // Reset form
    setLabel('');
    setDescription('');
    setColor(ANNOTATION_COLORS[0].value);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-zinc-900 rounded-lg shadow-xl w-full max-w-md border border-zinc-800">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg text-zinc-100">Add Annotation</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4" onKeyDown={handleKeyDown}>
          <div>
            <Label className="text-zinc-300">Time</Label>
            <div className="text-xl font-mono text-zinc-100 mt-1">
              {formatTime(currentTime)}
            </div>
          </div>

          <div>
            <Label htmlFor="label" className="text-zinc-300">Label *</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Enter annotation label"
              className="mt-1 bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500"
              autoFocus
            />
          </div>

          <div>
            <Label className="text-zinc-300">Color</Label>
            <div className="flex gap-2 mt-1">
              {ANNOTATION_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className={`size-8 rounded-full transition-transform ${
                    color === c.value ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110' : ''
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="text-zinc-300">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter detailed description (optional)"
              className="mt-1 bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-500 min-h-25"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-zinc-800">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!label.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Save Annotation
          </Button>
        </div>

        <div className="px-4 pb-4 text-xs text-zinc-500">
          Press Ctrl+Enter to save, Esc to cancel
        </div>
      </div>
    </div>
  );
}
