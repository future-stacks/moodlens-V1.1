import React, { useEffect, useId, useRef } from 'react';
import { motion } from 'motion/react';
import { X, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogProps {
  title: string;
  icon?: LucideIcon;
  iconClassName?: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Hide the visible title (it is still announced). */
  hideTitle?: boolean;
  className?: string;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal dialog: labelled, traps focus, closes on Escape or
 * backdrop click, locks page scroll and restores focus when closed.
 */
export function Dialog({ title, icon: Icon, iconClassName, onClose, children, hideTitle, className }: DialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (items.length === 0) return;
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstItem) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault();
        firstItem.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#0d0d14]/85 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        initial={{ y: 24, opacity: 0.6 }}
        animate={{ y: 0, opacity: 1 }}
        className={cn(
          'relative flex max-h-[92dvh] w-full flex-col rounded-t-[28px] border border-white/10 bg-[#13131f] shadow-2xl outline-none sm:max-h-[85vh] sm:max-w-lg sm:rounded-[28px]',
          className,
        )}
      >
        <div className={cn('flex items-center justify-between gap-3 px-6 pt-6 sm:px-8 sm:pt-8', hideTitle ? 'pb-0' : 'pb-5')}>
          <div className={cn('flex items-center gap-3', hideTitle && 'sr-only')}>
            {Icon && (
              <span className={cn('rounded-xl bg-[#7c6af7]/10 p-2 text-[#a78bfa]', iconClassName)}>
                <Icon className="h-5 w-5" aria-hidden />
              </span>
            )}
            <h2 id={titleId} className="text-xl font-bold tracking-tight text-white">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-auto rounded-full p-2 text-[#8b8ba5] transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:outline-[#a78bfa]"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pb-8 sm:px-8">{children}</div>
      </motion.div>
    </motion.div>
  );
}
