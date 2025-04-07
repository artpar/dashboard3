// src/components/entity/columns/viewers/TextColumnViewer.tsx
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ColumnViewerProps } from '../types';
import { formatText } from '../formatters';

/**
 * Component for displaying text values
 */
export const TextColumnViewer: React.FC<ColumnViewerProps> = ({
                                                                value,
                                                                column,
                                                                className
                                                              }) => {
  const displayValue = formatText(value);
  const stringValue = String(displayValue);
  const isTruncated = typeof stringValue === 'string' && stringValue.length > 50;

  if (isTruncated) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn("truncate inline-block max-w-xs", className)}>
              {stringValue.substring(0, 50)}...
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="break-words">{stringValue}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <span className={className}>
      {displayValue}
    </span>
  );
};

export default TextColumnViewer;
