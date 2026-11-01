"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut } from "lucide-react";

export function SignOutButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      variant="ghost"
      size="sm"
      type="submit"
      disabled={pending}
      className="text-xs text-muted-foreground hover:text-foreground rounded-xl"
      title="Sign Out"
    >
      {pending ? (
        <>
          <Loader2 className="size-3.5 mr-1 animate-spin" />
          <span className="hidden sm:inline">Signing out...</span>
        </>
      ) : (
        <>
          <LogOut className="size-3.5 mr-1" />
          <span className="hidden sm:inline">Sign Out</span>
        </>
      )}
    </Button>
  );
}
