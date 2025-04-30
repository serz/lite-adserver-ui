'use client';

import { useState, useRef, useCallback } from 'react';
import { Check, ChevronsUpDown, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Zone } from '@/types/api';
import { cn } from '@/lib/utils';
import { TargetingButton } from '@/components/targeting-button';

interface ZoneSelectorProps {
  zones: Zone[];
  selectedZoneIds: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  targetingMethod: 'whitelist' | 'blacklist';
  onTargetingMethodChange: (method: 'whitelist' | 'blacklist') => void;
}

export function ZoneSelector({
  zones,
  selectedZoneIds,
  onChange,
  disabled = false,
  targetingMethod,
  onTargetingMethodChange,
}: ZoneSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  
  // Filter zones based on search input
  const filteredZones = zones.filter((zone) => {
    if (!searchValue) return true;
    
    return (
      zone.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      zone.id.toString().includes(searchValue)
    );
  });
  
  // Handle zone selection
  const handleSelect = useCallback((zoneId: string) => {
    // Create a new array to trigger state update
    if (selectedZoneIds.includes(zoneId)) {
      onChange(selectedZoneIds.filter((id) => id !== zoneId));
    } else {
      onChange([...selectedZoneIds, zoneId]);
    }
    // Don't close the popover
  }, [selectedZoneIds, onChange]);
  
  // Handle removing a zone from the selection
  const removeZone = useCallback((e: React.MouseEvent, zoneId: string) => {
    e.stopPropagation();
    onChange(selectedZoneIds.filter((id) => id !== zoneId));
  }, [selectedZoneIds, onChange]);
  
  // Get zone name by id
  const getZoneName = (zoneId: string) => {
    const zone = zones.find((z) => z.id.toString() === zoneId);
    return zone ? zone.name : `Zone ${zoneId}`;
  };
  
  return (
    <div className="space-y-2">
      {/* Targeting Method Selection */}
      <div className="flex space-x-2 items-center mb-2">
        <TargetingButton
          active={targetingMethod === 'whitelist'}
          onClick={() => onTargetingMethodChange('whitelist')}
          disabled={disabled}
          indicator="green"
        >
          Include (Whitelist)
        </TargetingButton>
        <TargetingButton
          active={targetingMethod === 'blacklist'}
          onClick={() => onTargetingMethodChange('blacklist')}
          disabled={disabled}
          indicator="red"
        >
          Exclude (Blacklist)
        </TargetingButton>
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
              !selectedZoneIds.length && "text-muted-foreground"
            )}
          >
            {selectedZoneIds.length > 0
              ? `${selectedZoneIds.length} ${selectedZoneIds.length === 1 ? 'zone' : 'zones'} selected`
              : "Select zones"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[350px] p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search zones..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            {filteredZones.length === 0 && (
              <CommandEmpty>No zones found.</CommandEmpty>
            )}
            <CommandGroup className="max-h-[300px] overflow-auto">
              {filteredZones.map((zone) => (
                <div 
                  key={zone.id} 
                  className={cn(
                    "flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                    selectedZoneIds.includes(zone.id.toString()) && "bg-accent/50"
                  )}
                  onClick={() => handleSelect(zone.id.toString())}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedZoneIds.includes(zone.id.toString()) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="flex-1">
                    {zone.name} (ID: {zone.id})
                  </span>
                </div>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Display selected zones */}
      {selectedZoneIds.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedZoneIds.map((zoneId) => (
            <Badge 
              key={zoneId} 
              variant="paused" 
              highContrast={true}
              radius="sm"
            >
              {getZoneName(zoneId)} (ID: {zoneId})
              <X
                className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={(e) => removeZone(e, zoneId)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
} 