"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";

export function SettingsSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="sm"
      disabled={pending}
      className="rounded-xl font-medium pressable"
    >
      {pending ? (
        <>
          <Loader2 className="size-3.5 mr-1.5 animate-spin" />
          <span>Saving Profile...</span>
        </>
      ) : (
        <>
          <Save className="size-3.5 mr-1.5" />
          <span>Save Changes</span>
        </>
      )}
    </Button>
  );
}
