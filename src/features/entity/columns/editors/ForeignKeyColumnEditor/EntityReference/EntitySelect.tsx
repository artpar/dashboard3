import React from 'react'
import Select from 'react-select'
import { cn } from '@/lib/utils'
import { EntitySelectProps } from '../types'

export const EntitySelect: React.FC<EntitySelectProps> = ({
                                                            value,
                                                            onChange,
                                                            onBlur,
                                                            options,
                                                            isLoading,
                                                            error,
                                                            disabled,
                                                            placeholder,
                                                            onSearchChange,
                                                            getItemLabel,
                                                            referencedEntity,
                                                          }) => {
  // Convert options for react-select
  const selectOptions = options.map((option) => ({
    value: option.reference_id,
    label: getItemLabel(option),
    data: option,
  }))

  // Find the currently selected option
  const selectedOption = value
    ? {
      value: value.reference_id,
      label: getItemLabel(value),
      data: value,
    }
    : null

  return (
    <div className="min-h-48">
      <Select
        isDisabled={disabled}
        options={selectOptions}
        value={selectedOption}
        onChange={onChange}
        placeholder={placeholder}
        onInputChange={onSearchChange}
        isLoading={isLoading}
        isClearable
        className={cn('w-full z-50', error ? 'react-select-error' : '')}
        classNamePrefix="react-select"
        formatOptionLabel={(option: any) => (
          <div className="flex flex-col">
            <span>{option.label}</span>
            <span className="text-xs text-gray-400">{option.value}</span>
          </div>
        )}
        styles={{
          control: (provided, state) => ({
            ...provided,
            borderColor: error ? 'red' : provided.borderColor,
            boxShadow: error ? '0 0 0 1px red' : provided.boxShadow,
            '&:hover': {
              borderColor: error
                ? 'red'
                : state.isFocused
                  ? 'var(--primary-color)'
                  : 'var(--border-color)',
            },
          }),
        }}
        noOptionsMessage={() => `No ${referencedEntity || 'items'} found`}
        onBlur={onBlur}
      />
      {error && <div className="mt-1 text-xs text-red-500">{error}</div>}
    </div>
  )
}
