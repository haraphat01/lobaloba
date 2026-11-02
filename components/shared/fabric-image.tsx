import Image, { type ImageProps } from "next/image";

type Props = Omit<ImageProps, "src" | "alt"> & { src: string | null | undefined; alt: string };

/** next/image wrapper that falls back to a branded placeholder and serves SVG artwork unoptimised. */
export function FabricImage({ src, alt, ...rest }: Props) {
  const url = src || "/placeholder.svg";
  return <Image src={url} alt={alt} unoptimized={url.endsWith(".svg")} {...rest} />;
}
