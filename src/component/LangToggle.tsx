import { useLang, Language } from "@/contexts/LangContext";
import { Button } from "@/component/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/component/ui/dropdown-menu";
import { Globe } from "lucide-react";

const LANGS: { code: Language; label: string; native: string }[] = [
  { code: "mr", label: "Marathi", native: "मराठी" },
  { code: "hi", label: "Hindi", native: "हिंदी" },
  { code: "en", label: "English", native: "English" },
];

export default function LangToggle() {
  const { lang, setLang } = useLang();
  const current = LANGS.find((l) => l.code === lang) || LANGS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 border-primary/30 text-foreground hover:bg-primary/10 font-medium"
        >
          <Globe className="w-4 h-4 text-primary" />
          <span className="hidden sm:inline">{current.native}</span>
          <span className="sm:hidden">{current.code.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {LANGS.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => setLang(l.code)}
            className={`flex items-center justify-between cursor-pointer ${
              lang === l.code ? "bg-primary/10 text-primary font-semibold" : ""
            }`}
          >
            <span>{l.native}</span>
            <span className="text-xs text-muted-foreground">{l.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}


