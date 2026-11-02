"use client";

import { useEffect } from "react";
import { useStore } from "@/components/store/store-provider";

export function ClearBag() {
  const { clearBag, ready } = useStore();
  useEffect(() => {
    if (ready) clearBag();
  }, [ready, clearBag]);
  return null;
}
