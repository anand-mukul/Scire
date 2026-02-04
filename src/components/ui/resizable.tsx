"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const ResizablePanelGroup = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex h-full w-full", className)} {...props} />
)

const ResizablePanel = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("h-full w-full", className)} {...props} />
)

const ResizableHandle = () => null;

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
