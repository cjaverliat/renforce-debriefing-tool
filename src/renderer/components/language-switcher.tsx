import {useTranslation} from 'react-i18next';
import {Globe} from 'lucide-react';
import {Button} from '@/renderer/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/renderer/components/ui/dropdown-menu';

const languages = [
    {code: 'fr', label: 'Français'},
    {code: 'en', label: 'English'},
];

export function LanguageSwitcher() {
    const {i18n} = useTranslation();

    const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

    const handleLanguageChange = (languageCode: string) => {
        i18n.changeLanguage(languageCode);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-zinc-300 hover:bg-zinc-800 hover:text-white gap-2"
                >
                    <Globe className="size-4"/>
                    <span className="text-xs">{currentLanguage.label}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                {languages.map((language) => (
                    <DropdownMenuItem
                        key={language.code}
                        onClick={() => handleLanguageChange(language.code)}
                        className={`text-zinc-300 hover:bg-zinc-800 hover:text-white cursor-pointer ${
                            i18n.language === language.code ? 'bg-zinc-800' : ''
                        }`}
                    >
                        {language.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
