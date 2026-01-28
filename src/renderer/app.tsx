import {useEffect, useState} from 'react';
import {LoadingPanel} from '@/renderer/loading-panel.tsx';
import {SessionData} from "@/shared/types/session.ts";
import {SessionPanel} from "@/renderer/session-panel.tsx";
import {createMockSessionData} from "@/shared/data/mock-session-data.ts";

export function App() {
    const [sessionData, setSessionData] = useState<SessionData | null>(null);

    const handleSessionLoaded = (session: SessionData) => {
        setSessionData(session);
    };

    // TODO: remove - load mock session data for development
    useEffect(() => {
        createMockSessionData().then((data) => setSessionData(data));
    }, []);

    // Show loading panel if in loading mode
    if (!sessionData) {
        return <LoadingPanel onSessionLoaded={handleSessionLoaded}/>;
    }

    // Show main debriefing UI
    return <SessionPanel sessionData={sessionData}/>
}
