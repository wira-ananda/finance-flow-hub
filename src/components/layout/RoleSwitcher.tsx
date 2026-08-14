import { useNavigate } from "@tanstack/react-router";
import { FlaskConical } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_LABELS } from "@/constants/status";
import { useSession } from "@/providers/session-provider";
import type { UserRole } from "@/types";

const ROLES: UserRole[] = ["UNIT_USER", "FINANCE_REVIEWER", "FINANCE_PAYMENT", "ADMIN"];

/**
 * Development Role Switcher.
 *
 * Component tidak dirender pada production build.
 */
export function RoleSwitcher({ variant = "compact" }: { variant?: "compact" | "full" }) {
  const navigate = useNavigate();

  const { role, setRole } = useSession();

  if (!import.meta.env.DEV || !role) {
    return null;
  }

  const handleRoleChange = (value: string) => {
    setRole(value as UserRole);

    void navigate({
      to: "/",
      replace: true,
    });
  };

  return (
    <div className={variant === "full" ? "space-y-2" : "flex items-center gap-2"}>
      {variant === "compact" ? (
        <span className="hidden items-center gap-1 rounded-md border border-status-revision/35 bg-status-revision/10 px-1.5 py-1 text-[10px] font-semibold tracking-wide text-status-revision uppercase xl:inline-flex">
          <FlaskConical className="size-3" aria-hidden />
          Dev
        </span>
      ) : null}

      <Select value={role} onValueChange={handleRoleChange}>
        <SelectTrigger
          className={variant === "full" ? "w-full" : "h-8 w-[168px] text-xs"}
          aria-label="Ganti role pengguna"
        >
          <SelectValue />
        </SelectTrigger>

        <SelectContent>
          {ROLES.map((item) => (
            <SelectItem key={item} value={item} className="text-sm">
              {ROLE_LABELS[item]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
