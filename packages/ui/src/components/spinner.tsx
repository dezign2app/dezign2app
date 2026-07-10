import { cn } from "@workspace/ui/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import { Loading03Icon } from "@hugeicons/core-free-icons"

// Cast required due to csstype version mismatch between @hugeicons/react (3.1.x) and @types/react@19 (3.2.x)
const HugeIcon = HugeiconsIcon as React.ElementType

function Spinner({ className }: { className?: string }) {
  return (
    <HugeIcon icon={Loading03Icon} strokeWidth={2} role="status" aria-label="Loading" className={cn("size-4 animate-spin", className)} />
  )
}

export { Spinner }
