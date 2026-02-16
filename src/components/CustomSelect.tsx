"use client";

import { useState, useRef, useEffect } from "react";
import { DefaultIcon } from "./Icons";

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: {
        value: string;
        label: string;
        icon?: React.ComponentType<{ className?: string }>;
    }[];
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export function CustomSelect({
    value,
    onChange,
    options,
    placeholder = "Select...",
    className = "",
    disabled = false,
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSelect = (optionValue: string) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    const SelectedIcon = selectedOption?.icon || DefaultIcon;

    return (
        <div
            ref={containerRef}
            className={`relative ${className} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className="w-full bg-white/40 border border-[var(--gunmetal-gray)]/30 rounded-lg py-2.5 px-4 flex items-center justify-between cursor-pointer hover:bg-white/60 transition-all"
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    <SelectedIcon className="text-lg opacity-80 shrink-0" />
                    <span className="text-sm font-medium text-[var(--obsidian-black)] truncate">
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                </div>
                <span className="material-symbols-outlined text-[var(--gunmetal-gray)] text-xl">
                    arrow_drop_down
                </span>
            </div>

            {isOpen && !disabled && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[var(--gunmetal-gray)]/20 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto">
                    {options.map((option) => {
                        const Icon = option.icon || DefaultIcon;
                        return (
                            <div
                                key={option.value}
                                onClick={() => handleSelect(option.value)}
                                className={`px-4 py-2.5 flex items-center gap-3 cursor-pointer transition-colors ${option.value === value
                                        ? "bg-[var(--nvidia-green)]/10 text-[var(--nvidia-green)] font-semibold"
                                        : "hover:bg-gray-50 text-[var(--obsidian-black)]"
                                    }`}
                            >
                                <Icon
                                    className={`text-lg shrink-0 ${option.value === value ? "text-[var(--nvidia-green)]" : "text-gray-400"
                                        }`}
                                />
                                <span className="text-sm truncate">{option.label}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
