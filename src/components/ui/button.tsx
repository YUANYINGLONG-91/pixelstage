import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-150 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-amber text-[#1A1206] font-semibold pixel-notch hover:bg-amber-hover hover:-translate-y-px active:translate-y-px",
        secondary:
          "bg-bg-2 border border-border text-text-1 rounded hover:bg-bg-3 hover:border-border-strong",
        ghost:
          "text-text-2 rounded hover:text-amber hover:underline underline-offset-4",
        danger:
          "bg-bg-2 border border-border text-danger rounded hover:bg-danger/10 hover:border-danger",
        outline:
          "border border-border bg-transparent text-text-1 rounded hover:bg-bg-3 hover:border-border-strong",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 text-xs",
        xs: "h-7 px-2 text-xs rounded-sm",
        icon: "h-8 w-8 rounded",
      },
    },
    defaultVariants: { variant: "secondary", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
