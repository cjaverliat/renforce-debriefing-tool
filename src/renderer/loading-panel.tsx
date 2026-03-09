/**
 * Welcome / session-selection screen shown before a session is loaded.
 *
 * Presents two actions:
 *   - **Create new** — guides the user through picking a .plm record file and a
 *     video file, then saves a new .plmd descriptor and loads the resulting session.
 *   - **Load existing** — opens an existing .plmd file, resolves its paths, and
 *     parses the associated .plm file.
 *
 * Error messages are normalized for common failure modes (missing files, version
 * mismatch, corruption) so the user sees actionable feedback rather than raw
 * exception strings.
 */
import {useState} from 'react';
import {useTranslation} from 'react-i18next';
import {FileVideo, FolderOpen, AlertCircle} from 'lucide-react';
import {Session} from "@/shared/types/session.ts";
import {LanguageSwitcher} from "@/renderer/components/language-switcher.tsx";
import {ThemeSwitcher} from "@/renderer/components/theme-switcher.tsx";

interface LoadingPanelProps {
    /** Called with the fully-loaded Session once the user completes session setup. */
    onSessionLoaded: (session: Session) => void;
}

/**
 * Full-screen panel for session creation or loading.
 *
 * @param props.onSessionLoaded - Callback invoked when a Session is ready to display.
 */
export function LoadingPanel({onSessionLoaded}: LoadingPanelProps) {
    const {t} = useTranslation();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleCreateNew = async () => {
        setError(null);
        setIsLoading(true);

        try {
            // Step 1: Select PLM file
            const recordPath = await window.electronAPI.selectPlm();
            if (!recordPath) {
                setIsLoading(false);
                return; // User cancelled
            }

            // Step 2: Select video file
            const videoPath = await window.electronAPI.selectVideo();
            if (!videoPath) {
                setIsLoading(false);
                return; // User cancelled
            }

            // Step 5: Save new .plmd file
            const plmdPath = await window.electronAPI.savePlmdAs({
                recordPath: recordPath,
                videoPath: videoPath,
                sessionDate: new Date(),
                manualAnnotations: [],
            });

            if (!plmdPath) {
                setIsLoading(false);
                return; // User cancelled save dialog
            }

            // Step 6: Load the newly created session
            const session = await window.electronAPI.loadPlmd(plmdPath);
            onSessionLoaded(session);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(message);
            setIsLoading(false);
        }
    };

    const handleLoadExisting = async () => {
        setError(null);
        setIsLoading(true);

        try {
            // Step 1: Open .plmd file dialog
            const plmdPath = await window.electronAPI.openSessionDialog();
            if (!plmdPath) {
                setIsLoading(false);
                return; // User cancelled
            }

            // Step 2: Load and validate session
            const loadedSession = await window.electronAPI.loadPlmd(plmdPath);
            onSessionLoaded(loadedSession);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error occurred';

            // Parse error message for user-friendly display
            let displayMessage = message;
            if (message.includes('version')) {
                displayMessage = 'Incompatible session file version';
            } else if (message.includes('not found')) {
                displayMessage = message; // Already has file path
            } else if (message.includes('corrupted')) {
                displayMessage = 'Session file is corrupted or invalid';
            } else {
                displayMessage = `Failed to load session: ${message}`;
            }

            setError(displayMessage);
            setIsLoading(false);
        }
    };

    return (
        <div className="size-full flex items-center justify-center bg-background relative">
            {/* Theme and language switcher in top right corner */}
            <div className="absolute top-4 right-4 flex items-center gap-2">
                <ThemeSwitcher/>
                <LanguageSwitcher/>
            </div>
            <div className="w-full max-w-md space-y-8 p-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold text-foreground">
                        {t('app.title')}
                    </h1>
                    <p className="text-muted-foreground">
                        {t('app.subtitle')}
                    </p>
                </div>

                {/* Main Actions */}
                <div className="space-y-4">
                    {/* Create New Session Button */}
                    <button
                        onClick={handleCreateNew}
                        disabled={isLoading}
                        className="w-full p-6 bg-card hover:bg-accent border border-border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-blue-600/10 rounded-lg group-hover:bg-blue-600/20 transition-colors">
                                <FileVideo className="size-6 text-blue-500"/>
                            </div>
                            <div className="flex-1 text-left">
                                <h2 className="text-lg font-semibold text-foreground mb-1">
                                    {t('loading.createNew')}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {t('loading.createNewDescription')}
                                </p>
                            </div>
                        </div>
                    </button>

                    {/* Load Existing Session Button */}
                    <button
                        onClick={handleLoadExisting}
                        disabled={isLoading}
                        className="w-full p-6 bg-card hover:bg-accent border border-border rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <div className="flex items-start gap-4">
                            <div
                                className="p-3 bg-green-600/10 rounded-lg group-hover:bg-green-600/20 transition-colors">
                                <FolderOpen className="size-6 text-green-500"/>
                            </div>
                            <div className="flex-1 text-left">
                                <h2 className="text-lg font-semibold text-foreground mb-1">
                                    {t('loading.loadExisting')}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {t('loading.loadExistingDescription')}
                                </p>
                            </div>
                        </div>
                    </button>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-lg">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="size-5 text-red-500 shrink-0 mt-0.5"/>
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold text-red-400 mb-1">
                                    {t('loading.error')}
                                </h3>
                                <p className="text-sm text-red-300/90">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="text-center">
                        <div
                            className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-blue-500"></div>
                        <p className="mt-2 text-sm text-muted-foreground">{t('loading.loadingSession')}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
