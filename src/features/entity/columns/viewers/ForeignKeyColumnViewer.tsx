// src/components/entity/columns/viewers/ForeignKeyColumnViewer.tsx
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ExternalLink, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ColumnViewerProps } from '../types';
import { daptinClient } from '@/daptin';

/**
 * Component for displaying foreign key values with reference data
 */
export const ForeignKeyColumnViewer: React.FC<ColumnViewerProps> = ({
                                                                      value,
                                                                      column,
                                                                      className,
                                                                    }) => {
  const [referenceData, setReferenceData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Extract necessary information from the column
  const foreignKeyData = column.ForeignKeyData;
  const namespace = foreignKeyData?.Namespace;
  const dataSource = foreignKeyData?.DataSource;

  // If the value is null or undefined, show a placeholder
  if (value === null || value === undefined) {
    return <span className={className}>-</span>;
  }

  // Load reference data if available
  useEffect(() => {
    if (!namespace || !value || dataSource !== 'self') return;

    // Avoid fetching if we don't have necessary data
    if (!value.toString()) return;

    const fetchReferenceData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Attempt to fetch the referenced object using its ID
        const response = await daptinClient.jsonApi.find(namespace, value.toString());
        if (response.errors && response.errors.length) {
          throw new Error(response.errors[0].detail || 'Failed to load reference data');
        }

        setReferenceData(response.data);
      } catch (err) {
        console.error('Error fetching foreign key data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load reference data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReferenceData();
  }, [namespace, value, dataSource]);

  // Display skeleton loader while fetching
  if (isLoading) {
    return <Skeleton className={cn("h-4 w-32", className)} />;
  }

  // Display error if any
  if (error) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("flex items-center text-red-500", className)}>
              <AlertCircle className="mr-1 h-3 w-3" />
              <span>Error loading reference</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{error}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Render the foreign key data
  // If reference data is available, display it with more context
  if (referenceData) {
    // Try to find a display name from the reference data
    const displayName = referenceData.name ||
      referenceData.title ||
      referenceData.label ||
      (referenceData.attributes && (
        referenceData.attributes.name ||
        referenceData.attributes.title ||
        referenceData.attributes.label
      )) ||
      `${namespace}:${value}`;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className={cn("bg-blue-50 hover:bg-blue-100 text-blue-800 cursor-pointer flex items-center", className)}
              onClick={() => window.open(`/${namespace}/${value}`, '_blank')}
            >
              <span className="mr-1">{displayName}</span>
              <ExternalLink className="h-3 w-3" />
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs">
              <p className="font-bold">{namespace}</p>
              <p>ID: {value}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Fallback: just show the raw value with the namespace
  return (
    <Badge
      variant="outline"
      className={cn("bg-gray-100 text-gray-800", className)}
    >
      {namespace ? `${namespace}:${value}` : value.toString()}
    </Badge>
  );
};

export default ForeignKeyColumnViewer;
