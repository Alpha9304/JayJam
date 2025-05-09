"use client"

import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useTitleStore } from "@/store/use-title-store"
import { useEffect } from "react"

interface RouteTitleProps {
  className?: string
}

export function RouteTitle({ className }: RouteTitleProps) {
  const pathname = usePathname()
  const { title, resetTitle } = useTitleStore()
  
  // Reset title when route changes
  useEffect(() => {
    return () => resetTitle()
  }, [pathname, resetTitle])
  
  // Map routes to their respective titles
  const getTitleFromPath = (path: string) => {
    // Remove leading slash and split by slashes
    const segments = path.split("/").filter(Boolean)
    
    // Handle root dashboard
    if (segments.length === 0) {
      return "Dashboard"
    }
    
    // Handle specific routes
    switch(segments[0]) {
      case "class-groups":
        return "Class Groups"
      case "calendar":
        return "Calendar"
      default:
        // Convert path segment to title case
        return segments[segments.length - 1]
          .split("-")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
    }
  }
  
  // Use custom title from store if provided, otherwise generate from path
  const displayTitle = title || getTitleFromPath(pathname)
  
  return (
    <h1 className={cn("text-xl font-semibold", className)}>
      {displayTitle}
    </h1>
  )
}

// Hook to set page title from any component
export function usePageTitle(title: string) {
  const { setTitle } = useTitleStore()
  
  useEffect(() => {
    setTitle(title)
    
    // Clean up when component unmounts
    return () => setTitle(null)
  }, [title, setTitle])
} 