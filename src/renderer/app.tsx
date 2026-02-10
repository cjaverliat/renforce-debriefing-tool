import {useEffect, useState} from 'react';
import {LoadingPanel} from '@/renderer/loading-panel.tsx';
import {Session} from "@/shared/types/session.ts";
import {SessionPanel} from "@/renderer/session-panel.tsx";
import {createMockSession} from "@/shared/data/mock-session.ts";

export function App() {
    const [session, setSession] = useState<Session | null>(null);

    const handleSessionLoaded = (session: Session) => {
        setSession(session);
    };

    // TODO: remove - load mock session data for development
    // useEffect(() => {
    //     createMockSession().then((data) => setSession(data));
    // }, []);

    // Show loading panel if in loading mode
    if (!session) {
        return <LoadingPanel onSessionLoaded={handleSessionLoaded}/>;
    }

    // Show main debriefing UI
    return <SessionPanel session={session}/>
}
