import { useState, useRef, useEffect } from 'react';
import { format, subDays, isWithinInterval, isSameDay } from 'date-fns';
import { Popover, Transition } from '@headlessui/react';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onChange: (startDate: Date, endDate: Date) => void;
  className?: string;
  showPresets?: boolean;
}

const PRESETS = [
  { name: 'Today', value: 'today' },
  { name: 'Yesterday', value: 'yesterday' },
  { name: 'Last 7 Days', value: 'last7' },
  { name: 'Last 30 Days', value: 'last30' },
  { name: 'This Month', value: 'thisMonth' },
  { name: 'Last Month', value: 'lastMonth' },
];

export function DateRangePicker({
  startDate,
  endDate,
  onChange,
  className = '',
  showPresets = true,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'calendar' | 'presets'>('presets');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Format date range for display
  const formatDateRange = () => {
    if (isSameDay(startDate, endDate)) {
      return format(startDate, 'MMM d, yyyy');
    }
    return `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;
  };

  // Handle preset selection
  const handlePresetSelect = (preset: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let newStartDate = new Date();
    let newEndDate = new Date();

    switch (preset) {
      case 'today':
        newStartDate = today;
        newEndDate = today;
        break;
      case 'yesterday':
        newStartDate = subDays(today, 1);
        newEndDate = new Date(newStartDate);
        break;
      case 'last7':
        newStartDate = subDays(today, 6);
        newEndDate = today;
        break;
      case 'last30':
        newStartDate = subDays(today, 29);
        newEndDate = today;
        break;
      case 'thisMonth':
        newStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
        newEndDate = today;
        break;
      case 'lastMonth':
        newStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        newEndDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      default:
        break;
    }

    onChange(newStartDate, newEndDate);
    setView('calendar');
  };

  // Handle day selection
  const handleDayClick = (day: Date) => {
    if (startDate && !endDate && day > startDate) {
      onChange(startDate, day);
    } else {
      onChange(day, day);
    }
  };

  // Check if a day is selected
  const isSelected = (day: Date) => {
    return (
      isSameDay(day, startDate) ||
      isSameDay(day, endDate) ||
      (startDate &&
        endDate &&
        isWithinInterval(day, { start: startDate, end: endDate }))
    );
  };

  // Check if a day is start/end of selection
  const isStart = (day: Date) => isSameDay(day, startDate);
  const isEnd = (day: Date) => isSameDay(day, endDate);

  // Generate days for the current month view
  const generateDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    
    const daysInMonth = lastDay.getDate();
    const daysInLastMonth = new Date(year, month, 0).getDate();
    
    const days = [];
    
    // Previous month days
    for (let i = startDay - 1; i >= 0; i--) {
      const day = new Date(year, month - 1, daysInLastMonth - i);
      days.push({
        date: day,
        isCurrentMonth: false,
        isSelected: isSelected(day),
        isStart: isStart(day),
        isEnd: isEnd(day),
      });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const day = new Date(year, month, i);
      days.push({
        date: day,
        isCurrentMonth: true,
        isSelected: isSelected(day),
        isStart: isStart(day),
        isEnd: isEnd(day),
      });
    }
    
    // Next month days
    const remainingDays = 42 - days.length; // 6 rows of 7 days
    for (let i = 1; i <= remainingDays; i++) {
      const day = new Date(year, month + 1, i);
      days.push({
        date: day,
        isCurrentMonth: false,
        isSelected: isSelected(day),
        isStart: isStart(day),
        isEnd: isEnd(day),
      });
    }
    
    return days;
  };

  // Navigate months
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  return (
    <Popover className={`relative ${className}`}>
      {({ open }) => (
        <>
          <Popover.Button
            ref={buttonRef}
            className={`inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${open ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setIsOpen(!isOpen)}
          >
            <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
            {formatDateRange()}
          </Popover.Button>

          <Transition
            show={open}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel 
              static
              className="absolute z-10 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden"
            >
              <div className="p-4">
                {showPresets && view === 'presets' && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quick Select</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {PRESETS.map((preset) => (
                        <button
                          key={preset.value}
                          type="button"
                          className="px-3 py-2 text-sm text-left rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
                          onClick={() => handlePresetSelect(preset.value)}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="mt-2 w-full text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      onClick={() => setView('calendar')}
                    >
                      Custom date range
                    </button>
                  </div>
                )}

                {(view === 'calendar' || !showPresets) && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <button
                        type="button"
                        onClick={prevMonth}
                        className="p-1 rounded-full text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <ChevronLeftIcon className="h-5 w-5" />
                      </button>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                        {format(currentMonth, 'MMMM yyyy')}
                      </h3>
                      <button
                        type="button"
                        onClick={nextMonth}
                        className="p-1 rounded-full text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <ChevronRightIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs leading-6 text-gray-500 dark:text-gray-400">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                        <div key={day} className="h-6 flex items-center justify-center">
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {generateDays().map((day, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleDayClick(day.date)}
                          disabled={!day.isCurrentMonth}
                          className={[
                            'h-8 w-8 mx-auto rounded-full text-sm flex items-center justify-center',
                            day.isCurrentMonth
                              ? 'text-gray-900 dark:text-white'
                              : 'text-gray-400 dark:text-gray-500',
                            day.isSelected
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700',
                            day.isStart && 'rounded-r-none',
                            day.isEnd && 'rounded-l-none',
                            day.isSelected && !day.isStart && !day.isEnd && 'rounded-none',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          {day.date.getDate()}
                        </button>
                      ))}
                    </div>
                    {showPresets && (
                      <button
                        type="button"
                        className="mt-2 w-full text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        onClick={() => setView('presets')}
                      >
                        Preset ranges
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setView(showPresets ? 'presets' : 'calendar');
                  }}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-500 dark:hover:text-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setView(showPresets ? 'presets' : 'calendar');
                  }}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Apply
                </button>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
}
