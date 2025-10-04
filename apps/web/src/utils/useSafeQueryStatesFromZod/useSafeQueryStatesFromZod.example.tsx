import React from 'react'
import { z } from 'zod'
import { useSafeQueryStatesFromZod } from '.'

// Example schema for a search/filter form
const SearchSchema = z.object({
  query: z.string().default(''),
  category: z.enum(['all', 'products', 'articles', 'users']).default('all'),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(5).max(100).default(10),
  sortBy: z.enum(['name', 'date', 'popularity']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  isActive: z.boolean().default(true),
  tags: z.array(z.string()).default([]),
  priceRange: z.object({
    min: z.number().default(0),
    max: z.number().default(1000)
  }).default({ min: 0, max: 1000 })
})

type SearchFilters = z.infer<typeof SearchSchema>

export function SearchForm() {
  // Use the enhanced hook with automatic batching
  const [filters, setFilters] = useSafeQueryStatesFromZod(SearchSchema, {
    // Optional: Add debouncing for performance
    delay: 300,
    // Optional: History management
    history: 'push'
  })

  const handleSearch = (newQuery: string) => {
    // Update just the query, all other fields remain unchanged
    setFilters({ query: newQuery, page: 1 }) // Reset page when searching
  }

  const handleCategoryChange = (category: SearchFilters['category']) => {
    // Type-safe updates
    setFilters({ category, page: 1 })
  }

  const handlePagination = (page: number) => {
    setFilters({ page })
  }

  const handleSorting = (sortBy: SearchFilters['sortBy'], sortOrder: SearchFilters['sortOrder']) => {
    setFilters({ sortBy, sortOrder })
  }

  const handleReset = () => {
    // Reset to default values
    setFilters(null)
  }

  const handlePriceChange = (min: number, max: number) => {
    // Update nested object
    setFilters({ 
      priceRange: { min, max },
      page: 1 // Reset pagination when filtering
    })
  }

  const handleTagsChange = (tags: string[]) => {
    setFilters({ tags, page: 1 })
  }

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold">Search Filters</h2>
      
      {/* Search Input */}
      <div>
        <label className="block text-sm font-medium mb-1">Search Query</label>
        <input
          type="text"
          value={filters.query}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="Search..."
        />
      </div>

      {/* Category Select */}
      <div>
        <label className="block text-sm font-medium mb-1">Category</label>
        <select
          value={filters.category}
          onChange={(e) => handleCategoryChange(e.target.value as SearchFilters['category'])}
          className="w-full p-2 border rounded"
        >
          <option value="all">All</option>
          <option value="products">Products</option>
          <option value="articles">Articles</option>
          <option value="users">Users</option>
        </select>
      </div>

      {/* Pagination */}
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium">Page:</label>
        <input
          type="number"
          value={filters.page}
          onChange={(e) => handlePagination(parseInt(e.target.value) || 1)}
          min="1"
          className="w-20 p-1 border rounded"
        />
        <label className="text-sm font-medium">Limit:</label>
        <select
          value={filters.limit}
          onChange={(e) => setFilters({ limit: parseInt(e.target.value) })}
          className="p-1 border rounded"
        >
          <option value="5">5</option>
          <option value="10">10</option>
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>

      {/* Sorting */}
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium">Sort by:</label>
        <select
          value={filters.sortBy}
          onChange={(e) => handleSorting(e.target.value as SearchFilters['sortBy'], filters.sortOrder)}
          className="p-1 border rounded"
        >
          <option value="name">Name</option>
          <option value="date">Date</option>
          <option value="popularity">Popularity</option>
        </select>
        <select
          value={filters.sortOrder}
          onChange={(e) => handleSorting(filters.sortBy, e.target.value as SearchFilters['sortOrder'])}
          className="p-1 border rounded"
        >
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>
      </div>

      {/* Price Range */}
      <div>
        <label className="block text-sm font-medium mb-1">Price Range</label>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            value={filters.priceRange.min}
            onChange={(e) => handlePriceChange(parseInt(e.target.value) || 0, filters.priceRange.max)}
            placeholder="Min"
            className="w-20 p-1 border rounded"
          />
          <span>-</span>
          <input
            type="number"
            value={filters.priceRange.max}
            onChange={(e) => handlePriceChange(filters.priceRange.min, parseInt(e.target.value) || 1000)}
            placeholder="Max"
            className="w-20 p-1 border rounded"
          />
        </div>
      </div>

      {/* Active Filter */}
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={filters.isActive}
            onChange={(e) => setFilters({ isActive: e.target.checked })}
          />
          <span className="text-sm font-medium">Show only active items</span>
        </label>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium mb-1">Tags</label>
        <input
          type="text"
          placeholder="Enter tags separated by commas"
          value={filters.tags.join(', ')}
          onChange={(e) => handleTagsChange(e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
          className="w-full p-2 border rounded"
        />
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Reset Filters
        </button>
      </div>

      {/* Current State Display */}
      <div className="mt-6 p-4 bg-gray-100 rounded">
        <h3 className="font-bold mb-2">Current Filters (for debugging):</h3>
        <pre className="text-xs">{JSON.stringify(filters, null, 2)}</pre>
      </div>
    </div>
  )
}

// Example of using with different schema types
const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  language: z.string().default('en'),
  timezone: z.string().default('UTC'),
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(false),
    sms: z.boolean().default(false)
  }).default({ email: true, push: false, sms: false }),
  layout: z.object({
    sidebar: z.boolean().default(true),
    compactMode: z.boolean().default(false)
  }).default({ sidebar: true, compactMode: false })
})

export function UserPreferences() {
  const [preferences, setPreferences] = useSafeQueryStatesFromZod(UserPreferencesSchema)

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold">User Preferences</h2>
      
      <div>
        <label className="block text-sm font-medium mb-1">Theme</label>
        <select
          value={preferences.theme}
          onChange={(e) => setPreferences({ theme: e.target.value as 'light' | 'dark' | 'auto' })}
          className="w-full p-2 border rounded"
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="auto">Auto</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Notifications</label>
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={preferences.notifications.email}
              onChange={(e) => setPreferences({ 
                notifications: { ...preferences.notifications, email: e.target.checked }
              })}
            />
            <span>Email notifications</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={preferences.notifications.push}
              onChange={(e) => setPreferences({ 
                notifications: { ...preferences.notifications, push: e.target.checked }
              })}
            />
            <span>Push notifications</span>
          </label>
        </div>
      </div>

      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h3 className="font-bold mb-2">Current Preferences:</h3>
        <pre className="text-xs">{JSON.stringify(preferences, null, 2)}</pre>
      </div>
    </div>
  )
}