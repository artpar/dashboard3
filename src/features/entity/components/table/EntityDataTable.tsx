import React, { useEffect, useState } from 'react';
import { Table, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEntityColumns } from '../../hooks/useEntityColumns';
import EntityTableHeader from './EntityTableHeader';
import EntityTableBody from './EntityTableBody';
import { useEntityData } from '@/features/entity/hooks/useEntityData.tsx'

/**
 * Main data table component that displays entity records
 */
export const EntityDataTable: React.FC = () => {
  const {
    data,
    columns,
    isLoading,
    columnsLoading,
    setSelectedItem,
    setShowEditDialog,
    setShowDeleteDialog,
    relations,
    entityName,
  } = useEntityData();

  // Log the current state
  console.log(`EntityDataTable state for ${entityName}:`, {
    dataLength: data?.length || 0,
    columnsLength: columns?.length || 0,
    isLoading,
    columnsLoading
  });

  // Use a local copy of columns to ensure we don't lose them during re-renders
  console.log("Load.EntityDataTable", columns);
  const [localColumns, setLocalColumns] = React.useState(columns || []);

  // Update local columns when columns from context change and are not empty
  useEffect(() => {
    if (columns && columns.length > 0) {
      console.log(`Updating local columns for ${entityName}:`, columns.length);
      setLocalColumns(columns);
    }
  }, [columns, entityName]);

  const {
    visibleColumns,
    filteredColumns,
    auditColumnsToShow,
    toggleColumnVisibility,
  } = useEntityColumns(localColumns);

  // Handle row actions
  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setShowEditDialog(true);
  };

  const handleDelete = (item: any) => {
    setSelectedItem(item);
    setShowDeleteDialog(true);
  };

  const handleViewDetails = (item: any) => {
    setSelectedItem(item);
    // This would typically open a view dialog
    console.log('View details for:', item);
  };

  // If columns are not yet loaded or we're loading data, show a loading state
  if (isLoading || columnsLoading || localColumns.length === 0) {
    return (
      <div className="rounded-md border p-4 text-center">
        <p className="text-muted-foreground">
          {isLoading ? 'Loading data...' :
           columnsLoading ? 'Loading table structure...' :
           'Waiting for columns...'}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <EntityTableHeader
        columns={localColumns}
        visibleColumns={visibleColumns}
        toggleColumnVisibility={toggleColumnVisibility}
      />

      <Table>
        <TableHeader>
          <TableRow>
            {filteredColumns.map((column) => (
              <TableHead key={column.key}>{column.name}</TableHead>
            ))}
            <TableHead className="text-muted-foreground text-xs">
              Audit Info
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>

        <EntityTableBody
          data={data}
          filteredColumns={filteredColumns}
          auditColumns={auditColumnsToShow}
          relations={relations}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewDetails={handleViewDetails}
        />
      </Table>
    </div>
  );
};

export default EntityDataTable;
