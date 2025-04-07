// src/components/entity/columns/editors/JsonColumnEditor.tsx
import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ColumnEditorProps } from '../types';

/**
 * Component for editing JSON values
 */
export const JsonColumnEditor: React.FC<ColumnEditorProps> = ({
                                                                value,
                                                                column,
                                                                onChange,
                                                                onBlur,
                                                                className,
                                                                error,
                                                                disabled,
                                                                placeholder
                                                              }) => {
  // Convert the JSON value to a string for editing
  const [jsonString, setJsonString] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Format the JSON on initial render and when value changes
  useEffect(() => {
    try {
      if (value === null || value === undefined) {
        setJsonString('');
        return;
      }

      const jsonValue = typeof value === 'string' ? JSON.parse(value) : value;
      setJsonString(JSON.stringify(jsonValue, null, 2));
      setJsonError(null);
    } catch (error) {
      console.error('Error parsing JSON:', error);
      setJsonString(value === null || value === undefined ? '' : String(value));
      setJsonError('Invalid JSON format');
    }
  }, [value]);

  // Handle manual formatting
  const handleFormat = () => {
    try {
      if (!jsonString) {
        onChange(null);
        setJsonError(null);
        return;
      }

      // Parse and re-stringify to format properly
      const parsed = JSON.parse(jsonString);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonString(formatted);
      onChange(parsed);
      setJsonError(null);
    } catch (error) {
      console.error('Error formatting JSON:', error);
      setJsonError('Invalid JSON format');
    }
  };

  // Handle changes to the JSON text
  const handleChange = (newValue: string) => {
    setJsonString(newValue);
    try {
      if (!newValue) {
        onChange(null);
        setJsonError(null);
        return;
      }

      const parsed = JSON.parse(newValue);
      onChange(parsed);
      setJsonError(null);
    } catch (error) {
      setJsonError('Invalid JSON format');
      // We don't call onChange here because we don't want to update with invalid JSON
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleFormat}
          disabled={disabled}
        >
          Format JSON
        </Button>
      </div>
      <Textarea
        value={jsonString}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => {
          handleFormat();
          if (onBlur) onBlur();
        }}
        className={cn(
          "font-mono text-sm min-h-[150px]",
          (error || jsonError) && "border-red-500",
          className
        )}
        placeholder={placeholder || "Enter valid JSON"}
        disabled={disabled}
        rows={8}
      />
      {jsonError && (
        <p className="text-sm text-red-500">{jsonError}</p>
      )}
    </div>
  );
};

export default JsonColumnEditor;
