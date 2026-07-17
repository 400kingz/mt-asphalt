import {
  LayoutGrid,
  Layers,
  ShieldCheck,
  Waypoints,
  CircleDot,
  SignpostBig,
  Mountain,
  Truck,
  Ruler,
  Hammer,
  Construction,
  Droplets,
  type LucideIcon,
} from "lucide-react";

export const serviceIcons: Record<string, LucideIcon> = {
  LayoutGrid,
  Layers,
  ShieldCheck,
  Waypoints,
  CircleDot,
  SignpostBig,
  Mountain,
  Truck,
  Ruler,
  Hammer,
  Construction,
  Droplets,
};

export const serviceIconKeys = Object.keys(serviceIcons);

export function getServiceIcon(key: string): LucideIcon {
  return serviceIcons[key] ?? Construction;
}
