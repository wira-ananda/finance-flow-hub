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
import type { BusinessUnit } from "@/types";
import type { BusinessUnitInput } from "@/services/business-unit.service";

interface BusinessUnitDialogProps {
  open: boolean;
  unit?: BusinessUnit;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: BusinessUnitInput) => boolean;
}

export function BusinessUnitDialog({
  open,
  unit,
  onOpenChange,
  onSubmit,
}: BusinessUnitDialogProps) {
  const [code, setCode] = useState(unit?.code ?? "");

  const [name, setName] = useState(unit?.name ?? "");

  const [costCenter, setCostCenter] = useState(unit?.costCenter ?? "");

  const [managerName, setManagerName] = useState(unit?.managerName ?? "");

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!code.trim() || !name.trim() || !costCenter.trim() || !managerName.trim()) {
      setError("Seluruh informasi Unit Bisnis wajib diisi.");

      return;
    }

    const success = onSubmit({
      code,
      name,
      costCenter,
      managerName,
    });

    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{unit ? "Ubah Unit Bisnis" : "Tambah Unit Bisnis"}</DialogTitle>

          <DialogDescription>Atur identitas dan cost center Unit Bisnis.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <FormField label="Kode Unit" required>
            <Input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="MAW-LOG"
            />
          </FormField>

          <FormField label="Nama Unit Bisnis" required>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </FormField>

          <FormField label="Cost Center" required>
            <Input
              value={costCenter}
              onChange={(event) => setCostCenter(event.target.value)}
              placeholder="CC-1001"
            />
          </FormField>

          <FormField label="Nama Manajer" required>
            <Input value={managerName} onChange={(event) => setManagerName(event.target.value)} />
          </FormField>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>

          <Button onClick={handleSubmit}>{unit ? "Simpan Perubahan" : "Tambah Unit"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
