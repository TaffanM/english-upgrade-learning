"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function HeaderAuthButton({
  variant = "sm",
  className = "",
}: {
  variant?: "sm" | "lg";
  className?: string;
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session } }) => {
        setIsAuthenticated(Boolean(session?.user));
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setIsAuthenticated(Boolean(session?.user));
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  if (variant === "lg") {
    return (
      <Button asChild size="lg" className={`px-8 ${className}`}>
        <Link href={isAuthenticated ? "/dashboard" : "/login"}>
          {isAuthenticated ? (
            <>
              Resume Your Challenge <ArrowRight className="ml-2 size-4" />
            </>
          ) : (
            <>
              Enter Learner Space <ArrowRight className="ml-2 size-4" />
            </>
          )}
        </Link>
      </Button>
    );
  }

  return (
    <Button asChild size="sm" className={className}>
      <Link href={isAuthenticated ? "/dashboard" : "/login"}>
        {isAuthenticated ? (
          <>
            Dashboard <ArrowRight className="ml-1.5 size-4" />
          </>
        ) : (
          "Learner Sign In"
        )}
      </Link>
    </Button>
  );
}
