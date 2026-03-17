import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "subtle" | "custom"
  size?: "default" | "sm" | "lg" | "xs" | "icon"
  /** Color: puede ser predefinido, arbitrario (genera clases automáticamente), o personalizado completo */
  color?: string
  /** Color personalizado con clases CSS completas (máxima prioridad) */
  customColor?: string
  icon?: React.ReactNode
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "xs", color, customColor, icon, loading = false, children, ...props }, ref) => {
    // Variantes base
    const variants = {
      default: "bg-gray-300/10 hover:bg-gray-400/10 text-gray-700 dark:text-white",
      outline: "bg-gray-300/10 hover:bg-gray-400/10 text-gray-700 dark:text-white",
      ghost: "hover:bg-accent",
      subtle: "flex items-center gap-1.5 text-xs rounded-lg bg-[var(--background)]/50 hover:bg-[var(--background)]/70 text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-sm hover:shadow transition-all duration-200",
      custom: "", // Para colores personalizados
    }

    // Colores predefinidos (solo para variant="custom")
    const predefinedColors = {
      // Colores principales
      primary: "bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400",
      secondary: "bg-gray-500/10 hover:bg-gray-500/20 text-gray-600 dark:text-white/80",
      success: "bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400",
      warning: "bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
      danger: "bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400",

      // Colores básicos
      blue: "bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400",
      green: "bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400",
      red: "bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400",
      gray: "bg-gray-500/10 hover:bg-gray-500/20 text-gray-600 dark:text-gray-400",
      black: "bg-black/10 hover:bg-black/20 text-black dark:text-white",
      white: "bg-white/10 hover:bg-white/20 text-gray-900 dark:text-gray-100 border border-gray-200",

      // Colores extendidos
      orange: "bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400",
      yellow: "bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
      cyan: "bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400",
      emerald: "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
      purple: "bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400",
      pink: "bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-pink-400",
      indigo: "bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400",
      teal: "bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400",
      lime: "bg-lime-500/10 hover:bg-lime-500/20 text-lime-600 dark:text-lime-400",

      // Colores adicionales comunes
      violet: "bg-violet-500/10 hover:bg-violet-500/20 text-violet-600 dark:text-violet-400",
      fuchsia: "bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400",
      rose: "bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400",
      sky: "bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400",
      slate: "bg-slate-500/10 hover:bg-slate-500/20 text-slate-600 dark:text-slate-400",
      zinc: "bg-zinc-500/10 hover:bg-zinc-500/20 text-zinc-600 dark:text-zinc-400",
      neutral: "bg-neutral-500/10 hover:bg-neutral-500/20 text-neutral-600 dark:text-neutral-400",
      stone: "bg-stone-500/10 hover:bg-stone-500/20 text-stone-600 dark:text-stone-400",
    }

    // Tamaños con texto apropiado
    const sizes = {
      default: "h-6 px-3 py-1.5 text-xs gap-1.5",
      sm: "h-7 rounded-md px-3 text-xs",
      lg: "h-7 rounded-md px-8 text-xs",
      xs: variant === "subtle" ? "" : "h-8 px-3 py-1.5 text-xs gap-1.5",
      icon: "h-7 w-7",
    }

    // Clase base para todos los botones
    const baseClasses = "inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium shadow-sm hover:shadow transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 disabled:pointer-events-none disabled:opacity-50"

    // Función para generar clases CSS automáticamente para colores arbitrarios
    // Ejemplo: "random" → "bg-random-500/10 hover:bg-random-500/20 text-random-600 dark:text-random-400"
    const generateColorClasses = (colorName: string): string => {
      return `bg-${colorName}-500/10 hover:bg-${colorName}-500/20 text-${colorName}-600 dark:text-${colorName}-400`
    }

    // Determinar las clases finales
    let variantClasses = variants[variant]
    if (variant === "custom") {
      // Prioridad: customColor > color predefinido > color generado automáticamente
      if (customColor) {
        variantClasses = customColor //
      } else if (color) {
        // Verificar si es un color predefinido usando 'in' operator
        if (color in predefinedColors) {
          variantClasses = predefinedColors[color as keyof typeof predefinedColors] //
        } else {
          variantClasses = generateColorClasses(color) //
        }
      }
    } else if (color || customColor) {
      // Para otros variants (como subtle), aplicar colores si se especifican
      let colorClasses = ""
      if (customColor) {
        colorClasses = customColor
      } else if (color) {
        if (color in predefinedColors) {
          colorClasses = predefinedColors[color as keyof typeof predefinedColors]
        } else {
          colorClasses = generateColorClasses(color)
        }
      }
      // Combinar las clases de variant con las de color
      variantClasses = variantClasses + " " + colorClasses
    }

    return (
      <button
        className={cn(
          baseClasses,
          variantClasses,
          sizes[size],
          className
        )}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {(loading || icon) && (
          <span className="shrink-0">
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              icon
            )}
          </span>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
