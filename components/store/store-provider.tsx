"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { saveCart, setWishlistItem, syncCart, syncWishlist } from "@/app/actions/cart";

export type BagLine = { variantId: string; quantity: number };

type StoreContextValue = {
  ready: boolean;
  signedIn: boolean;
  lines: BagLine[];
  bagCount: number;
  addToBag: (variantId: string, quantity: number, label?: string) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  replaceVariant: (from: string, to: string) => void;
  removeFromBag: (variantId: string) => void;
  clearBag: () => void;
  bagOpen: boolean;
  setBagOpen: (open: boolean) => void;
  wishlist: string[];
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string, name?: string) => void;
};

const StoreContext = createContext<StoreContextValue | null>(null);

const BAG_KEY = "lobaloba.bag.v1";
const WISHLIST_KEY = "lobaloba.wishlist.v1";
const OWNER_KEY = "lobaloba.owner.v1";

const noopSubscribe = () => () => {};
const EMPTY_LINES: BagLine[] = [];
const EMPTY_IDS: string[] = [];

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  // false during SSR and hydration, true afterwards — gates UI that depends on localStorage.
  const ready = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [signedIn, setSignedIn] = useState(false);
  const [lines, setLines] = useState<BagLine[]>(() => (typeof window === "undefined" ? [] : read<BagLine[]>(BAG_KEY, [])));
  const [wishlist, setWishlist] = useState<string[]>(() => (typeof window === "undefined" ? [] : read<string[]>(WISHLIST_KEY, [])));
  const [bagOpen, setBagOpen] = useState(false);
  const signedInRef = useRef(false);
  const skipSave = useRef(true);

  // Load guest state from localStorage, then reconcile with the account on sign-in.
  useEffect(() => {
    const supabase = createClient();
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const userId = session?.user?.id ?? null;
      const owner = window.localStorage.getItem(OWNER_KEY);

      // Signed out (including server-side sign-out): forget the previous account's items.
      if (!userId) {
        if (owner || signedInRef.current) {
          window.localStorage.removeItem(OWNER_KEY);
          signedInRef.current = false;
          setSignedIn(false);
          skipSave.current = true;
          setLines([]);
          setWishlist([]);
        }
        return;
      }

      if ((event === "INITIAL_SESSION" || event === "SIGNED_IN") && !signedInRef.current) {
        signedInRef.current = true;
        setSignedIn(true);
        // Only merge a guest bag (no owner) into the account; never another account's items.
        const mergeLocal = !owner || owner === userId;
        window.localStorage.setItem(OWNER_KEY, userId);
        setTimeout(async () => {
          const merged = await syncCart(mergeLocal ? read<BagLine[]>(BAG_KEY, []) : []);
          if (merged) {
            skipSave.current = true;
            setLines(merged);
          }
          const ids = await syncWishlist(mergeLocal ? read<string[]>(WISHLIST_KEY, []) : []);
          if (ids) setWishlist(ids);
        }, 0);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Persist locally always; persist to the account (debounced) when signed in.
  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(BAG_KEY, JSON.stringify(lines));
    if (skipSave.current) {
      skipSave.current = false;
      return;
    }
    if (!signedInRef.current) return;
    const t = setTimeout(() => void saveCart(lines), 600);
    return () => clearTimeout(t);
  }, [lines, ready]);

  useEffect(() => {
    if (ready) window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist, ready]);

  const addToBag = useCallback((variantId: string, quantity: number, label?: string) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.variantId === variantId);
      if (existing) return prev.map((l) => (l.variantId === variantId ? { ...l, quantity: l.quantity + quantity } : l));
      return [...prev, { variantId, quantity }];
    });
    if (label) toast.success(`${label} added to your bag`);
    setBagOpen(true);
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0 ? prev.filter((l) => l.variantId !== variantId) : prev.map((l) => (l.variantId === variantId ? { ...l, quantity } : l)),
    );
  }, []);

  const replaceVariant = useCallback((from: string, to: string) => {
    setLines((prev) => {
      const line = prev.find((l) => l.variantId === from);
      if (!line || from === to) return prev;
      const target = prev.find((l) => l.variantId === to);
      const rest = prev.filter((l) => l.variantId !== from && l.variantId !== to);
      return [...rest, { variantId: to, quantity: line.quantity + (target?.quantity ?? 0) }];
    });
  }, []);

  const removeFromBag = useCallback((variantId: string) => setLines((prev) => prev.filter((l) => l.variantId !== variantId)), []);
  const clearBag = useCallback(() => setLines([]), []);

  const wishlistRef = useRef<string[]>([]);
  useEffect(() => {
    wishlistRef.current = wishlist;
  }, [wishlist]);

  const toggleWishlist = useCallback((productId: string, name?: string) => {
    const saved = !wishlistRef.current.includes(productId);
    setWishlist((prev) => (saved ? [productId, ...prev.filter((id) => id !== productId)] : prev.filter((id) => id !== productId)));
    if (signedInRef.current) void setWishlistItem(productId, saved);
    toast(saved ? `${name ?? "Item"} saved to your wishlist` : `${name ?? "Item"} removed from your wishlist`);
  }, []);

  const value = useMemo<StoreContextValue>(
    () => ({
      ready,
      signedIn,
      // Until hydrated, expose the same empty state the server rendered.
      lines: ready ? lines : EMPTY_LINES,
      bagCount: ready ? lines.reduce((s, l) => s + l.quantity, 0) : 0,
      addToBag,
      setQuantity,
      replaceVariant,
      removeFromBag,
      clearBag,
      bagOpen,
      setBagOpen,
      wishlist: ready ? wishlist : EMPTY_IDS,
      isWishlisted: (id) => ready && wishlist.includes(id),
      toggleWishlist,
    }),
    [ready, signedIn, lines, addToBag, setQuantity, replaceVariant, removeFromBag, clearBag, bagOpen, wishlist, toggleWishlist],
  );

  return <StoreContext value={value}>{children}</StoreContext>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
