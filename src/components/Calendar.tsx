import { DayPicker } from 'react-day-picker';

type Props = {
  value: Date;
  onChange: (d: Date) => void;
  className?: string;
};

export default function CalendarRD({ value, onChange, className = '' }: Props) {
  return (
    <div className={`rounded-xl border border-zinc-200 p-3 ${className}`}>
      <DayPicker
        mode="single"
        selected={value}
        onSelect={(d) => d && onChange(d)}
        weekStartsOn={0}             // 0 = Sunday
        showOutsideDays
        className="rdp"              // class root
        classNames={{
          caption_label: 'text-lg font-inter font-light text-zinc-700',
          head_cell: 'text-xs text-zinc-500 font-normal',
          nav_button: 'rounded-lg px-2 py-1 hover:bg-zinc-100',
          table: 'w-full border-collapse',
          row: 'flex w-full',
          cell: 'p-0.1',
          day_button:
            'size-9 rounded-full text-sm hover:bg-zinc-100'+  
            'focus:ring-1 focus:ring-indigo-600 focus:bg-indigo-600 focus:text-white',
          selected: 'text-indigo-600 bg-indigo-100 rounded-br-lg ring-1 ring-indigo-100',
          today: 'font-medium text-xl',
          outside: 'text-zinc-400',
          disabled: 'opacity-50 pointer-events-none'
        }}
      />
    </div>
  );
}
