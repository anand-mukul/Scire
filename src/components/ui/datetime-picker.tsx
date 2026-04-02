"use client"

import * as React from "react"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { format, startOfDay, addDays, subDays, setHours, setMinutes, setSeconds } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DateTimePickerProps {
    date: Date | undefined
    setDate: (date: Date | undefined) => void
    label?: string
    disablePastDates?: boolean
    minDate?: Date
    disabled?: boolean
    showSeconds?: boolean
}

// Scrollable number column component
function NumberColumn({
    count,
    value,
    onChange,
    label,
}: {
    count: number
    value: number
    onChange: (val: number) => void
    label: string
}) {
    const containerRef = React.useRef<HTMLDivElement>(null)
    const itemHeight = 32

    // Scroll to selected value when it changes
    React.useEffect(() => {
        if (containerRef.current) {
            const scrollTarget = value * itemHeight
            containerRef.current.scrollTo({
                top: scrollTarget - containerRef.current.clientHeight / 2 + itemHeight / 2,
                behavior: 'smooth',
            })
        }
    }, [value])

    return (
        <div className="flex flex-col items-center flex-1 min-w-[52px]">
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60 mb-1 select-none">{label}</span>
            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-border/40 scrollbar-track-transparent"
                style={{ height: '200px' }}
            >
                <div className="flex flex-col items-center py-1">
                    {Array.from({ length: count }, (_, i) => {
                        const isSelected = i === value
                        return (
                            <button
                                key={i}
                                onClick={() => onChange(i)}
                                className={cn(
                                    "w-10 h-8 flex items-center justify-center rounded-md text-sm font-mono transition-all duration-150 select-none shrink-0",
                                    isSelected
                                        ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                )}
                            >
                                {i.toString().padStart(2, '0')}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export function DateTimePicker({ date, setDate, label, disablePastDates, minDate, disabled, showSeconds = false }: DateTimePickerProps) {
    const [isOpen, setIsOpen] = React.useState(false)

    const hours = date ? date.getHours() : 0
    const minutes = date ? date.getMinutes() : 0
    const seconds = date ? date.getSeconds() : 0

    const handleDateSelect = (selectedDate: Date | undefined) => {
        if (selectedDate) {
            const newDate = new Date(selectedDate)
            if (date) {
                newDate.setHours(date.getHours(), date.getMinutes(), date.getSeconds())
            } else {
                newDate.setHours(9, 0, 0)
            }
            setDate(newDate)
        } else {
            setDate(undefined)
        }
    }

    const handleHourChange = (h: number) => {
        const d = date ? new Date(date) : new Date()
        d.setHours(h)
        if (!date) { d.setMinutes(0); d.setSeconds(0) }
        setDate(d)
    }

    const handleMinuteChange = (m: number) => {
        const d = date ? new Date(date) : new Date()
        d.setMinutes(m)
        if (!date) { d.setHours(0); d.setSeconds(0) }
        setDate(d)
    }

    const handleSecondChange = (s: number) => {
        const d = date ? new Date(date) : new Date()
        d.setSeconds(s)
        if (!date) { d.setHours(0); d.setMinutes(0) }
        setDate(d)
    }

    // Quick presets
    const presets = [
        {
            label: 'Clear',
            action: () => setDate(undefined),
        },
        {
            label: 'Now',
            action: () => setDate(new Date()),
        },
        {
            label: 'Today',
            action: () => {
                const d = startOfDay(new Date())
                d.setHours(9, 0, 0)
                setDate(d)
            },
        },
        {
            label: 'Tomorrow',
            action: () => {
                const d = startOfDay(addDays(new Date(), 1))
                d.setHours(9, 0, 0)
                setDate(d)
            },
        },
        {
            label: 'Yesterday',
            action: () => {
                const d = startOfDay(subDays(new Date(), 1))
                d.setHours(9, 0, 0)
                setDate(d)
            },
        },
    ]

    const disabledDays = disablePastDates || minDate
        ? { before: startOfDay(minDate || new Date()) }
        : undefined

    return (
        <Popover open={isOpen} onOpenChange={disabled ? undefined : setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal h-10 bg-background border-input hover:bg-accent hover:text-accent-foreground transition-colors",
                        !date && "text-muted-foreground",
                        isOpen && "border-primary ring-1 ring-primary/30",
                        disabled && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={disabled}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                    {date ? (
                        <span className="font-medium text-foreground text-sm truncate">
                            {format(date, "MMM d, yyyy")}
                            <span className="text-muted-foreground mx-1.5">·</span>
                            <span className="font-mono text-muted-foreground">
                                {format(date, showSeconds ? "HH:mm:ss" : "HH:mm")}
                            </span>
                        </span>
                    ) : (
                        <span className="text-sm">{label || "Pick a date and time"}</span>
                    )}
                    {date && (
                        <X
                            className="ml-auto h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
                            onClick={(e) => {
                                e.stopPropagation()
                                setDate(undefined)
                            }}
                        />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-auto p-0 bg-popover border-border shadow-xl overflow-hidden rounded-xl"
                align="start"
                sideOffset={8}
            >
                <div className="flex h-[320px]">
                    {/* Left sidebar — Quick presets */}
                    <div className="flex flex-col border-r border-border/50 w-[100px] bg-muted/20">
                        <div className="p-2 space-y-0.5">
                            {presets.map((preset) => (
                                <button
                                    key={preset.label}
                                    onClick={preset.action}
                                    className={cn(
                                        "w-full text-left px-3 py-2 text-sm rounded-lg transition-all duration-150",
                                        "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                                        preset.label === 'Clear' && "text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                                    )}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Middle — Calendar */}
                    <div className="border-r border-border/50 flex items-start">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleDateSelect}
                            className="p-3"
                            disabled={disabledDays}
                        />
                    </div>

                    {/* Right — Time columns */}
                    <div className="flex bg-muted/10 py-2 px-1 gap-0.5">
                        <NumberColumn
                            count={24}
                            value={hours}
                            onChange={handleHourChange}
                            label="HR"
                        />
                        <NumberColumn
                            count={60}
                            value={minutes}
                            onChange={handleMinuteChange}
                            label="MIN"
                        />
                        {showSeconds && (
                            <NumberColumn
                                count={60}
                                value={seconds}
                                onChange={handleSecondChange}
                                label="SEC"
                            />
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
