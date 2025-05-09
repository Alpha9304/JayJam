"use client"

import type React from "react"

import { useState } from "react"

import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TimeSelectProps extends React.HTMLAttributes<HTMLDivElement> {
  onTimeChange?: (time: { hour: string; minute: string }) => void
}

export function TimeSelector({ className, onTimeChange, ...props }: TimeSelectProps) {
  const [hour, setHour] = useState<string>("")
  const [minute, setMinute] = useState<string>("")

  // Generate hours (1-24)
  const hours = Array.from({ length: 24 }, (_, i) => {
    const hourValue = (i + 1).toString().padStart(2, '0')
    return { value: hourValue, label: hourValue }
  })

  // Generate minutes (00-55 in 5-minute increments)
  const minutes = Array.from({ length: 12 }, (_, i) => {
    const minuteValue = (i * 5).toString().padStart(2, "0")
    return { value: minuteValue, label: minuteValue }
  })

  const handleHourChange = (value: string) => {
    setHour(value)
    if (onTimeChange) {
      onTimeChange({ hour: value, minute })
    }
  }

  const handleMinuteChange = (value: string) => {
    setMinute(value)
    if (onTimeChange) {
      onTimeChange({ hour, minute: value })
    }
  }

  return (
    <div className={cn("flex items-center space-x-2", className)} {...props}>
      <div className="flex items-center">
        {/* <Clock className="mr-2 h-4 w-4 text-muted-foreground" /> */}
        <Select value={hour} onValueChange={handleHourChange}>
          <SelectTrigger className="w-[65px]">
            <SelectValue placeholder="Hr" />
          </SelectTrigger>
          <SelectContent>
            {hours.map((hour) => (
              <SelectItem key={hour.value} value={hour.value}>
                {hour.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <span className="text-muted-foreground">:</span>
      <Select value={minute} onValueChange={handleMinuteChange}>
        <SelectTrigger className="w-[65px]">
          <SelectValue placeholder="Min" />
        </SelectTrigger>
        <SelectContent>
          {minutes.map((minute) => (
            <SelectItem key={minute.value} value={minute.value}>
              {minute.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

