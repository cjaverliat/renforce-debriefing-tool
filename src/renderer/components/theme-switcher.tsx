import {Sun, Moon, Monitor} from 'lucide-react';
import {Button} from '@/renderer/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';
import {useTheme, Theme} from '@/renderer/hooks/use-theme';

const themes: {value: Theme; label: string; icon: typeof Sun}[] = [
    {value: 'light', label: 'Light', icon: Sun},
    {value: 'dark', label: 'Dark', icon: Moon},
    {value: 'system', label: 'System', icon: Monitor},
];

export function ThemeSwitcher() {
    const {theme, setTheme} = useTheme();

    const currentTheme = themes.find(t => t.value === theme) || themes[2];
    const CurrentIcon = currentTheme.icon;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:bg-accent hover:text-foreground gap-2"
                >
                    <CurrentIcon className="size-4"/>
                    <span className="text-xs">{currentTheme.label}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card border-border">
                {themes.map((t) => {
                    const Icon = t.icon;
                    return (
                        <DropdownMenuItem
                            key={t.value}
                            onClick={() => setTheme(t.value)}
                            className={`text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer ${
                                theme === t.value ? 'bg-accent' : ''
                            }`}
                        >
                            <Icon className="size-4 mr-2"/>
                            {t.label}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
