"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

// Custom navigation buttons components
function PreviousMonthButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button 
      {...props} 
      className="h-7 w-7 bg-muted text-muted-foreground border border-input rounded-md flex items-center justify-center hover:bg-accent hover:text-accent-foreground"
    >
      <ChevronLeft className="h-4 w-4" />
    </button>
  )
}

function NextMonthButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button 
      {...props} 
      className="h-7 w-7 bg-muted text-muted-foreground border border-input rounded-md flex items-center justify-center hover:bg-accent hover:text-accent-foreground"
    >
      <ChevronRight className="h-4 w-4" />
    </button>
  )
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: "h-7 w-7 bg-transparent p-0",
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "h-9 w-9 text-center text-sm p-0 relative",
        day: "h-9 w-9 p-0 font-normal",
        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "bg-accent",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        PreviousMonthButton: PreviousMonthButton,
        NextMonthButton: NextMonthButton
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar } 