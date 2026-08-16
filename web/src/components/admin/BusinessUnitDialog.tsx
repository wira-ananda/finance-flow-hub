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

import type { BusinessUnitInput } from "@/services/business-unit.service";

import type { BusinessUnit } from "@/types";

interface BusinessUnitDialogProps {
  open: boolean;

  unit?: BusinessUnit;

  onOpenChange: (open: boolean) => void;

  onSubmit: (input: BusinessUnitInput) => boolean | Promise<boolean>;
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

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isSubmitting) {
      onOpenChange(nextOpen);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    const input: BusinessUnitInput = {
      code: code.trim().toUpperCase(),

      name: name.trim(),

      costCenter: costCenter.trim(),

      managerName: managerName.trim(),
    };

    if (!input.code || !input.name || !input.costCenter || !input.managerName) {
      setError("Seluruh informasi Unit Bisnis wajib diisi.");

      return;
    }

    if (!/^[A-Z0-9][A-Z0-9_-]{1,29}$/.test(input.code)) {
      setError("Kode Unit hanya boleh berisi huruf kapital, angka, tanda hubung, atau underscore.");

      return;
    }

    setError(null);

    setIsSubmitting(true);

    try {
      const success = await onSubmit(input);

      if (success) {
        onOpenChange(false);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unit Bisnis gagal disimpan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{unit ? "Ubah Unit Bisnis" : "Tambah Unit Bisnis"}</DialogTitle>

          <DialogDescription>
            Atur identitas, cost center, dan penanggung jawab Unit Bisnis.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <FormField label="Kode Unit" htmlFor="business-unit-code" required hint="Contoh: MAW-LOG">
            <Input
              id="business-unit-code"
              value={code}
              disabled={isSubmitting}
              onChange={(event) => {
                setCode(event.target.value.toUpperCase());

                setError(null);
              }}
              placeholder="MAW-LOG"
              maxLength={30}
            />
          </FormField>

          <FormField label="Nama Unit Bisnis" htmlFor="business-unit-name" required>
            <Input
              id="business-unit-name"
              value={name}
              disabled={isSubmitting}
              onChange={(event) => {
                setName(event.target.value);

                setError(null);
              }}
            />
          </FormField>

          <FormField label="Cost Center" htmlFor="business-unit-cost-center" required>
            <Input
              id="business-unit-cost-center"
              value={costCenter}
              disabled={isSubmitting}
              onChange={(event) => {
                setCostCenter(event.target.value);

                setError(null);
              }}
              placeholder="CC-1001"
            />
          </FormField>

          <FormField label="Nama Manajer" htmlFor="business-unit-manager" required>
            <Input
              id="business-unit-manager"
              value={managerName}
              disabled={isSubmitting}
              onChange={(event) => {
                setManagerName(event.target.value);

                setError(null);
              }}
            />
          </FormField>

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
            {isSubmitting ? "Menyimpan..." : unit ? "Simpan Perubahan" : "Tambah Unit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
