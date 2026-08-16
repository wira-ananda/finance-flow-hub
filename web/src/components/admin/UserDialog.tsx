import { useState } from "react";

import { FormField } from "@/components/common/FormField";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ROLE_LABELS } from "@/constants/status";

import type { UserInput } from "@/services/user.service";
import type { BusinessUnit, User, UserRole } from "@/types";

interface UserDialogProps {
  open: boolean;

  user?: User;

  currentUserId: string;

  units: BusinessUnit[];

  onOpenChange: (open: boolean) => void;

  onSubmit: (input: UserInput) => boolean | Promise<boolean>;
}

/**
 * Role yang boleh diberikan melalui User Management.
 *
 * ADMIN sengaja tidak tersedia karena sistem hanya memiliki
 * satu bootstrap Administrator.
 */
const MANAGEABLE_ROLES: UserRole[] = ["UNIT_USER", "FINANCE_REVIEWER", "FINANCE_PAYMENT"];

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function UserDialog({
  open,
  user,
  currentUserId,
  units,
  onOpenChange,
  onSubmit,
}: UserDialogProps) {
  const [name, setName] = useState(user?.name ?? "");

  const [email, setEmail] = useState(user?.email ?? "");

  const [role, setRole] = useState<UserRole>(user?.role ?? "UNIT_USER");

  const [jobTitle, setJobTitle] = useState(user?.jobTitle ?? "");

  const [businessUnitId, setBusinessUnitId] = useState(user?.businessUnitId ?? "");

  const [error, setError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = Boolean(user);

  const isAdministrator = user?.role === "ADMIN";

  const isEditingSelf = user?.id === currentUserId;

  const activeUnits = units.filter((unit) => unit.active);

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting) {
      return;
    }

    onOpenChange(nextOpen);
  };

  const handleRoleChange = (value: string) => {
    const nextRole = value as UserRole;

    /*
     * Guard frontend tambahan.
     * ADMIN tidak pernah tersedia dalam Select,
     * tetapi tetap dijaga agar state tidak menerima ADMIN.
     */
    if (!MANAGEABLE_ROLES.includes(nextRole)) {
      return;
    }

    setRole(nextRole);

    setError(null);

    if (nextRole !== "UNIT_USER") {
      setBusinessUnitId("");
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    const normalizedName = name.trim();

    const normalizedEmail = email.trim().toLowerCase();

    const normalizedJobTitle = jobTitle.trim();

    if (!normalizedName || !normalizedEmail || !normalizedJobTitle) {
      setError("Nama, email, dan jabatan wajib diisi.");

      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      setError("Format email tidak valid.");

      return;
    }

    /*
     * Saat create, ADMIN tidak boleh masuk ke payload.
     */
    if (!isEditMode && !MANAGEABLE_ROLES.includes(role)) {
      setError("Role Administrator tidak dapat dibuat melalui User Management.");

      return;
    }

    /*
     * Existing ADMIN harus tetap ADMIN.
     */
    if (isAdministrator && role !== "ADMIN") {
      setError("Role Administrator utama tidak dapat diubah.");

      return;
    }

    if (role === "UNIT_USER" && !businessUnitId) {
      setError("Unit Bisnis wajib dipilih untuk role Unit Bisnis.");

      return;
    }

    setError(null);

    setIsSubmitting(true);

    try {
      const success = await onSubmit({
        name: normalizedName,

        email: normalizedEmail,

        /*
         * Existing ADMIN selalu dikirim sebagai ADMIN.
         * User lain hanya dapat memakai MANAGEABLE_ROLES.
         */
        role: isAdministrator ? "ADMIN" : role,

        jobTitle: normalizedJobTitle,

        businessUnitId: role === "UNIT_USER" ? businessUnitId : null,
      });

      if (success) {
        onOpenChange(false);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Pengguna gagal disimpan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Ubah Pengguna" : "Tambah Pengguna"}</DialogTitle>

          <DialogDescription>
            {isAdministrator
              ? "Perbarui profil Administrator utama. Role Administrator dikunci karena sistem hanya memiliki satu Administrator."
              : "Atur identitas, role, Unit Bisnis, dan akses pengguna ke Finance Request."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <FormField label="Nama" htmlFor="managed-user-name" required>
            <Input
              id="managed-user-name"
              value={name}
              disabled={isSubmitting}
              onChange={(event) => {
                setName(event.target.value);

                if (error) {
                  setError(null);
                }
              }}
              placeholder="Nama lengkap pengguna"
            />
          </FormField>

          <FormField
            label="Email Google Account"
            htmlFor="managed-user-email"
            required
            hint={
              isAdministrator
                ? "Pastikan email tetap merupakan Google Account yang dapat Anda akses. Email ini digunakan saat Sign in with Google."
                : "Harus sama dengan Google Account yang digunakan saat Sign in with Google."
            }
          >
            <Input
              id="managed-user-email"
              type="email"
              autoComplete="off"
              value={email}
              disabled={isSubmitting}
              onChange={(event) => {
                setEmail(event.target.value);

                if (error) {
                  setError(null);
                }
              }}
              placeholder="nama@perusahaan.com"
            />
          </FormField>

          <FormField
            label="Role"
            required
            hint={isAdministrator ? "Role Administrator utama tidak dapat diubah." : undefined}
          >
            {isAdministrator ? (
              <Input value={ROLE_LABELS.ADMIN} disabled aria-label="Role Administrator" />
            ) : (
              <Select value={role} disabled={isSubmitting} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih role pengguna" />
                </SelectTrigger>

                <SelectContent>
                  {MANAGEABLE_ROLES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {ROLE_LABELS[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </FormField>

          {role === "UNIT_USER" ? (
            <FormField label="Unit Bisnis" required>
              <Select
                value={businessUnitId}
                disabled={isSubmitting}
                onValueChange={(value) => {
                  setBusinessUnitId(value);

                  if (error) {
                    setError(null);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Unit Bisnis" />
                </SelectTrigger>

                <SelectContent>
                  {activeUnits.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          ) : null}

          <FormField label="Jabatan" htmlFor="managed-user-job-title" required>
            <Input
              id="managed-user-job-title"
              value={jobTitle}
              disabled={isSubmitting}
              onChange={(event) => {
                setJobTitle(event.target.value);

                if (error) {
                  setError(null);
                }
              }}
              placeholder="Contoh: Finance Reviewer"
            />
          </FormField>

          {isAdministrator && isEditingSelf ? (
            <div className="rounded-lg border border-border bg-background-subtle px-3 py-2.5 text-xs leading-5 text-muted-foreground">
              Ini adalah akun Administrator utama yang sedang digunakan. Role dan status akses akun
              ini dikunci agar sistem tidak kehilangan akses Administrator.
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            Batal
          </Button>

          <Button type="button" disabled={isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? "Menyimpan..." : isEditMode ? "Simpan Perubahan" : "Tambah Pengguna"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
