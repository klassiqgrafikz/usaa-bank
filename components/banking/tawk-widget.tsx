"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function TawkWidget() {
  useEffect(() => {
    let disposed = false;
    let script: HTMLScriptElement | null = null;

    createClient()
      .from("app_settings")
      .select("tawk_enabled, tawk_property_id, tawk_widget_id, tawk_full_link")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        if (disposed || !data?.tawk_enabled) return;
        const src =
          data.tawk_full_link ||
          (data.tawk_property_id && data.tawk_widget_id
            ? `https://embed.tawk.to/${data.tawk_property_id}/${data.tawk_widget_id}`
            : null);
        if (!src) return;
        script = document.createElement("script");
        script.async = true;
        script.src = src;
        script.setAttribute("charset", "UTF-8");
        script.setAttribute(
          "crossorigin",
          "*",
        );
        document.body.appendChild(script);
      });

    return () => {
      disposed = true;
      script?.remove();
    };
  }, []);

  return null;
}
