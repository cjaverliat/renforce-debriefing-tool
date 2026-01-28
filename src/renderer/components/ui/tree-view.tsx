"use client";

import * as React from "react";
import {ChevronRight, ChevronDown} from "lucide-react";
import {Collapsible, CollapsibleTrigger, CollapsibleContent} from "./collapsible";
import {cn} from "./utils";

interface TreeViewProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

function TreeView({className, children, ...props}: TreeViewProps) {
    return (
        <div data-slot="tree-view" className={cn("space-y-1", className)} {...props}>
            {children}
        </div>
    );
}

interface TreeViewItemContextValue {
    isExpanded: boolean;
}

const TreeViewItemContext = React.createContext<TreeViewItemContextValue>({
    isExpanded: false,
});

interface TreeViewItemProps {
    children: React.ReactNode;
    defaultExpanded?: boolean;
    className?: string;
}

function TreeViewItem({children, defaultExpanded = false, className}: TreeViewItemProps) {
    const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

    return (
        <TreeViewItemContext.Provider value={{isExpanded}}>
            <Collapsible
                data-slot="tree-view-item"
                open={isExpanded}
                onOpenChange={setIsExpanded}
                className={className}
            >
                {children}
            </Collapsible>
        </TreeViewItemContext.Provider>
    );
}

interface TreeViewItemTriggerProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    asChild?: boolean;
}

function TreeViewItemTrigger({className, children, ...props}: TreeViewItemTriggerProps) {
    const {isExpanded} = React.useContext(TreeViewItemContext);

    return (
        <div
            data-slot="tree-view-item-trigger"
            className={cn("flex items-center gap-2", className)}
            {...props}
        >
            <CollapsibleTrigger className="shrink-0 cursor-pointer">
                {isExpanded ? (
                    <ChevronDown className="size-4 text-zinc-500"/>
                ) : (
                    <ChevronRight className="size-4 text-zinc-500"/>
                )}
            </CollapsibleTrigger>
            {children}
        </div>
    );
}

interface TreeViewItemContentProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

function TreeViewItemContent({className, children, ...props}: TreeViewItemContentProps) {
    return (
        <CollapsibleContent data-slot="tree-view-item-content" {...props}>
            <div className={cn("ml-4", className)}>
                {children}
            </div>
        </CollapsibleContent>
    );
}

interface TreeViewLeafProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
}

function TreeViewLeaf({className, children, ...props}: TreeViewLeafProps) {
    return (
        <div
            data-slot="tree-view-leaf"
            className={cn("flex items-center gap-2 py-1", className)}
            {...props}
        >
            {children}
        </div>
    );
}

export {
    TreeView,
    TreeViewItem,
    TreeViewItemTrigger,
    TreeViewItemContent,
    TreeViewLeaf,
};
