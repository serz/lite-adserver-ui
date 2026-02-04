"use client";

import React, { useCallback, useState, useEffect, useRef } from "react";
import { getConversions } from "@/lib/services/conversions";
import { Conversion } from "@/types/api";
import { formatDateTime, FORMAT_DATETIME_24H } from "@/lib/date-utils";
import { Button } from "@/components/ui/button";
import { RefreshCw, ChevronRight, ChevronDown } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 20;
const SORT_OPTIONS = [
  { value: "created_at", label: "Created" },
  { value: "ad_event_id", label: "Ad event" },
  { value: "click_id", label: "Click" },
] as const;

export default function ConversionsPage() {
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sort, setSort] = useState<"ad_event_id" | "click_id" | "created_at">("created_at");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const hasInitiallyFetchedRef = useRef(false);

  const toggleRowExpansion = (index: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const formatPayload = (payload: string): string => {
    if (!payload) return "—";
    try {
      const parsed = JSON.parse(payload);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return payload;
    }
  };

  const fetchConversions = useCallback(
    async (forceFetch = false, page = currentPage) => {
      if (!hasInitiallyFetchedRef.current || forceFetch) {
        setIsLoading(true);
      }
      try {
        const offset = (page - 1) * ITEMS_PER_PAGE;
        const response = await getConversions({
          limit: ITEMS_PER_PAGE,
          offset,
          sort,
          order,
        });
        setConversions(response.conversions);
        setTotalItems(response.pagination.total);
        setError(null);
        hasInitiallyFetchedRef.current = true;
      } catch (err) {
        setError("Failed to load conversions. Please try refreshing.");
      } finally {
        setIsLoading(false);
      }
    },
    [currentPage, sort, order]
  );

  useEffect(() => {
    fetchConversions(false, currentPage);
  }, [fetchConversions, currentPage]);

  const handleRefresh = () => {
    fetchConversions(true, currentPage);
  };

  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [1];
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);
    if (startPage > 2) pages.push("ellipsis1");
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    if (endPage < totalPages - 1 && totalPages > 1) pages.push("ellipsis2");
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  // API returns created_at in Unix seconds
  const toMs = (seconds: number) => (seconds < 10000000000 ? seconds * 1000 : seconds);

  return (
    <div className="container mx-auto min-w-0 max-w-full p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold md:text-3xl">Conversions</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
            title="Refresh conversions"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={sort}
            onChange={(e) =>
              setSort(e.target.value as "ad_event_id" | "click_id" | "created_at")
            }
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                Sort by {opt.label}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOrder((o) => (o === "asc" ? "desc" : "asc"))}
          >
            {order === "desc" ? "Desc" : "Asc"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-destructive/15 p-4 text-destructive">
          {error}
          <Button variant="outline" size="sm" className="ml-2" onClick={handleRefresh}>
            Retry
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      ) : conversions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 px-6 py-12 text-center">
          <p className="mb-1 text-lg font-medium text-foreground">No conversions yet.</p>
          <p className="text-muted-foreground">
            Conversion events will appear here when they are recorded.
          </p>
        </div>
      ) : (
        <>
          <div className="min-w-0 overflow-x-auto rounded-md border bg-card [-webkit-overflow-scrolling:touch]">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b">
                  <th className="w-10 px-2 py-3 text-left text-sm font-medium text-muted-foreground" aria-label="Expand" />
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Ad event ID
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Click ID
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {conversions.map((c, idx) => (
                  <React.Fragment key={`${c.ad_event_id}-${c.created_at}-${idx}`}>
                    <tr
                      className="border-b last:border-0 hover:bg-muted/50"
                    >
                      <td className="w-10 px-2 py-3">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleRowExpansion(idx)}
                          aria-label={expandedRows.has(idx) ? "Collapse row" : "Expand row"}
                        >
                          {expandedRows.has(idx) ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm tabular-nums">
                        {c.ad_event_id}
                      </td>
                      <td className="px-4 py-3 font-mono text-sm tabular-nums">
                        {c.click_id}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDateTime(toMs(c.created_at), { format: FORMAT_DATETIME_24H })}
                      </td>
                    </tr>
                    {expandedRows.has(idx) && (
                      <tr className="bg-muted/20 border-b">
                        <td colSpan={4} className="px-6 py-4">
                          <div className="border-l-2 border-primary/50 pl-4">
                            <h4 className="text-sm font-medium mb-2">Payload</h4>
                            <pre className="text-sm text-muted-foreground whitespace-pre-wrap break-words font-mono rounded-md bg-muted/50 p-3 overflow-x-auto">
                              {formatPayload(c.payload)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        currentPage > 1 && handlePageChange(currentPage - 1)
                      }
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  {getPageNumbers().map((page, index) =>
                    page === "ellipsis1" || page === "ellipsis2" ? (
                      <PaginationItem key={`ellipsis-${index}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={page}>
                        <PaginationLink
                          isActive={currentPage === page}
                          onClick={() => handlePageChange(page as number)}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        currentPage < totalPages &&
                        handlePageChange(currentPage + 1)
                      }
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              <div className="mt-2 text-center text-sm text-muted-foreground">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of{" "}
                {totalItems} conversions
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
