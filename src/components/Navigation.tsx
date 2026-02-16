"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navigation() {
    const pathname = usePathname();

    const getLinkClass = (path: string) => {
        const isActive = pathname === path;
        const baseClass =
            "text-xs font-bold uppercase tracking-widest transition-all";
        if (isActive) {
            return `${baseClass} text-[var(--nvidia-green)] border-b-2 border-[var(--nvidia-green)] pb-1`;
        }
        return `${baseClass} text-[var(--gunmetal-gray)] hover:text-[var(--obsidian-black)]`;
    };

    return (
        <header className="flex items-center justify-center py-6 z-50 relative">
            <nav className="flex items-center gap-10">
                <Link className={getLinkClass("/")} href="/">
                    Root
                </Link>
                <Link className={getLinkClass("/designer")} href="/designer">
                    Designer
                </Link>
                <Link className={getLinkClass("/index")} href="/index">
                    Index
                </Link>
            </nav>
        </header>
    );
}
