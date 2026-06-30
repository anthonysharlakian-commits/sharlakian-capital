import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-[family-name:var(--font-dm,'DM_Sans',sans-serif)] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--gold)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--gold)] text-[var(--bg-base)] hover:bg-[var(--gold)]/90 rounded-[2px] control-text font-normal tracking-wide",
        destructive:
          "bg-[var(--red)] text-[var(--text-primary)] hover:bg-[var(--red)]/90 rounded-[2px] control-text",
        outline:
          "border border-[var(--border)] bg-transparent text-[var(--text-muted)] hover:bg-[rgba(201,168,76,0.06)] hover:text-[var(--text-secondary)] rounded-[2px] control-text font-light",
        secondary:
          "bg-[rgba(201,168,76,0.08)] text-[var(--text-secondary)] hover:bg-[rgba(201,168,76,0.12)] rounded-[2px] control-text font-light",
        ghost:
          "text-[var(--text-muted)] hover:bg-[rgba(201,168,76,0.06)] hover:text-[var(--text-secondary)] rounded-[2px] control-text font-light",
        link: "text-[var(--gold)] underline-offset-4 hover:underline control-text",
        approve:
          "bg-[var(--green)] text-[var(--bg-base)] hover:bg-[var(--green)]/90 rounded-[2px] control-text font-normal",
        reject:
          "bg-[var(--red)] text-[var(--text-primary)] hover:bg-[var(--red)]/90 rounded-[2px] control-text font-normal",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 caption-sm",
        lg: "h-11 px-8 body-text",
        xl: "h-12 px-10 body-text",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
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
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
