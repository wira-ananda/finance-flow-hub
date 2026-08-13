import { Monitor, Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";
import { useTheme, type ThemePreference } from "@/providers/theme-provider";

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Terang", icon: Sun },
  { value: "dark", label: "Gelap", icon: Moon },
  { value: "system", label: "Sistem", icon: Monitor },
];

export function ThemeSwitcher({ variant = "compact" }: { variant?: "compact" | "full" }) {
  const { preference, setPreference } = useTheme();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border border-border bg-background-subtle p-0.5",
        variant === "full" && "w-full",
      )}
      role="group"
      aria-label="Pilihan tema tampilan"
    >
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const active = preference === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setPreference(option.value)}
            aria-pressed={active}
            title={option.label}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium transition-colors",
              variant === "full" && "flex-1",
              active
                ? "bg-card text-foreground shadow-card"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            <span className={variant === "compact" ? "sr-only sm:not-sr-only" : ""}>
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
