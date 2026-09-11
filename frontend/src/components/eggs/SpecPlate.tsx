import type { EggConfig } from "@/lib/api";

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

/** The egg's metadata, as one quiet secondary line under its name. */
export function SpecPlate({ egg, className }: { egg: EggConfig; className?: string }) {
  const segments = [
    capitalize(egg.source),
    egg.minecraft_version,
    egg.modloader && capitalize(egg.modloader),
    `Java ${egg.java_version}`,
  ].filter(Boolean);

  return (
    <p className={`text-xs text-muted-foreground ${className ?? ""}`}>{segments.join(" · ")}</p>
  );
}
