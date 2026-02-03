import { useState, useMemo, useEffect } from 'react';
import { useGetTrainingRecords, useSaveTrainingRecords } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Flame, Trash2 } from 'lucide-react';
import { getColorForHours, formatDateLocal, parseDateLocal } from '../lib/utils';
import type { TrainingSession } from '../backend';
import { toast } from 'sonner';

interface MonthLabel {
  name: string;
  columnIndex: number;
  weeks: number;
}

export default function TrainingHeatMap() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [themeKey, setThemeKey] = useState(0);
  
  const { data: sessions = [], isLoading } = useGetTrainingRecords();
  const saveRecordsMutation = useSaveTrainingRecords();

  // Listen for theme changes and immediately trigger color recalculation
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          // Force immediate re-render with new theme colors
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

  // Calculate daily training hours with exact date mapping using LOCAL TIME
  const dailyHours = useMemo(() => {
    const hoursMap = new Map<string, number>();
    
    sessions.forEach((session) => {
      // CRITICAL: Convert session timestamp to local date string for consistent mapping
      const sessionDate = new Date(Number(session.date) / 1000000);
      const dateStr = formatDateLocal(sessionDate);
      const hours = Number(session.duration) / 60;
      hoursMap.set(dateStr, (hoursMap.get(dateStr) || 0) + hours);
    });
    
    return hoursMap;
  }, [sessions]);

  // Get sessions for selected date with exact date matching
  const selectedDateSessions = useMemo(() => {
    if (!selectedDate) return [];
    
    return sessions.filter((session) => {
      const sessionDate = new Date(Number(session.date) / 1000000);
      const sessionDateStr = formatDateLocal(sessionDate);
      return sessionDateStr === selectedDate;
    });
  }, [sessions, selectedDate]);

  // Generate year grid with exact date anchoring using ISO weekday indexing
  const yearGrid = useMemo(() => {
    const jan1 = new Date(selectedYear, 0, 1);
    const dec31 = new Date(selectedYear, 11, 31);
    
    // Normalize to ISO weekday (Monday = 0, Sunday = 6)
    const jan1Weekday = (jan1.getDay() + 6) % 7;
    
    // Calculate total weeks needed
    const daysInYear = Math.floor((dec31.getTime() - jan1.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const totalWeeks = Math.ceil((jan1Weekday + daysInYear) / 7);
    
    // Build grid: weeks × 7 days (Monday to Sunday)
    const weeks: (string | null)[][] = [];
    
    for (let weekIdx = 0; weekIdx < totalWeeks; weekIdx++) {
      const week: (string | null)[] = [];
      
      for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
        // Calculate the date for this cell
        const dayOffset = weekIdx * 7 + dayIdx - jan1Weekday;
        
        if (dayOffset < 0 || dayOffset >= daysInYear) {
          // Blank cell (before Jan 1 or after Dec 31)
          week.push(null);
        } else {
          const date = new Date(selectedYear, 0, 1 + dayOffset);
          week.push(formatDateLocal(date));
        }
      }
      
      weeks.push(week);
    }
    
    return { weeks, jan1Weekday };
  }, [selectedYear]);

  // Calculate month labels - place each month label above the week column containing the 1st of that month
  const monthLabels = useMemo((): MonthLabel[] => {
    const labels: MonthLabel[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let month = 0; month < 12; month++) {
      const firstDay = new Date(selectedYear, month, 1);
      const firstDayStr = formatDateLocal(firstDay);
      
      // Find which week column contains this date
      let columnIndex = -1;
      for (let weekIdx = 0; weekIdx < yearGrid.weeks.length; weekIdx++) {
        if (yearGrid.weeks[weekIdx].includes(firstDayStr)) {
          columnIndex = weekIdx;
          break;
        }
      }
      
      if (columnIndex >= 0) {
        // Calculate how many weeks this month spans
        const lastDay = new Date(selectedYear, month + 1, 0);
        const lastDayStr = formatDateLocal(lastDay);
        
        let lastColumnIndex = columnIndex;
        for (let weekIdx = columnIndex; weekIdx < yearGrid.weeks.length; weekIdx++) {
          if (yearGrid.weeks[weekIdx].includes(lastDayStr)) {
            lastColumnIndex = weekIdx;
            break;
          }
        }
        
        labels.push({
          name: monthNames[month],
          columnIndex,
          weeks: lastColumnIndex - columnIndex + 1,
        });
      }
    }
    
    return labels;
  }, [selectedYear, yearGrid]);

  // Available years - dynamically expand as user navigates backward
  const availableYears = useMemo(() => {
    if (sessions.length === 0) {
      // If no sessions, show from selected year to current year
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
    
    // Add current year if not present
    years.add(currentYear);
    
    // Add selected year if not present (for navigation)
    years.add(selectedYear);
    
    return Array.from(years).sort((a, b) => b - a);
  }, [sessions, currentYear, selectedYear]);

  // Reset cell selection and hover states when year changes or grid recomputes
  // Only today's date should be selected by default
  useEffect(() => {
    const today = formatDateLocal(new Date());
    const todayYear = new Date().getFullYear();
    
    // Only select today if we're viewing the current year
    if (selectedYear === todayYear) {
      setSelectedDate(today);
    } else {
      setSelectedDate(null);
    }
  }, [selectedYear, yearGrid]);

  const handleDeleteSession = async (sessionId: string) => {
    const updatedSessions = sessions.filter((s) => s.id !== sessionId);
    
    try {
      await saveRecordsMutation.mutateAsync(updatedSessions);
      toast.success('Session deleted successfully');
      
      // Clear selection if no more sessions on this date
      const remainingSessions = updatedSessions.filter((s) => {
        const sessionDate = new Date(Number(s.date) / 1000000);
        const sessionDateStr = formatDateLocal(sessionDate);
        return sessionDateStr === selectedDate;
      });
      
      if (remainingSessions.length === 0) {
        setSelectedDate(null);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const handleYearChange = (direction: 'prev' | 'next') => {
    setSelectedYear((prev) => (direction === 'prev' ? prev - 1 : prev + 1));
  };

  const totalHours = useMemo(() => {
    let total = 0;
    dailyHours.forEach((hours) => {
      total += hours;
    });
    return Math.round(total * 10) / 10;
  }, [dailyHours]);

  const activeDays = dailyHours.size;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          Training Heat Map
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

        {/* Heat Map Grid - Monday to Sunday rows (top to bottom) with explicit day labels */}
        <div className="heat-map-container overflow-auto pb-0.5">
          <div className="min-w-max flex justify-center">
            <div className="inline-flex gap-1">
              {/* Day labels - All days Monday → Sunday displayed explicitly */}
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
                {/* Month headers - using CSS Grid with explicit row placement to prevent stacking */}
                <div 
                  className="grid gap-1 mb-1 h-4"
                  style={{
                    gridTemplateColumns: `repeat(${yearGrid.weeks.length}, 12px)`,
                  }}
                >
                  {monthLabels.map((month, idx) => (
                    <div
                      key={idx}
                      className="text-[10px] text-muted-foreground flex items-start leading-none"
                      style={{ 
                        gridColumnStart: month.columnIndex + 1,
                        gridColumnEnd: month.columnIndex + 1 + month.weeks,
                        gridRow: 1,
                      }}
                    >
                      {month.name}
                    </div>
                  ))}
                </div>

                {/* Week grid with exact date mapping - rows are Monday (0) to Sunday (6) */}
                <div className="flex gap-1">
                  {yearGrid.weeks.map((week, weekIdx) => (
                    <div key={weekIdx} className="flex flex-col gap-1 flex-shrink-0">
                      {week.map((day, dayIdx) => {
                        const hours = day ? dailyHours.get(day) || 0 : 0;
                        const color = day ? getColorForHours(hours, themeKey) : 'transparent';
                        const isSelected = day === selectedDate;
                        
                        return (
                          <button
                            key={dayIdx}
                            className={`w-3 h-3 rounded-sm transition-all ${
                              day ? 'cursor-pointer hover:ring-2 hover:ring-ring' : 'cursor-default'
                            } ${isSelected ? 'ring-2 ring-ring' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => day && setSelectedDate(day)}
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
                style={{ backgroundColor: getColorForHours(hours, themeKey) }}
                title={idx === 4 ? '3.5+ hours' : `${hours}+ hours`}
              />
            ))}
          </div>
          <span>More</span>
        </div>

        {/* Selected Date Details */}
        {selectedDate && selectedDateSessions.length > 0 && (
          <div className="border-t pt-4 space-y-3">
            <h4 className="font-semibold text-sm">
              {parseDateLocal(selectedDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </h4>
            <div className="space-y-2">
              {selectedDateSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {session.trainingType === 'gi' ? 'Gi' : 'No-Gi'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {Number(session.duration)} minutes
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteSession(session.id)}
                    disabled={saveRecordsMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">Loading heat map...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
