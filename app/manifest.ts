import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lobaloba Deluxe",
    short_name: "Lobaloba",
    description: "Premium bridal lace, crystal fabrics, Asoebi and accessories.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf6ef",
    theme_color: "#6e1f2f",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
