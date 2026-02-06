# Data Layer Architecture

## Overview

This document describes the unified data layer architecture that was implemented to reduce duplication and provide a single source of truth for list data across the application.

## Problem Solved

Previously, list pages (campaigns, zones) and their corresponding contexts (CampaignContext, ZoneContext) implemented parallel and duplicated data fetching logic:

- **List pages** had their own `fetchZones`/`fetchCampaigns` with loading/error/pagination state
- **Contexts** separately fetched "active count" and "recent items" for sidebar/dashboard
- No shared cache or single source of truth
- Duplicate loading/error/pagination logic across pages

## Solution

The new architecture introduces:

1. **Generic `usePaginatedList` hook** - Reusable hook for any paginated list
2. **Enhanced contexts** - Contexts now hold both list data (for pages) and summary data (for sidebar)
3. **Single source of truth** - List pages and contexts share the same data layer

## Components

### 1. `usePaginatedList` Hook

Location: `lib/hooks/use-paginated-list.ts`

A generic, reusable hook that encapsulates all pagination logic:

```typescript
const listData = usePaginatedList<Zone>({
  fetchFn: async (options) => {
    const response = await getZones(options);
    return {
      items: response.zones,
      pagination: response.pagination,
    };
  },
  itemsPerPage: 10,
  defaultSort: 'created_at',
  defaultOrder: 'desc',
  autoFetch: false,
});
```

**Features:**
- Loading/error state management
- Pagination (page, totalPages, totalItems)
- Refresh and navigation (setPage, nextPage, prevPage)
- Customizable fetch function
- Auto-fetch on mount (optional)

**Return value:**
```typescript
{
  items: T[],
  currentPage: number,
  totalPages: number,
  totalItems: number,
  itemsPerPage: number,
  isLoading: boolean,
  error: string | null,
  fetchItems: (forceFetch?: boolean, page?: number) => Promise<void>,
  refresh: () => Promise<void>,
  setPage: (page: number) => void,
  nextPage: () => void,
  prevPage: () => void,
  setItems: React.Dispatch<React.SetStateAction<T[]>>
}
```

### 2. Enhanced Contexts

**ZoneContext** (`lib/context/zone-context.tsx`)
**CampaignContext** (`lib/context/campaign-context.tsx`)

Both contexts now provide:

```typescript
interface ContextData {
  // Legacy: for sidebar/dashboard
  activeCount: number | null;
  recentActiveItems: T[];
  
  // New: for list pages
  listData: UsePaginatedListReturn<T> | null;
  
  // Shared state
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
```

The contexts instantiate the `usePaginatedList` hook internally and expose it via `listData`.

### 3. Refactored List Pages

**Zones Page** (`app/(app)/zones/page.tsx`)
**Campaigns Page** (`app/(app)/campaigns/page.tsx`)

Pages now:
1. Use the context's `listData` instead of managing their own state
2. Call `listData.refresh()` instead of implementing their own fetch
3. Use `listData.setItems()` for optimistic updates
4. Access all pagination state from `listData`

Example usage:

```typescript
export default function ZonesPage() {
  const { listData, refetchZones } = useZones();
  
  if (!listData) {
    return <LoadingState />;
  }
  
  const { items: zones, isLoading, error, currentPage, totalPages, setPage, refresh } = listData;
  
  const handleRefresh = async () => {
    await refresh();
    await refetchZones(); // Also update sidebar counts
  };
  
  // ... rest of component
}
```

## Benefits

### 1. Less Duplication
- Pagination logic lives in one place (`usePaginatedList`)
- No more duplicate fetch/loading/error handling across pages
- Consistent behavior across all list pages

### 2. Shared Cache
- List pages and contexts can potentially share the same data
- Single source of truth for entity lists
- Reduces unnecessary API calls

### 3. Easier Maintenance
- Adding new features (optimistic updates, better caching) happens in one place
- Consistent loading/error/refresh behavior
- Easier to test and debug

### 4. Scalability
- Adding a new entity type is straightforward:
  ```typescript
  const listData = usePaginatedList<NewEntity>({
    fetchFn: async (options) => {
      const response = await getNewEntities(options);
      return { items: response.entities, pagination: response.pagination };
    },
    itemsPerPage: 10,
  });
  ```

## Usage Pattern for New Entities

To add a new entity type with the same pattern:

1. **Create/update the context:**
   ```typescript
   const listData = usePaginatedList<EntityType>({
     fetchFn: async (options) => {
       const response = await getEntities(options);
       return {
         items: response.entities,
         pagination: response.pagination,
       };
     },
     itemsPerPage: 10,
     defaultSort: 'created_at',
     defaultOrder: 'desc',
     autoFetch: false,
   });
   ```

2. **Use in the list page:**
   ```typescript
   const { listData } = useEntityContext();
   
   useEffect(() => {
     if (listData && !listData.isLoading && listData.items.length === 0) {
       listData.fetchItems(true);
     }
   }, [listData]);
   
   const { items, isLoading, error, currentPage, totalPages, setPage, refresh } = listData;
   ```

3. **Handle mutations:**
   ```typescript
   // Optimistic update
   listData.setItems(prev => prev.map(item => 
     item.id === updatedId ? { ...item, ...updates } : item
   ));
   
   // Or full refresh
   await listData.refresh();
   ```

## Future Enhancements

Possible improvements:
- Add optimistic updates to the hook
- Implement more sophisticated caching (e.g., React Query integration)
- Add support for filtering and search
- Implement infinite scroll pagination
- Share list data between "all items" and "active items" views

## Migration Notes

The refactoring maintains backward compatibility:
- Sidebar/dashboard still use `activeCount` and `recentActiveItems` from contexts
- All existing functionality is preserved
- No breaking changes to external APIs
