'use client';

import { useState, useRef, useCallback } from 'react';
import { Check, ChevronsUpDown, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { COUNTRIES } from '@/lib/constants/countries';
import { cn } from '@/lib/utils';

interface CountrySelectorProps {
  selectedCountries: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  targetingMethod: 'whitelist' | 'blacklist';
  onTargetingMethodChange: (method: 'whitelist' | 'blacklist') => void;
}

export function CountrySelector({
  selectedCountries,
  onChange,
  disabled = false,
  targetingMethod,
  onTargetingMethodChange,
}: CountrySelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  
  // Filter countries based on search input
  const filteredCountries = COUNTRIES.filter((country) => {
    if (!searchValue) return true;
    
    return (
      country.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      country.code.toLowerCase().includes(searchValue.toLowerCase())
    );
  });
  
  // Handle country selection
  const handleSelect = useCallback((code: string) => {
    // Create a new array to trigger state update
    if (selectedCountries.includes(code)) {
      onChange(selectedCountries.filter((c) => c !== code));
    } else {
      onChange([...selectedCountries, code]);
    }
    // Don't close the popover
  }, [selectedCountries, onChange]);
  
  // Handle removing a country from the selection
  const removeCountry = useCallback((e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    onChange(selectedCountries.filter((c) => c !== code));
  }, [selectedCountries, onChange]);
  
  // Get country name by code
  const getCountryName = (code: string) => {
    const country = COUNTRIES.find((c) => c.code === code);
    return country ? country.name : code;
  };
  
  return (
    <div className="space-y-2">
      {/* Targeting Method Selection */}
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
              !selectedCountries.length && "text-muted-foreground"
            )}
          >
            {selectedCountries.length > 0
              ? `${selectedCountries.length} ${selectedCountries.length === 1 ? 'country' : 'countries'} selected`
              : "Select countries"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[350px] p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search countries..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            {filteredCountries.length === 0 && (
              <CommandEmpty>No countries found.</CommandEmpty>
            )}
            <CommandGroup className="max-h-[300px] overflow-auto">
              {filteredCountries.map((country) => (
                <div 
                  key={country.code} 
                  className={cn(
                    "flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                    selectedCountries.includes(country.code) && "bg-accent/50"
                  )}
                  onClick={() => handleSelect(country.code)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedCountries.includes(country.code) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="flex-1">
                    {country.name} ({country.code})
                  </span>
                </div>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      
      {/* Display selected countries */}
      {selectedCountries.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedCountries.map((code) => (
            <Badge key={code} variant="secondary" className="text-xs py-1 px-2">
              {getCountryName(code)} ({code})
              <X
                className="ml-1 h-3 w-3 cursor-pointer"
                onClick={(e) => removeCountry(e, code)}
              />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
} 