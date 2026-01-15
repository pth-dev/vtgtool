/**
 * Filter Selectors Component
 * Renders multi-select filters for customers, categories, statuses, products
 */
import { FilterMultiSelect } from '@/shared/components/form/FilterMultiSelect'
import { MULTI_FILTERS, type FilterSelectorsProps } from '@/types'

export function FilterSelectors({ filters, options, isDark, isMobile, onChange }: FilterSelectorsProps): JSX.Element {
  return (
    <>
      {MULTI_FILTERS.map((config) => (
        <FilterMultiSelect
          key={config.key}
          label={config.label}
          value={filters[config.key]}
          options={options[config.key]}
          onChange={(value) => onChange(config.key, value)}
          isMobile={isMobile}
          isDark={isDark}
        />
      ))}
    </>
  )
}
