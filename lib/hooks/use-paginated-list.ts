import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Options for the paginated list fetch function
 */
export interface PaginatedListOptions {
  limit?: number;
  offset?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  status?: string;
  useCache?: boolean;
  _t?: string;
  [key: string]: any; // Allow additional custom options
}

/**
 * Response type for paginated list data
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

/**
 * Fetch function signature
 */
export type FetchFunction<T> = (options: PaginatedListOptions) => Promise<PaginatedResponse<T>>;

/**
 * Hook configuration
 */
export interface UsePaginatedListConfig<T> {
  /**
   * Function that fetches the data
   */
  fetchFn: FetchFunction<T>;
  
  /**
   * Number of items per page
   */
  itemsPerPage?: number;
  
  /**
   * Initial page number (1-indexed)
   */
  initialPage?: number;
  
  /**
   * Default sort field
   */
  defaultSort?: string;
  
  /**
   * Default sort order
   */
  defaultOrder?: 'asc' | 'desc';
  
  /**
   * Additional options to pass to the fetch function
   */
  additionalOptions?: Partial<PaginatedListOptions>;
  
  /**
   * Whether to auto-fetch on mount
   */
  autoFetch?: boolean;
}

/**
 * Return type for the hook
 */
export interface UsePaginatedListReturn<T> {
  // Data
  items: T[];
  
  // Pagination
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  
  // State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchItems: (forceFetch?: boolean, page?: number) => Promise<void>;
  refresh: () => Promise<void>;
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
}

/**
 * Generic hook for paginated list data
 * 
 * Handles loading, error states, pagination, and data fetching.
 * Can be used for any entity type (campaigns, zones, etc.)
 * 
 * @example
 * ```tsx
 * const {
 *   items: zones,
 *   isLoading,
 *   error,
 *   currentPage,
 *   totalPages,
 *   setPage,
 *   refresh
 * } = usePaginatedList({
 *   fetchFn: async (options) => {
 *     const response = await getZones(options);
 *     return {
 *       items: response.zones,
 *       pagination: response.pagination
 *     };
 *   },
 *   itemsPerPage: 10,
 *   defaultSort: 'created_at',
 *   defaultOrder: 'desc'
 * });
 * ```
 */
export function usePaginatedList<T>({
  fetchFn,
  itemsPerPage = 10,
  initialPage = 1,
  defaultSort = 'created_at',
  defaultOrder = 'desc',
  additionalOptions = {},
  autoFetch = true,
}: UsePaginatedListConfig<T>): UsePaginatedListReturn<T> {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(autoFetch); // Only start loading if autoFetch is true
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const hasInitiallyFetchedRef = useRef(false);

  const fetchItems = useCallback(
    async (forceFetch = false, page = currentPage) => {
      if (!hasInitiallyFetchedRef.current || forceFetch) {
        setIsLoading(true);
      }
      
      try {
        const offset = (page - 1) * itemsPerPage;
        const options: PaginatedListOptions = {
          limit: itemsPerPage,
          offset,
          sort: defaultSort,
          order: defaultOrder,
          useCache: false,
          _t: Date.now().toString(),
          ...additionalOptions,
        };
        
        const response = await fetchFn(options);
        
        setItems(response.items);
        setTotalItems(response.pagination.total);
        setTotalPages(Math.ceil(response.pagination.total / itemsPerPage));
        setError(null);
        hasInitiallyFetchedRef.current = true;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load data. Please try refreshing.';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [currentPage, itemsPerPage, defaultSort, defaultOrder, additionalOptions, fetchFn]
  );

  // Auto-fetch on mount or when page changes
  useEffect(() => {
    if (autoFetch) {
      fetchItems(false, currentPage);
    }
  }, [fetchItems, currentPage, autoFetch]);

  const refresh = useCallback(async () => {
    await fetchItems(true, currentPage);
  }, [fetchItems, currentPage]);

  const setPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [currentPage, totalPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);

  return {
    items,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    isLoading,
    error,
    fetchItems,
    refresh,
    setPage,
    nextPage,
    prevPage,
    setItems,
  };
}
