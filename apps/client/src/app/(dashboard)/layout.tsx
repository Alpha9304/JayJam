"use client"

import CustomSidebar from "@/components/custom-sidebar"
import { RouteTitle } from "@/components/route-title"
import { Separator } from "@/components/ui/separator"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { usePing } from "@/hooks/auth/use-ping"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Initialize user data
    usePing();

    return (
      <div className="flex">
        <SidebarProvider>
          <CustomSidebar />
          <main className="flex flex-col flex-1 overflow-hidden">
            <div className="flex justify-start items-center w-full rounded-md border p-4">
              <SidebarTrigger />
              <Separator orientation="vertical" className="gap-6 mx-4"/>
              <RouteTitle />
            </div>
            {children}
          </main>
        </SidebarProvider>
      </div>
    )
}