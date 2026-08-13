import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/app/actions/user-actions";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "@/components/sidebar-nav";
import {
  LogOut,
  User as UserIcon,
} from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen>
        <div className="flex h-screen w-screen overflow-hidden bg-background">
          {/* Sidebar */}
          <Sidebar collapsible="icon" className="border-r border-border/40">
            {/* Header */}
            <SidebarHeader className="h-16 flex items-center justify-center border-b border-border/40 px-6 group-data-[collapsible=icon]:px-0">
              <div className="flex items-center gap-2.5 w-full justify-start group-data-[collapsible=icon]:justify-center">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-background border border-border/40 p-1 shadow-sm">
                  <div className="relative w-full h-full">
                    <Image
                      src="/images/Logo-BSG.png"
                      alt="Logo Icon"
                      fill
                      className="object-contain dark:brightness-110"
                    />
                  </div>
                </div>
                <div className="flex flex-col truncate group-data-[collapsible=icon]:hidden">
                  <span className="font-bold text-sm leading-tight text-foreground">
                    E-Arsip BSG
                  </span>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                    Akuntansi & Keuangan
                  </span>
                </div>
              </div>
            </SidebarHeader>

            {/* Navigation links */}
            <SidebarContent className="py-4 px-3">
              <SidebarNav />
            </SidebarContent>

            {/* Footer Profile */}
            <SidebarFooter className="border-t border-border/40 p-4 group-data-[collapsible=icon]:px-0">
              <div className="flex flex-col gap-3">
                {/* Profile info */}
                <div className="flex items-center gap-3 justify-start group-data-[collapsible=icon]:justify-center">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground font-bold border border-border">
                    <UserIcon className="h-4.5 w-4.5" />
                  </div>
                  <div className="flex flex-col truncate group-data-[collapsible=icon]:hidden">
                    <span className="text-xs font-semibold text-foreground truncate">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground capitalize">
                      Administrator
                    </span>
                  </div>
                </div>

                {/* Logout Button */}
                <form action={logoutAction} className="w-full">
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
                  >
                    <LogOut className="mr-2 h-4 w-4 group-data-[collapsible=icon]:mr-0" />
                    <span className="group-data-[collapsible=icon]:hidden">
                      Keluar
                    </span>
                  </Button>
                </form>
              </div>
            </SidebarFooter>
          </Sidebar>

          {/* Main Inset content */}
          <SidebarInset className="flex flex-col flex-1 overflow-hidden bg-background">
            {/* Header topbar */}
            <header className="h-16 flex items-center justify-between border-b border-border/40 px-6 shrink-0 bg-background/95 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-semibold text-foreground">
                    Bank BSG
                  </span>
                  <span className="text-[9px] text-muted-foreground">
                    Kantor Pusat Manado
                  </span>
                </div>
              </div>
            </header>

            {/* Page content */}
            <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-background">
              <div className="max-w-7xl mx-auto space-y-6">
                {children}
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
