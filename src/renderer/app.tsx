/**
 * Root application shell.
 *
 * Manages the top-level routing between two mutually exclusive states:
 *   - **Loading state** (`session === null`): renders `LoadingPanel` which lets
 *     the user create a new session or open an existing one.
 *   - **Session state** (`session !== null`): renders `SessionPanel`, the full
 *     debriefing workspace with video player, timeline, and annotation panels.
 *
 * When `mockSession` is true (started with `--mock-session`), the app skips
 * the loading screen and immediately renders mock data for development.
 */
import {JSX, useState} from 'react';
import {LoadingPanel} from '@/renderer/loading-panel.tsx';
import {Session} from "@/shared/types/session.ts";
import {SessionPanel} from "@/renderer/session-panel.tsx";
import {createMockRecordData, createMockSession} from "@/shared/data/mock-session.ts";

interface AppProps {
    /** When true, the app skips file loading and uses mock session data. */
    mockSession: boolean;
}

/**
 * Root React component.
 *
 * @param props.mockSession - Whether to skip loading and use built-in mock data.
 */
export function App({mockSession}: AppProps): JSX.Element {
    const [session, setSession] = useState<Session | null>(() =>
        mockSession ? createMockSession() : null
    );

    const handleSessionLoaded = (session: Session) => {
        // TODO: remove - Replace record data with mock data
        session.recordData = createMockRecordData(2 * 60 + 30);
        setSession(session);
    };

    // Show loading panel if in loading mode
    if (!session) {
        return <LoadingPanel onSessionLoaded={handleSessionLoaded}/>;
    }

    // Show main debriefing UI
    return <SessionPanel session={session}/>
}
