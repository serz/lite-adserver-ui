'use client';

import { useState, useCallback } from 'react';
import { Check, ChevronsUpDown, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const BROWSERS = [
  { id: 'chrome', name: 'Google Chrome' },
  { id: 'yandex', name: 'Yandex Browser' },
  { id: 'safari', name: 'Safari' },
  { id: 'edge', name: 'Microsoft Edge' },
  { id: 'firefox', name: 'Mozilla Firefox' },
  { id: 'opera', name: 'Opera' },
  { id: 'samsung_internet', name: 'Samsung Internet' },
  { id: 'uc', name: 'UC Browser' },
  { id: 'brave', name: 'Brave' },
  { id: 'vivaldi', name: 'Vivaldi' },
];

interface BrowserSelectorProps {
  selectedBrowsers: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  targetingMethod: 'whitelist' | 'blacklist';
  onTargetingMethodChange: (method: 'whitelist' | 'blacklist') => void;
}

export function BrowserSelector({
  selectedBrowsers,
  onChange,
  disabled = false,
  targetingMethod,
  onTargetingMethodChange,
}: BrowserSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const filteredBrowsers = BROWSERS.filter((browser) => {
    if (!searchValue) return true;
    return (
      browser.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      browser.id.toLowerCase().includes(searchValue.toLowerCase())
    );
  });

  const handleSelect = useCallback((id: string) => {
    if (selectedBrowsers.includes(id)) {
      onChange(selectedBrowsers.filter((b) => b !== id));
    } else {
      onChange([...selectedBrowsers, id]);
    }
  }, [selectedBrowsers, onChange]);

  const removeBrowser = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onChange(selectedBrowsers.filter((b) => b !== id));
  }, [selectedBrowsers, onChange]);

  const getBrowserName = (id: string) => {
    const browser = BROWSERS.find((b) => b.id === id);
    return browser ? browser.name : id;
  };

  return (
    <div className="space-y-2">
      <div className="flex space-x-2 items-center mb-2">
        <Button
          type="button"
          size="sm"
          variant={targetingMethod === 'whitelist' ? 'default' : 'outline'}
          onClick={() => onTargetingMethodChange('whitelist')}
          disabled={disabled}
          className="text-xs px-3"
        >
          Include (Whitelist)
        </Button>
        <Button
          type="button"
          size="sm"
          variant={targetingMethod === 'blacklist' ? 'default' : 'outline'}
          onClick={() => onTargetingMethodChange('blacklist')}
          disabled={disabled}
          className="text-xs px-3"
        >
          Exclude (Blacklist)
        </Button>
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between",
              !selectedBrowsers.length && "text-muted-foreground"
            )}
          >
            {selectedBrowsers.length > 0
              ? `${selectedBrowsers.length} ${selectedBrowsers.length === 1 ? 'browser' : 'browsers'} selected`
              : "Select browsers"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[350px] p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search browsers..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            {filteredBrowsers.length === 0 && (
              <CommandEmpty>No browsers found.</CommandEmpty>
            )}
            <CommandGroup className="max-h-[300px] overflow-auto">
              {filteredBrowsers.map((browser) => (
                <div
                  key={browser.id}
                  className={cn(
                    "flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                    selectedBrowsers.includes(browser.id) && "bg-accent/50"
                  )}
                  onClick={() => handleSelect(browser.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedBrowsers.includes(browser.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="flex-1">
                    {browser.name}
                  </span>
                </div>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      {selectedBrowsers.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedBrowsers.map((id) => (
            <Badge
              key={id}
              variant="paused"
              highContrast={true}
              radius="sm"
            >
              {getBrowserName(id)}
              <X
                className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={(e) => removeBrowser(e, id)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
} 