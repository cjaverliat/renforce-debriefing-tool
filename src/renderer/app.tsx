import {JSX, useState} from 'react';
import {LoadingPanel} from '@/renderer/loading-panel.tsx';
import {Session} from "@/shared/types/session.ts";
import {SessionPanel} from "@/renderer/session-panel.tsx";
import {createMockRecordData, createMockSession} from "@/shared/data/mock-session.ts";

interface AppProps {
    mockSession: boolean;
}

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
