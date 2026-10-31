import * as React from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-xl font-medium whitespace-nowrap transition-all outline-none select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 pressable active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 hover:shadow-sm",
        outline:
          "border border-border/80 bg-card hover:bg-muted/80 hover:text-foreground text-foreground shadow-2xs",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-muted/70 hover:text-foreground text-foreground",
        destructive:
          "bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20",
        link: "text-primary underline-offset-4 hover:underline",
        playful:
          "bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-sm hover:from-amber-600 hover:to-orange-600 hover:shadow-md",
      },
      size: {
        default: "h-9 gap-2 px-4 text-sm",
        xs: "h-6 gap-1 px-2.5 text-xs rounded-lg [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 px-3 text-xs rounded-lg",
        lg: "h-11 gap-2 px-6 text-sm md:text-base rounded-2xl font-semibold shadow-xs",
        icon: "size-9 rounded-xl",
        "icon-sm": "size-7 rounded-lg",
        "icon-lg": "size-11 rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: ButtonProps) {
  if (asChild && React.isValidElement(props.children)) {
    const child = props.children as React.ReactElement<{ className?: string }>
    return React.cloneElement(child, {
      className: cn(buttonVariants({ variant, size, className }), child.props.className),
    })
  }

  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
