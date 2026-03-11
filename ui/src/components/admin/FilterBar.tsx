'use client';

import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Input, Select } from 'antd';
import { useCallback, useState } from 'react';

interface FilterOption {
  label: string;
  value: string;
}

interface FilterConfig {
  key: string;
  placeholder: string;
  options: FilterOption[];
  width?: number;
}

interface FilterBarProps {
  filters: FilterConfig[];
  searchPlaceholder?: string;
  onFilterChange: (filters: Record<string, string | undefined>) => void;
  onSearch?: (query: string) => void;
  showSearch?: boolean;
}

export default function FilterBar({
  filters,
  searchPlaceholder = 'Search...',
  onFilterChange,
  onSearch,
  showSearch = true,
}: FilterBarProps) {
  const [filterValues, setFilterValues] = useState<Record<string, string | undefined>>({});
  const [searchValue, setSearchValue] = useState('');

  const handleFilterChange = useCallback(
    (key: string, value: string | undefined) => {
      const updated = { ...filterValues, [key]: value || undefined };
      setFilterValues(updated);
      onFilterChange(updated);
    },
    [filterValues, onFilterChange]
  );

  const handleSearch = useCallback(
    (value: string) => {
      setSearchValue(value);
      onSearch?.(value);
    },
    [onSearch]
  );

  const handleReset = useCallback(() => {
    setFilterValues({});
    setSearchValue('');
    onFilterChange({});
    onSearch?.('');
  }, [onFilterChange, onSearch]);

  const hasActiveFilters = Object.values(filterValues).some(Boolean) || searchValue;

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      {showSearch && (
        <Input
          placeholder={searchPlaceholder}
          prefix={<SearchOutlined className="text-gray-400" />}
          value={searchValue}
          onChange={(e) => handleSearch(e.target.value)}
          allowClear
          className="w-full sm:w-64"
        />
      )}
      {filters.map((filter) => (
        <Select
          key={filter.key}
          placeholder={filter.placeholder}
          value={filterValues[filter.key]}
          onChange={(value) => handleFilterChange(filter.key, value)}
          allowClear
          options={filter.options}
          className="w-full sm:w-auto"
          style={{ minWidth: filter.width || 150 }}
        />
      ))}
      {hasActiveFilters && (
        <Button icon={<ReloadOutlined />} onClick={handleReset} size="small">
          Reset
        </Button>
      )}
    </div>
  );
}
