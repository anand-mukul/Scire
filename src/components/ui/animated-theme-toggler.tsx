"use client";

import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function AnimatedThemeToggler() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleTheme = async (e: React.MouseEvent<HTMLButtonElement>) => {
        const newTheme = theme === "dark" ? "light" : "dark";

        if (!(document as any).startViewTransition) {
            setTheme(newTheme);
            return;
        }

        const x = e.clientX;
        const y = e.clientY;
        const endRadius = Math.hypot(
            Math.max(x, innerWidth - x),
            Math.max(y, innerHeight - y)
        );

        const transition = (document as any).startViewTransition(() => {
            setTheme(newTheme);
        });

        transition.ready.then(() => {
            const clipPath = [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`,
            ];

            document.documentElement.animate(
                {
                    clipPath: clipPath,
                },
                {
                    duration: 500,
                    easing: "ease-in-out",
                    pseudoElement: "::view-transition-new(root)",
                }
            );
        });
    };

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="w-9 h-9 opacity-0">
                <span className="sr-only">Toggle theme</span>
            </Button>
        );
    }

    return (
        <>
            <style jsx global>{`
        ::view-transition-old(root),
        ::view-transition-new(root) {
          animation: none;
          mix-blend-mode: normal;
        }
        ::view-transition-new(root) {
          z-index: 2147483646;
        }
        ::view-transition-old(root) {
          z-index: 1;
        }
      `}</style>
            <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="w-9 h-9 rounded-full bg-transparent hover:bg-muted transition-all"
            >
                <div className="relative w-full h-full flex items-center justify-center">
                    <Sun
                        className={`absolute h-[1.2rem] w-[1.2rem] transition-all duration-300 ${theme === "dark" ? "scale-0 -rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100 text-orange-600 dark:text-orange-400"
                            }`}
                    />
                    <Moon
                        className={`absolute h-[1.2rem] w-[1.2rem] transition-all duration-300 ${theme === "dark" ? "scale-100 rotate-0 opacity-100 text-orange-600 dark:text-orange-400" : "scale-0 rotate-90 opacity-0"
                            }`}
                    />
                </div>
                <span className="sr-only">Toggle theme</span>
            </Button>
        </>
    );
}
