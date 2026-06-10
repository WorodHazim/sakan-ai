"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, UserCircle, UploadCloud, PlayCircle } from "lucide-react";
import { useDemo } from "@/lib/demo-context";

export function DemoNav() {
  const pathname = usePathname();
  const { selectedCaseId, identitySource, identityVerified } = useDemo();

  const links = [
    { href: "/", label: "Landing", icon: PlayCircle },
    { href: "/portal", label: "Beneficiary", icon: UserCircle },
    { href: "/apply", label: "Apply", icon: UploadCloud },
    { href: "/officer/workspace", label: "Officer", icon: LayoutDashboard },
  ];

  let badgeLabel = "Demo: " + selectedCaseId;
  if (identityVerified) {
    if (identitySource === "UAE PASS Staging") {
      badgeLabel = "Real UAE PASS Staging Test";
    } else if (identitySource === "Demo UAE PASS Fallback") {
      badgeLabel = "Demo UAE PASS Fallback";
    }
  } else if (selectedCaseId.startsWith("CUSTOM")) {
    badgeLabel = "Demo: CUSTOM";
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-sakan-navy text-white px-4 py-2 rounded-full shadow-2xl flex items-center gap-4 border border-sakan-gold/30">
      <span className="text-xs font-semibold text-sakan-gold uppercase tracking-wider pr-2 border-r border-white/20">{badgeLabel}</span>
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-sakan-gold",
              isActive ? "text-sakan-gold" : "text-white/80"
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{link.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
