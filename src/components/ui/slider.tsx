import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    trackColor?: "amber" | "teal";
  }
>(({ className, trackColor = "amber", ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn("relative flex w-full touch-none select-none items-center", className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1 w-full grow overflow-hidden rounded-none bg-bg-3">
      <SliderPrimitive.Range
        className={cn("absolute h-full", trackColor === "amber" ? "bg-amber" : "bg-teal")}
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className={cn(
        "block h-3.5 w-3.5 rounded-none border bg-bg-0 transition-colors focus-visible:outline-none disabled:pointer-events-none",
        trackColor === "amber" ? "border-amber" : "border-teal"
      )}
    />
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
