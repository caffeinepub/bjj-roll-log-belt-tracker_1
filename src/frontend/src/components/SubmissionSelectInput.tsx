import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { SUBMISSION_OPTIONS } from '../lib/submissionOptions';
import type { SubmissionCount } from '../backend';
import { normalizeSubmissionName } from '../lib/submissionLogUtils';

interface SubmissionSelectInputProps {
  beltLabel: string;
  submissions: SubmissionCount[];
  onAdd: (name: string) => void;
}

export default function SubmissionSelectInput({
  beltLabel,
  submissions,
  onAdd,
}: SubmissionSelectInputProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Get list of already selected submission names (normalized)
  const selectedNames = new Set(
    submissions.map((sub) => normalizeSubmissionName(sub.name))
  );

  // Filter options based on search and exclude already selected
  const filteredOptions = SUBMISSION_OPTIONS.filter((option) => {
    const matchesSearch = option.toLowerCase().includes(searchValue.toLowerCase());
    const notSelected = !selectedNames.has(normalizeSubmissionName(option));
    return matchesSearch && notSelected;
  });

  // Reset highlighted index when filtered options change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchValue]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const handleSelect = (value: string) => {
    onAdd(value);
    setOpen(false);
    setSearchValue('');
    setHighlightedIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredOptions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setOpen(false);
        setSearchValue('');
        break;
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <Search className="mr-2 h-4 w-4" />
          <span>Add submission...</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <div className="flex flex-col">
          <div className="border-b p-2">
            <Input
              ref={inputRef}
              placeholder="Search submissions..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-9 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <ScrollArea className="h-[280px]">
            <div ref={listRef} className="p-1">
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No submissions found
                </div>
              ) : (
                filteredOptions.map((option, index) => (
                  <button
                    key={option}
                    onClick={() => handleSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm rounded-sm transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      'focus:bg-accent focus:text-accent-foreground focus:outline-none',
                      highlightedIndex === index && 'bg-accent text-accent-foreground'
                    )}
                  >
                    {option}
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}
