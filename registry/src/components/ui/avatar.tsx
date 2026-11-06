import * as React from "react"
import { cn } from "@/lib/utils"
import { Avatar as AvatarPrimitive } from "radix-ui"

/**
 * Per-user pastel swatches (`--avatar-1` … `--avatar-10` in the theme), as
 * literal classes so Tailwind generates them.
 */
const AVATAR_TONES = [
  "bg-avatar-1",
  "bg-avatar-2",
  "bg-avatar-3",
  "bg-avatar-4",
  "bg-avatar-5",
  "bg-avatar-6",
  "bg-avatar-7",
  "bg-avatar-8",
  "bg-avatar-9",
  "bg-avatar-10",
]

function seedFromId(id: number | string): number | null {
  if (typeof id === "number") {
    return Number.isNaN(id) ? null : id
  }

  const trimmed = id.trim()

  if (trimmed === "") {
    return null
  }

  const asNumber = Number(trimmed)

  if (Number.isFinite(asNumber)) {
    return asNumber
  }

  let hash = 0

  for (let i = 0; i < trimmed.length; i++) {
    hash = (Math.imul(31, hash) + trimmed.charCodeAt(i)) | 0
  }

  return hash
}

/**
 * Stable swatch class for a user (or group) id: numeric ids use abs(id) % 10,
 * other strings are hashed first. Undefined when there is no id.
 */
function avatarToneForId(id?: number | string | null): string | undefined {
  if (id === undefined || id === null) {
    return undefined
  }

  const seed = seedFromId(id)

  return seed === null
    ? AVATAR_TONES[0]
    : AVATAR_TONES[Math.abs(seed) % AVATAR_TONES.length]
}

const AvatarToneContext = React.createContext<string | undefined>(undefined)

function Avatar({
  className,
  size = "default",
  userId,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & {
  size?: "default" | "sm" | "lg"
  /** Colours the fallback with the user's stable swatch (qiick). */
  userId?: number | string | null
}) {
  return (
    <AvatarToneContext.Provider value={avatarToneForId(userId)}>
      <AvatarPrimitive.Root
        data-slot="avatar"
        data-size={size}
        className={cn(
          "group/avatar relative flex size-8 shrink-0 overflow-hidden rounded-full select-none data-[size=lg]:size-10 data-[size=sm]:size-6",
          className
        )}
        {...props}
      />
    </AvatarToneContext.Provider>
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  const tone = React.useContext(AvatarToneContext)

  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "flex size-full items-center justify-center rounded-full text-sm group-data-[size=sm]/avatar:text-xs",
        tone ? `${tone} text-avatar-foreground` : "bg-muted text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="avatar-badge"
      className={cn(
        "absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground ring-2 ring-background select-none",
        "group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden",
        "group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2",
        "group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2",
        className
      )}
      {...props}
    />
  )
}

function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group"
      className={cn(
        "group/avatar-group flex -space-x-2 *:data-[slot=avatar]:ring-2 *:data-[slot=avatar]:ring-background",
        className
      )}
      {...props}
    />
  )
}

function AvatarGroupCount({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="avatar-group-count"
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground ring-2 ring-background group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=sm]/avatar-group:size-6 [&>svg]:size-4 group-has-data-[size=lg]/avatar-group:[&>svg]:size-5 group-has-data-[size=sm]/avatar-group:[&>svg]:size-3",
        className
      )}
      {...props}
    />
  )
}

export {
  Avatar,
  AvatarImage,
  AvatarFallback,
  AvatarBadge,
  AvatarGroup,
  AvatarGroupCount,
  avatarToneForId,
}
