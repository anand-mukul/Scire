import React from 'react';
import { Filter, Download, Calendar as CalendarIcon } from 'lucide-react';
import { api } from '@/lib/network/api';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

interface AnalyticsFiltersProps {
    category: string;
    setCategory: (category: string) => void;
    date: DateRange | undefined;
    setDate: (date: DateRange | undefined) => void;
    subjects: any[];
}

export function AnalyticsFilters({ category, setCategory, date, setDate, subjects }: AnalyticsFiltersProps) {
    const [isExporting, setIsExporting] = React.useState(false);

    const handleExport = async () => {
        try {
            setIsExporting(true);
            const blob = await api.analytics.exportReport({
                category: category === 'all' ? undefined : category,
                start_date: date?.from?.toISOString(),
                end_date: date?.to?.toISOString()
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([blob as any]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `analytics_report_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
        } catch (error) {
            console.error("Failed to export report:", error);
            // Optionally add toast notification here
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full sm:w-[180px] h-9 bg-background border-border hover:bg-muted/50 transition-colors">
                    <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {subjects.map((sub: any) => (
                        <SelectItem key={sub.id} value={sub.name}>
                            {sub.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        size="sm"
                        className={cn(
                            "w-full sm:w-[190px] justify-start text-left font-normal h-9",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, "MMM dd")} - {format(date.to, "MMM dd, y")}
                                </>
                            ) : (
                                format(date.from, "MMM dd, y")
                            )
                        ) : (
                            <span>Pick a date range</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>

            <Button
                size="sm"
                className="h-9 shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground sm:ml-2"
                onClick={handleExport}
                disabled={isExporting}
            >
                {isExporting ? (
                    <div className="h-3.5 w-3.5 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                    <Download className="mr-2 h-3.5 w-3.5" />
                )}
                {isExporting ? 'Exporting...' : 'Export Report'}
            </Button>
        </div>
    );
}
