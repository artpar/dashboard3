// components/GroupSelector.tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface GroupSelectorProps {
  selectedGroup: string | null;
  onGroupChange: (groupId: string) => void;
  groups: any[];
  entityFilter: string;
  onFilterChange: (filter: string) => void;
  disabled?: boolean;
}

export function GroupSelector({
  selectedGroup,
  onGroupChange,
  groups,
  entityFilter,
  onFilterChange,
  disabled
}: GroupSelectorProps) {
  return (
    <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
      {/* Group selection */}
      <div className='space-y-4'>
        <h3 className='text-sm font-medium'>Select User Group</h3>
        <Select
          value={selectedGroup || ''}
          onValueChange={onGroupChange}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder='Select a user group' />
          </SelectTrigger>
          <SelectContent>
            {groups &&
              groups.map((group: any) => (
                <SelectItem
                  key={group.reference_id}
                  value={group.reference_id}
                >
                  {group.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Group details */}
      {selectedGroup && (
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h3 className='text-sm font-medium'>
              {groups?.find((g: any) => g.reference_id === selectedGroup)
                ?.name || 'Group'}
            </h3>
          </div>
          <Input
            placeholder='Filter entities...'
            value={entityFilter}
            onChange={(e) => onFilterChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}

