"use client"

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ReactNode } from "react";

interface AdvancedListProps<T> {
  items: T[];
  title: string | ReactNode;
  isLoading?: boolean;
  searchPlaceholder?: string;
  renderItem: (item: T) => React.ReactNode;
  filterItem: (item: T, searchQuery: string) => boolean;
  height?: string | number;
}

export function AdvancedList<T>({ 
  items, 
  title, 
  isLoading = false, 
  searchPlaceholder = "Search...",
  renderItem,
  filterItem,
  height = "calc(100vh - 250px)"
}: AdvancedListProps<T>) {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter items based on search query using the provided filter function
  const filteredItems = items?.filter(item => filterItem(item, searchQuery.toLowerCase())) || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <p>Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>{title}</CardTitle>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={searchPlaceholder}
              className="w-full sm:w-[250px] pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredItems.length === 0 ? (
          <div className="flex items-center justify-center p-4">
            <p>{searchQuery ? "No items match your search" : "No items found"}</p>
          </div>
        ) : (
          <ScrollArea className="h-full" style={{ height: typeof height === 'number' ? `${height}px` : height }}>
            <div className="space-y-4">
              {filteredItems.map((item, index) => (
                <div key={index}>
                  {renderItem(item)}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredItems.length} of {items?.length || 0} items
        </div>
      </CardContent>
    </Card>
  );
} 