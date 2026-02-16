"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navigation() {
    const pathname = usePathname();

    const getLinkClass = (path: string) => {
        const isActive = pathname === path;
        const baseClass =
            "text-sm font-bold uppercase tracking-widest transition-all";
        if (isActive) {
            return `${baseClass} text-[var(--accent-blue)] border-b-2 border-[var(--accent-blue)] pb-1`;
        }
        return `${baseClass} text-[var(--obsidian-black)] hover:text-[var(--obsidian-black)]`;
    };

    return (
        <header className="flex items-center justify-center py-6 z-50 relative">
            <nav className="flex items-center gap-10">
                <Link className={getLinkClass("/")} href="/">
                    Configuración
                </Link>
                <Link className={getLinkClass("/designer")} href="/designer">
                    Agente
                </Link>
                <Link className={getLinkClass("/index")} href="/index">
                    Embeddings
                </Link>
            </nav>
        </header>
    );
}
