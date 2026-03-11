/**
 * @file UI component library entrypoint.
 *
 * Re-exports all shadcn/ui components, utilities, and hooks.
 */

export * from "./components/alert-dialog";
export * from "./components/avatar";
export * from "./components/badge";
export * from "./components/button";
export * from "./components/card";
export * from "./components/checkbox";
export * from "./components/dialog";
export * from "./components/dropdown-menu";
export * from "./components/input";
export * from "./components/label";
export * from "./components/progress";
export * from "./components/radio-group";
export * from "./components/scroll-area";
export * from "./components/select";
export * from "./components/separator";
export * from "./components/skeleton";
export * from "./components/sonner";
export * from "./components/switch";
export * from "./components/tabs";
export * from "./components/textarea";
export * from "./components/tooltip";

// Export chart components
export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
} from "./components/chart";
export type { ChartConfig } from "./components/chart";

// Export utilities
export * from "./lib/utils";

// Export hooks
