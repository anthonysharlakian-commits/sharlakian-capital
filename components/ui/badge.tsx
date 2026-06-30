import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

const badgeVariants = cva(
  "inline-flex items-center rounded-[2px] border px-1.5 py-0.5 caption-xs tracking-wide",
  {
    variants: {
      variant: {
        default: "border-[var(--border)] bg-[rgba(201,168,76,0.12)] text-[var(--gold)]",
        secondary: "border-[var(--border)] bg-[rgba(201,168,76,0.06)] text-[var(--text-muted)]",
        outline: "border-[var(--border)] text-[var(--text-secondary)]",
        success: "border-[rgba(0,201,122,0.3)] bg-[rgba(0,201,122,0.08)] text-[var(--green)]",
        warning: "border-[rgba(201,168,76,0.3)] bg-[rgba(201,168,76,0.08)] text-[var(--gold)]",
        danger: "border-[rgba(224,82,82,0.3)] bg-[rgba(224,82,82,0.08)] text-[var(--red)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
