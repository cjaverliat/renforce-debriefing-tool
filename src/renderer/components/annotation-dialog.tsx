/**
 * Annotation create/edit dialog component.
 *
 * A modal overlay for creating a new annotation at the current playback time
 * or editing an existing annotation. When `annotationToEdit` is provided,
 * the dialog pre-fills from that annotation's data (edit mode); otherwise it
 * starts blank at `currentTime` (create mode).
 *
 * Form fields:
 *   - Time display (read-only — set at creation time, locked when editing)
 *   - Label (required)
 *   - Color picker (7 preset colors)
 *   - Description (optional, multiline)
 *
 * Keyboard shortcuts: Ctrl+Enter saves, Escape closes.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Button } from '@/renderer/components/ui/button';
import { Input } from '@/renderer/components/ui/input';
import { Textarea } from '@/renderer/components/ui/textarea';
import { Label } from '@/renderer/components/ui/label';
import { Annotation } from '@/shared/types/session';

interface AnnotationDialogProps {
  isOpen: boolean;
  currentTime: number;
  annotationToEdit?: Annotation;
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

/**
 * Modal dialog for creating or editing a manual annotation.
 *
 * @param props.isOpen           - Whether the dialog is visible.
 * @param props.currentTime      - Current playback time used as the default annotation time.
 * @param props.annotationToEdit - If set, the dialog is in edit mode for this annotation.
 * @param props.onClose          - Called when the dialog is dismissed without saving.
 * @param props.onSave           - Called with the new/updated annotation data on save.
 */
export function AnnotationDialog({
  isOpen,
  currentTime,
  annotationToEdit,
  onClose,
  onSave,
}: AnnotationDialogProps) {
  const { t } = useTranslation();
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(ANNOTATION_COLORS[0].value);

  useEffect(() => {
    if (isOpen) {
      if (annotationToEdit) {
        setLabel(annotationToEdit.label);
        setDescription(annotationToEdit.description ?? '');
        setColor(annotationToEdit.color);
      } else {
        setLabel('');
        setDescription('');
        setColor(ANNOTATION_COLORS[0].value);
      }
    }
  }, [isOpen, annotationToEdit]);

  if (!isOpen) return null;

  const isEditing = !!annotationToEdit;
  const displayTime = isEditing ? annotationToEdit.time : currentTime;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSave = () => {
    if (!label.trim()) return;
    onSave({
      time: displayTime,
      label: label.trim(),
      description: description.trim(),
      color,
    });
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
      <div className="bg-card rounded-lg shadow-xl w-full max-w-md border border-border">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg text-foreground">{isEditing ? t('annotationDialog.editTitle') : t('annotationDialog.title')}</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4" onKeyDown={handleKeyDown}>
          <div>
            <Label className="text-muted-foreground">{t('annotationDialog.time')}</Label>
            <div className="text-xl font-mono text-foreground mt-1">
              {formatTime(displayTime)}
            </div>
          </div>

          <div>
            <Label htmlFor="label" className="text-muted-foreground">{t('annotationDialog.labelRequired')}</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder={t('annotationDialog.labelPlaceholder')}
              className="mt-1 bg-accent border-border text-foreground placeholder:text-muted-foreground"
              autoFocus
            />
          </div>

          <div>
            <Label className="text-muted-foreground">{t('annotationDialog.color')}</Label>
            <div className="flex gap-2 mt-1">
              {ANNOTATION_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className={`size-8 rounded-full transition-transform ${
                    color === c.value ? 'ring-2 ring-white ring-offset-2 ring-offset-card scale-110' : ''
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="text-muted-foreground">{t('annotationDialog.description')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('annotationDialog.descriptionPlaceholder')}
              className="mt-1 bg-accent border-border text-foreground placeholder:text-muted-foreground min-h-25"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {t('annotationDialog.cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!label.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isEditing ? t('annotationDialog.update') : t('annotationDialog.save')}
          </Button>
        </div>

        <div className="px-4 pb-4 text-xs text-muted-foreground">
          {t('annotationDialog.shortcutHint')}
        </div>
      </div>
    </div>
  );
}
