import { useTheme } from "nextra-theme-docs";
import React, { useEffect, useRef, useState } from "react";

interface MermaidDiagramProps {
    id: string;
    content: string;
}

const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ id, content }) => {
    const { resolvedTheme } = useTheme();
    const [rendered, setRendered] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDark = resolvedTheme === "dark";

    useEffect(() => {
        // Dynamic import of mermaid
        import("mermaid").then((mermaid) => {
            mermaid.default.initialize({
                startOnLoad: true,
                theme: isDark ? "dark" : "default",
                flowchart: {
                    useMaxWidth: true,
                    htmlLabels: true,
                },
                sequence: {
                    diagramMarginX: 50,
                    diagramMarginY: 10,
                    actorMargin: 80,
                    width: 150,
                    height: 65,
                    boxMargin: 10,
                    boxTextMargin: 5,
                    noteMargin: 10,
                    messageMargin: 35,
                    mirrorActors: true,
                },
                class: {
                    diagramPadding: 8,
                    useMaxWidth: true,
                },
            });

            try {
                mermaid.default
                    .render(`mermaid-${id}`, content)
                    .then(({ svg }) => {
                        setRendered(svg);
                    });
            } catch (error) {
                console.error("Error rendering mermaid diagram:", error);
                setRendered(
                    `<div class="p-4 text-red-500">Error rendering diagram</div>`
                );
            }
        });
    }, [content, id, isDark]);

    useEffect(() => {
        // Re-render when theme changes
        if (rendered && containerRef.current) {
            containerRef.current.innerHTML = rendered;
        }
    }, [rendered]);

    return (
        <div className="my-8 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4 shadow-sm">
            <div ref={containerRef} className="mermaid flex justify-center" />
        </div>
    );
};

export default MermaidDiagram;
