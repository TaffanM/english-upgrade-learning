"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function LoginSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      disabled={pending}
      className="w-full pressable rounded-xl font-bold flex items-center justify-center gap-2"
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          <span>Signing In to Challenge...</span>
        </>
      ) : (
        <span>Sign In to Challenge 🚀</span>
      )}
    </Button>
  );
}
