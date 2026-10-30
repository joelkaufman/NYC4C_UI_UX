import type { ModuleId } from '@/domain/types';
import { MODULE_HUES, MODULE_ICONS } from '@/components/layout/module-status';
import { cn } from '@/lib/utils';

/** Tinted icon tile carrying a module's hue. Muted when the module is locked. */
export function ModuleTile({ id, size = 'md', muted, className }: { id: ModuleId; size?: 'sm' | 'md'; muted?: boolean; className?: string }) {
  const Icon = MODULE_ICONS[id];
  const hue = MODULE_HUES[id];
  return (
    <span
      className={cn('flex shrink-0 items-center justify-center rounded-md', size === 'sm' ? 'h-7 w-7' : 'h-9 w-9', className)}
      style={{ color: muted ? '#6C6C70' : hue.fg }}
      aria-hidden
    >
      <Icon className={size === 'sm' ? 'h-4 w-4' : 'h-[18px] w-[18px]'} />
    </span>
  );
}
