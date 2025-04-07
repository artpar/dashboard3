// src/components/entity/columns/editors/DateColumnEditor.tsx
import React from 'react';
import { format, parseISO } from 'date-fns';
import { CalendarIcon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ColumnEditorProps, ColumnType } from '../types';
import { getColumnType, getEditorPlaceholder } from '../utils';

/**
 * Component for editing date and time values
 */
export const DateColumnEditor: React.FC<ColumnEditorProps> = ({
                                                                value,
                                                                column,
                                                                onChange,
                                                                onBlur,
                                                                className,
                                                                error,
                                                                disabled,
                                                                placeholder
                                                              }) => {
  const columnType = getColumnType(column);
  const defaultPlaceholder = placeholder || getEditorPlaceholder(column);

  // Parse the date value
  let date: Date | undefined;
  try {
    if (value) {
      date = typeof value === 'string' ? new Date(value) : value;

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        date = undefined;
      }
    }
  } catch (error) {
    console.error('Error parsing date:', error);
    date = undefined;
  }

  // For time-only inputs
  if (columnType === ColumnType.Time) {
    const timeStr = date ? format(date, 'HH:mm') : '';

    return (
      <div className="flex items-center space-x-2">
        <Input
          id={column.ColumnName}
          type="time"
          value={timeStr}
          onChange={(e) => {
            if (e.target.value) {
              // Create a date with the time value
              const newDate = new Date();
              const [hours, minutes] = e.target.value.split(':');
              newDate.setHours(parseInt(hours, 10));
              newDate.setMinutes(parseInt(minutes, 10));
              onChange(newDate);
            } else {
              onChange(null);
            }
          }}
          onBlur={onBlur}
          placeholder={defaultPlaceholder}
          className={cn(error && "border-red-500", className)}
          disabled={disabled}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled}
          className="h-10 w-10"
        >
          <Clock className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  // For date-only inputs
  if (columnType === ColumnType.Date) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
              error && "border-red-500",
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, 'PP') : <span>{defaultPlaceholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => {
              onChange(newDate);
              if (onBlur) onBlur();
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    );
  }

  // For datetime and timestamp inputs
  return (
    <div className="space-y-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
              error && "border-red-500",
              className
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, 'PPP') : <span>{defaultPlaceholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => {
              if (newDate) {
                // Preserve the time if we already have a date
                if (date) {
                  newDate.setHours(date.getHours());
                  newDate.setMinutes(date.getMinutes());
                  newDate.setSeconds(date.getSeconds());
                }
                onChange(newDate);
              } else {
                onChange(null);
              }
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <div className="flex items-center space-x-2">
        <Input
          type="time"
          value={date ? format(date, 'HH:mm') : ''}
          onChange={(e) => {
            if (e.target.value) {
              // Create or update a date with the time value
              const newDate = date || new Date();
              const [hours, minutes] = e.target.value.split(':');
              newDate.setHours(parseInt(hours, 10));
              newDate.setMinutes(parseInt(minutes, 10));
              onChange(newDate);
            }
          }}
          onBlur={onBlur}
          disabled={disabled || !date}
          className={cn(error && "border-red-500")}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled || !date}
          className="h-10 w-10"
        >
          <Clock className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default DateColumnEditor;
