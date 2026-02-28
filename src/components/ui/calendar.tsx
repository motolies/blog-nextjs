import * as React from "react"
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
} from "lucide-react"
import { DayFlag, DayPicker, SelectionState, UI } from "react-day-picker"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  components,
  navLayout = "after",
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      navLayout={navLayout}
      className={cn("w-fit rounded-[1.35rem] p-1", className)}
      classNames={{
        [UI.Months]: "flex flex-col gap-4 sm:flex-row",
        [UI.Month]:
          "relative w-full min-w-[17rem] space-y-4",
        [UI.MonthCaption]:
          "flex min-h-12 items-center rounded-[1.2rem] border border-border/70 bg-background/86 px-3 py-2.5 pr-[5.25rem] shadow-xs backdrop-blur-sm",
        [UI.Dropdowns]: "flex flex-wrap items-center gap-2",
        [UI.DropdownRoot]:
          "relative flex h-9 min-w-[5.75rem] items-center rounded-xl border border-border/70 bg-background/94 text-foreground shadow-xs transition-[border-color,box-shadow,background-color] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20 data-[disabled=true]:opacity-55",
        [UI.Dropdown]:
          "absolute inset-0 z-10 h-full w-full cursor-pointer rounded-xl opacity-0",
        [UI.CaptionLabel]:
          "pointer-events-none flex w-full items-center justify-between gap-2 px-3 text-sm font-semibold tracking-[-0.01em] text-foreground",
        [UI.Nav]:
          "absolute top-2.5 right-3 flex items-center gap-1",
        [UI.PreviousMonthButton]: cn(
          buttonVariants({ variant: "ghost", size: "icon-xs" }),
          "size-8 rounded-xl border border-border/60 bg-background/82 text-muted-foreground shadow-xs hover:bg-accent/80 hover:text-foreground aria-disabled:pointer-events-none aria-disabled:opacity-35"
        ),
        [UI.NextMonthButton]: cn(
          buttonVariants({ variant: "ghost", size: "icon-xs" }),
          "size-8 rounded-xl border border-border/60 bg-background/82 text-muted-foreground shadow-xs hover:bg-accent/80 hover:text-foreground aria-disabled:pointer-events-none aria-disabled:opacity-35"
        ),
        [UI.Chevron]: "size-4",
        [UI.MonthGrid]:
          "w-full border-separate border-spacing-x-1 border-spacing-y-1.5",
        [UI.Weekdays]: "",
        [UI.Weekday]:
          "pb-1 text-center text-[0.72rem] font-semibold tracking-[0.18em] text-muted-foreground/90",
        [UI.Weeks]: "",
        [UI.Week]: "",
        [UI.Day]:
          "h-10 w-10 p-0 text-center align-middle text-sm [&:has([aria-selected=true])]:z-10",
        [UI.DayButton]: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "size-9 rounded-xl border border-transparent bg-transparent p-0 font-medium text-foreground shadow-none transition-[transform,background-color,color,box-shadow,border-color] hover:border-border/70 hover:bg-accent/80 hover:text-accent-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30"
        ),
        [DayFlag.today]:
          "text-primary [&>button]:border-primary/35 [&>button]:bg-primary/8 [&>button]:text-primary",
        [DayFlag.outside]:
          "text-muted-foreground/45 opacity-70 [&>button]:text-muted-foreground/50",
        [DayFlag.disabled]:
          "text-muted-foreground/40 opacity-45 [&>button]:pointer-events-none [&>button]:opacity-60",
        [DayFlag.hidden]: "invisible",
        [SelectionState.selected]:
          "rounded-[1rem] bg-primary/12 text-primary [&>button]:border-primary [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:shadow-[0_12px_26px_rgba(14,116,228,0.28)] hover:[&>button]:bg-primary/92 hover:[&>button]:text-primary-foreground",
        [SelectionState.range_start]:
          "rounded-[1rem] bg-primary/12 text-primary [&>button]:border-primary [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:shadow-[0_12px_26px_rgba(14,116,228,0.28)]",
        [SelectionState.range_end]:
          "rounded-[1rem] bg-primary/12 text-primary [&>button]:border-primary [&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:shadow-[0_12px_26px_rgba(14,116,228,0.28)]",
        [SelectionState.range_middle]:
          "rounded-[1rem] bg-primary/10 text-primary [&>button]:bg-transparent [&>button]:text-primary [&>button]:hover:bg-primary/12",
        ...classNames,
      }}
      components={{
        Chevron: ({ className, orientation = "left", disabled: _disabled, ...props }) => {
          const Icon =
            orientation === "right"
              ? ChevronRightIcon
              : orientation === "down"
                ? ChevronDownIcon
                : orientation === "up"
                  ? ChevronUpIcon
                  : ChevronLeftIcon

          return <Icon className={cn("size-4", className)} {...props} />
        },
        ...components,
      }}
      {...props}
    />
  )
}

export { Calendar }
