import { useState } from "react";

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
import { FormField } from "@/components/common/FormField";
import { ROLE_LABELS } from "@/constants/status";
import type { BusinessUnit, User, UserRole } from "@/types";
import type { UserInput } from "@/services/user.service";

interface UserDialogProps {
  open: boolean;
  user?: User;
  units: BusinessUnit[];
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: UserInput) => boolean;
}

const ROLES: UserRole[] = ["UNIT_USER", "FINANCE_REVIEWER", "FINANCE_PAYMENT", "ADMIN"];

export function UserDialog({ open, user, units, onOpenChange, onSubmit }: UserDialogProps) {
  const [name, setName] = useState(user?.name ?? "");

  const [email, setEmail] = useState(user?.email ?? "");

  const [role, setRole] = useState<UserRole>(user?.role ?? "UNIT_USER");

  const [jobTitle, setJobTitle] = useState(user?.jobTitle ?? "");

  const [businessUnitId, setBusinessUnitId] = useState(user?.businessUnitId ?? "");

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!name.trim() || !email.trim() || !jobTitle.trim()) {
      setError("Nama, email, dan jabatan wajib diisi.");

      return;
    }

    if (role === "UNIT_USER" && !businessUnitId) {
      setError("Unit Bisnis wajib dipilih.");

      return;
    }

    const success = onSubmit({
      name,
      email,
      role,
      jobTitle,

      businessUnitId: role === "UNIT_USER" ? businessUnitId : null,
    });

    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{user ? "Ubah Pengguna" : "Tambah Pengguna"}</DialogTitle>

          <DialogDescription>Atur identitas, role, dan konteks akses pengguna.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <FormField label="Nama" required>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </FormField>

          <FormField label="Email" required>
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </FormField>

          <FormField label="Role" required>
            <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {ROLES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {ROLE_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {role === "UNIT_USER" ? (
            <FormField label="Unit Bisnis" required>
              <Select value={businessUnitId} onValueChange={setBusinessUnitId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Unit Bisnis" />
                </SelectTrigger>

                <SelectContent>
                  {units
                    .filter((unit) => unit.active)
                    .map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </FormField>
          ) : null}

          <FormField label="Jabatan" required>
            <Input value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} />
          </FormField>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>

          <Button onClick={handleSubmit}>{user ? "Simpan Perubahan" : "Tambah Pengguna"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
