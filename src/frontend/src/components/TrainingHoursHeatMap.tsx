import { useState, useMemo, useEffect } from 'react';
import { useGetTrainingRecords, useSetTrainingHours, useGetAllTrainingHours, useClearTrainingHours } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, Clock, Plus, Minus, Save, X } from 'lucide-react';
import { formatDateLocal, parseDateLocal, getISOWeekday } from '../lib/utils';
import { toast } from 'sonner';

/**
 * Get color for training hours based on thresholds
 */
function getColorForHours(hours: number, isDark: boolean): string {
  if (hours === 0) {
    return isDark ? '#333333' : '#ebedf0';
  }
  if (hours < 1) return '#d6e685';
  if (hours < 2) return '#8cc665';
  if (hours < 3) return '#44a340';
  return '#1e6823';
}

/**
 * Generate 7×53/54 grid structure for the year with normalized ISO weekday calculations
 * Uses LOCAL TIME consistently throughout
 * 
 * CRITICAL: All date-to-row mappings use consistent ISO weekday indexing
 * - getISOWeekday() normalizes all dates to Monday=0, Sunday=6
 * - Grid rows strictly ordered: row 0 = Monday, row 6 = Sunday
 * - Each date placed in exact row matching its ISO weekday
 * - Ensures training log and heat map highlight correct cells for all dates
 */
function generateWeeklyGrid(year: number): {
  months: Array<{ name: string; column: number }>;
  weeks: Array<{ days: Array<string | null> }>;
} {
  const jan1 = new Date(year, 0, 1);
  const dec31 = new Date(year, 11, 31);
  
  // Get ISO weekday of January 1st using normalized calculation
  const jan1ISOWeekday = getISOWeekday(jan1);
  
  // Calculate the Monday of the week containing Jan 1
  const firstMonday = new Date(jan1);
  firstMonday.setDate(firstMonday.getDate() - jan1ISOWeekday);
  
  // Calculate the Sunday of the week containing Dec 31
  const dec31ISOWeekday = getISOWeekday(dec31);
  const lastSunday = new Date(dec31);
  lastSunday.setDate(lastSunday.getDate() + (6 - dec31ISOWeekday));
  
  // Calculate total weeks needed
  const totalDays = Math.ceil((lastSunday.getTime() - firstMonday.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const totalWeeks = Math.ceil(totalDays / 7);
  
  // Generate weeks with strict ISO weekday row mapping
  const weeks: Array<{ days: Array<string | null> }> = [];
  
  for (let weekIdx = 0; weekIdx < totalWeeks; weekIdx++) {
    // Initialize week with 7 null slots (Monday to Sunday, indices 0-6)
    const week: { days: Array<string | null> } = { 
      days: [null, null, null, null, null, null, null] 
    };
    
    // Calculate the Monday of this week
    const weekMonday = new Date(firstMonday);
    weekMonday.setDate(weekMonday.getDate() + (weekIdx * 7));
    
    // Fill in each day of the week using ISO weekday indexing
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const currentDate = new Date(weekMonday);
      currentDate.setDate(currentDate.getDate() + dayOffset);
      
      const isInYear = currentDate.getFullYear() === year;
      
      if (isInYear) {
        // CRITICAL: Use normalized ISO weekday to determine row position
        const isoWeekday = getISOWeekday(currentDate);
        
        // Place date in row matching its ISO weekday (0=Mon, 6=Sun)
        // dayOffset should match isoWeekday since we start from Monday
        week.days[isoWeekday] = formatDateLocal(currentDate);
      }
      // else: leave as null for dates outside the year
    }
    
    weeks.push(week);
  }
  
  // Calculate month headers - place label above week containing 1st of each month
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const months: Array<{ name: string; column: number }> = [];
  
  weeks.forEach((week, weekIdx) => {
    week.days.forEach((dateStr) => {
      if (dateStr) {
        const date = parseDateLocal(dateStr);
        const month = date.getMonth();
        const day = date.getDate();
        
        if (day === 1 && !months.find(m => m.name === monthNames[month])) {
          months.push({
            name: monthNames[month],
            column: weekIdx
          });
        }
      }
    });
  });
  
  return { months, weeks };
}

interface TrainingHoursHeatMapProps {
  selectedDate?: string | null;
  onDateSelect?: (date: string | null) => void;
}

export default function TrainingHoursHeatMap({ selectedDate: externalSelectedDate, onDateSelect }: TrainingHoursHeatMapProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [internalSelectedDate, setInternalSelectedDate] = useState<string | null>(null);
  const [themeKey, setThemeKey] = useState(0);
  
  // Input state
  const [inputDate, setInputDate] = useState<string>('');
  const [inputHours, setInputHours] = useState<number>(0);
  
  const { data: sessions = [], isLoading } = useGetTrainingRecords();
  const { data: trainingHoursData = [], refetch: refetchTrainingHours } = useGetAllTrainingHours();
  const setTrainingHoursMutation = useSetTrainingHours();
  const clearTrainingHoursMutation = useClearTrainingHours();

  // Use external selected date if provided, otherwise use internal state
  const selectedDate = externalSelectedDate !== undefined ? externalSelectedDate : internalSelectedDate;
  const setSelectedDate = onDateSelect || setInternalSelectedDate;

  // Listen for theme changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setThemeKey((prev) => prev + 1);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Calculate daily training hours from sessions using LOCAL TIME
  const sessionHours = useMemo(() => {
    const hoursMap = new Map<string, number>();
    
    sessions.forEach((session) => {
      // CRITICAL: Parse date in local time to match storage format
      const sessionDate = new Date(Number(session.date) / 1000000);
      const dateStr = formatDateLocal(sessionDate);
      const hours = Number(session.duration) / 60;
      hoursMap.set(dateStr, (hoursMap.get(dateStr) || 0) + hours);
    });
    
    return hoursMap;
  }, [sessions]);

  // Calculate daily training hours from manual input
  const manualHours = useMemo(() => {
    const hoursMap = new Map<string, number>();
    
    trainingHoursData.forEach((record) => {
      hoursMap.set(record.date, record.hours);
    });
    
    return hoursMap;
  }, [trainingHoursData]);

  // Combine session hours and manual hours
  const dailyHours = useMemo(() => {
    const combined = new Map<string, number>();
    
    // Add session hours
    sessionHours.forEach((hours, date) => {
      combined.set(date, hours);
    });
    
    // Add or override with manual hours
    manualHours.forEach((hours, date) => {
      combined.set(date, hours);
    });
    
    return combined;
  }, [sessionHours, manualHours]);

  // Generate year grid with normalized ISO weekday calculations
  const yearGrid = useMemo(() => generateWeeklyGrid(selectedYear), [selectedYear]);

  // Available years
  const availableYears = useMemo(() => {
    if (sessions.length === 0) {
      const years: number[] = [];
      for (let y = selectedYear; y <= currentYear; y++) {
        years.push(y);
      }
      return years.sort((a, b) => b - a);
    }
    
    const years = new Set<number>();
    sessions.forEach((session) => {
      const year = new Date(Number(session.date) / 1000000).getFullYear();
      years.add(year);
    });
    
    years.add(currentYear);
    years.add(selectedYear);
    
    return Array.from(years).sort((a, b) => b - a);
  }, [sessions, currentYear, selectedYear]);

  // Reset selection when year changes
  useEffect(() => {
    const today = formatDateLocal(new Date());
    const todayYear = new Date().getFullYear();
    
    if (selectedYear === todayYear) {
      setSelectedDate(today);
      setInputDate(today);
    } else {
      setSelectedDate(null);
      setInputDate('');
    }
    setInputHours(0);
  }, [selectedYear, yearGrid, setSelectedDate]);

  // Update input when date is selected from grid
  useEffect(() => {
    if (selectedDate) {
      setInputDate(selectedDate);
      const hours = dailyHours.get(selectedDate) || 0;
      setInputHours(Math.round(hours * 4) / 4); // Round to nearest 0.25
    }
  }, [selectedDate, dailyHours]);

  const handleYearChange = (direction: 'prev' | 'next') => {
    setSelectedYear((prev) => (direction === 'prev' ? prev - 1 : prev + 1));
  };

  const handleHoursIncrement = (amount: number) => {
    setInputHours((prev) => Math.max(0, Math.round((prev + amount) * 4) / 4));
  };

  const handleQuickSelect = (hours: number) => {
    setInputHours(hours);
  };

  const handleSave = async () => {
    if (!inputDate) {
      toast.error('Please select a date');
      return;
    }

    if (inputHours < 0) {
      toast.error('Training hours must be 0 or positive');
      return;
    }

    try {
      await setTrainingHoursMutation.mutateAsync({ date: inputDate, hours: inputHours });
      await refetchTrainingHours();
      toast.success(`Training hours updated: ${inputHours}h on ${inputDate}`);
    } catch (error: any) {
      toast.error(`Failed to save: ${error.message}`);
    }
  };

  const handleClear = async () => {
    if (!inputDate) {
      toast.error('Please select a date');
      return;
    }

    try {
      await clearTrainingHoursMutation.mutateAsync(inputDate);
      await refetchTrainingHours();
      setInputHours(0);
      toast.success(`Training hours cleared for ${inputDate}`);
    } catch (error: any) {
      toast.error(`Failed to clear: ${error.message}`);
    }
  };

  const totalHours = useMemo(() => {
    let total = 0;
    dailyHours.forEach((hours) => {
      total += hours;
    });
    return Math.round(total * 10) / 10;
  }, [dailyHours]);

  const activeDays = dailyHours.size;
  const isDark = document.documentElement.classList.contains('dark');

  const isSaving = setTrainingHoursMutation.isPending || clearTrainingHoursMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-500" />
          Training Hours Heat Map
        </CardTitle>
        <CardDescription>
          {totalHours}h trained across {activeDays} days in {selectedYear}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Year Selector */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleYearChange('prev')}
            disabled={isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => {
              setSelectedYear(parseInt(value));
            }}
            disabled={isLoading}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleYearChange('next')}
            disabled={isLoading || selectedYear >= currentYear}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Input Option Area */}
        <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
          <h3 className="text-sm font-semibold">Adjust Training Hours</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date Input */}
            <div className="space-y-2">
              <Label htmlFor="input-date">Date</Label>
              <Input
                id="input-date"
                type="date"
                value={inputDate}
                onChange={(e) => {
                  setInputDate(e.target.value);
                  setSelectedDate(e.target.value);
                }}
                max={new Date().toISOString().split('T')[0]}
                disabled={isSaving}
              />
            </div>

            {/* Hours Input */}
            <div className="space-y-2">
              <Label htmlFor="input-hours">Training Hours</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleHoursIncrement(-0.25)}
                  disabled={isSaving || inputHours <= 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="input-hours"
                  type="number"
                  value={inputHours}
                  onChange={(e) => setInputHours(Math.max(0, parseFloat(e.target.value) || 0))}
                  step="0.25"
                  min="0"
                  max="24"
                  className="text-center"
                  disabled={isSaving}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleHoursIncrement(0.25)}
                  disabled={isSaving || inputHours >= 24}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Selection Buttons */}
          <div className="space-y-2">
            <Label>Quick Select</Label>
            <div className="flex flex-wrap gap-2">
              {[0.5, 1, 1.5, 2, 3, 4].map((hours) => (
                <Button
                  key={hours}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickSelect(hours)}
                  disabled={isSaving}
                  className={inputHours === hours ? 'bg-primary text-primary-foreground' : ''}
                >
                  {hours}h
                </Button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={!inputDate || isSaving}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button
              variant="outline"
              onClick={handleClear}
              disabled={!inputDate || isSaving}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          </div>
        </div>

        {/* Heat Map Grid - 7 rows (Mon-Sun) × 53/54 columns (weeks) */}
        <div className="heat-map-container overflow-auto pb-0.5">
          <div className="min-w-max flex justify-center">
            <div className="inline-flex gap-1">
              {/* Day labels - Monday → Sunday (rows 0-6) */}
              <div className="flex flex-col justify-start pt-5 flex-shrink-0">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <div
                    key={day}
                    className="h-3 flex items-center text-[10px] text-muted-foreground mb-1"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Grid */}
              <div className="flex-1">
                {/* Month headers - all aligned to same baseline */}
                <div className="flex mb-1 h-4 relative">
                  {yearGrid.months.map((month, idx) => (
                    <div
                      key={idx}
                      className="text-[10px] text-muted-foreground absolute leading-none"
                      style={{ 
                        left: `${month.column * 14}px`,
                        top: 0,
                      }}
                    >
                      {month.name}
                    </div>
                  ))}
                </div>

                {/* Week grid - rows are Monday (0) to Sunday (6) using ISO weekday indexing */}
                <div className="flex gap-1">
                  {yearGrid.weeks.map((week, weekIdx) => (
                    <div key={weekIdx} className="flex flex-col gap-1 flex-shrink-0">
                      {week.days.map((day, dayIdx) => {
                        const hours = day ? dailyHours.get(day) || 0 : 0;
                        const color = day ? getColorForHours(hours, isDark) : 'transparent';
                        const isSelected = day === selectedDate;
                        
                        return (
                          <button
                            key={dayIdx}
                            className={`w-3 h-3 rounded-sm transition-all ${
                              day ? 'cursor-pointer hover:ring-2 hover:ring-ring' : 'cursor-default'
                            } ${isSelected ? 'ring-2 ring-ring' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => {
                              if (day) {
                                setSelectedDate(day);
                                setInputDate(day);
                              }
                            }}
                            disabled={!day || isLoading}
                            title={day ? `${day}: ${hours.toFixed(1)}h` : ''}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 0.5, 1.5, 2.5, 3.5].map((hours, idx) => (
              <div
                key={idx}
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: getColorForHours(hours, isDark) }}
                title={
                  hours === 0 ? '0 hours' :
                  idx === 4 ? '3+ hours' : 
                  `${hours}-${hours + 1} hours`
                }
              />
            ))}
          </div>
          <span>More</span>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">Loading heat map...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
