"use client"

import * as React from "react"
import { Calendar as CalendarIcon, Clock } from "lucide-react"
import { format } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

interface DateTimePickerProps {
    date: Date | undefined
    setDate: (date: Date | undefined) => void
    label?: string
}

export function DateTimePicker({ date, setDate, label }: DateTimePickerProps) {
    const [isOpen, setIsOpen] = React.useState(false)
    const scrollRef = React.useRef<HTMLDivElement>(null)

    // Standard time slots (every 30 mins)
    const times = React.useMemo(() => {
        const timeSlots = []
        for (let i = 0; i < 24; i++) {
            for (let j = 0; j < 60; j += 30) {
                const hour = i.toString().padStart(2, '0')
                const minute = j.toString().padStart(2, '0')
                timeSlots.push(`${hour}:${minute}`)
            }
        }
        return timeSlots
    }, [])

    // Auto-scroll to selected time when opening
    React.useEffect(() => {
        if (isOpen && date && scrollRef.current) {
            const selectedTime = format(date, 'HH:mm')
            const button = scrollRef.current.querySelector(`button[data-time="${selectedTime}"]`) as HTMLElement
            if (button) {
                button.scrollIntoView({ block: 'center' })
            }
        }
    }, [isOpen, date])

    const handleDateSelect = (selectedDate: Date | undefined) => {
        if (selectedDate) {
            const newDate = new Date(selectedDate)
            // Preserve time if already set, otherwise default to 09:00 or current time
            if (date) {
                newDate.setHours(date.getHours(), date.getMinutes())
            } else {
                newDate.setHours(9, 0)
            }
            setDate(newDate)
        } else {
            setDate(undefined)
        }
    }

    const handleTimeSelect = (time: string) => {
        if (date) {
            const [hours, minutes] = time.split(':').map(Number)
            const newDate = new Date(date)
            newDate.setHours(hours, minutes)
            setDate(newDate)
        }
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal h-11 bg-background border-input hover:bg-accent hover:text-accent-foreground transition-colors",
                        !date && "text-muted-foreground",
                        isOpen && "border-primary ring-1 ring-primary"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    {date ? (
                        <span className="font-medium text-foreground">
                            {format(date, "PPP")}
                            <span className="text-muted-foreground mx-1">at</span>
                            {format(date, "p")}
                        </span>
                    ) : (
                        <span>{label || "Pick a date and time"}</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-popover border-border shadow-lg overflow-hidden" align="start">
                <div className="flex h-[300px] overflow-hidden">
                    <div className="p-3 border-r border-border">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleDateSelect}
                            initialFocus
                            className="p-0"
                        />
                    </div>
                    <div className="flex flex-col w-[140px] h-full overflow-hidden">
                        <div className="flex items-center justify-center p-3 border-b border-border bg-muted/30">
                            <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
                            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Time</span>
                        </div>
                        <div className="flex-1 overflow-y-auto" ref={scrollRef}>
                            <div className="p-2 space-y-1">
                                {times.map((time) => {
                                    const isSelected = date && format(date, 'HH:mm') === time
                                    return (
                                        <Button
                                            key={time}
                                            data-time={time}
                                            variant={isSelected ? "default" : "ghost"}
                                            size="sm"
                                            className={cn(
                                                "w-full justify-center text-sm font-normal",
                                                isSelected ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                                            )}
                                            onClick={() => handleTimeSelect(time)}
                                            disabled={!date}
                                        >
                                            {time}
                                        </Button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
