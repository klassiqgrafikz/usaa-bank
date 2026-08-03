"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function EnsureData() {
  const router = useRouter();
  const supabase = createClient();
  const ran = useRef(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      try {
        const { data: accounts } = await supabase
          .from("accounts")
          .select("id")
          .limit(1);
        if (accounts && accounts.length > 0) return;

        setStatus("Setting up your accounts…");
        const { error } = await supabase.rpc("ensure_member_data");
        if (!error) {
          router.refresh();
        } else {
          setStatus(null);
          console.error("ensure_member_data failed:", error.message);
        }
      } catch (err) {
        console.error("EnsureData:", err);
      }
    })();
  }, [supabase, router]);

  if (!status) return null;

  return (
    <div className="mb-4 rounded-md border border-usaa-200 bg-usaa-50 px-4 py-3 text-sm font-medium text-usaa-800">
      {status}
    </div>
  );
}
