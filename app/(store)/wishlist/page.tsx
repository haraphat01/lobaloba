import type { Metadata } from "next";
import { WishlistView } from "@/components/store/wishlist-view";

export const metadata: Metadata = { title: "Your wishlist", robots: { index: false } };

export default function WishlistPage() {
  return (
    <div className="container-x py-12">
      <h1 className="text-5xl">Wishlist</h1>
      <WishlistView />
    </div>
  );
}
