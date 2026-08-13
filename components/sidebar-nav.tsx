"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderTree,
  FileSpreadsheet,
  Users,
  Building,
} from "lucide-react";

const navItems = [
  {
    title: "Ringkasan",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Lokasi Fisik",
    href: "/dashboard/locations",
    icon: FolderTree,
  },
  {
    title: "Arsip Nota",
    href: "/dashboard/vouchers",
    icon: FileSpreadsheet,
  },
  {
    title: "Kelola Divisi",
    href: "/dashboard/divisions",
    icon: Building,
  },
  {
    title: "Kelola User",
    href: "/dashboard/users",
    icon: Users,
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu className="gap-2">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href));

        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              tooltip={item.title}
              isActive={isActive}
              className={cn(
                "h-10 transition-all duration-200 rounded-xl px-3",
                isActive
                  ? "bg-primary! text-primary-foreground! shadow-sm shadow-primary/20 hover:bg-primary/90! hover:text-primary-foreground!"
                  : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
              )}
            >
              <Link href={item.href} className="flex items-center gap-3 w-full h-full">
                <item.icon
                  className={cn(
                    "h-4.5 w-4.5 transition-all duration-200 shrink-0",
                    isActive
                      ? "text-primary-foreground! scale-105"
                      : "text-muted-foreground group-hover/menu-button:text-foreground group-hover/menu-button:scale-105"
                  )}
                />
                <span className="group-data-[collapsible=icon]:hidden font-semibold">
                  {item.title}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
