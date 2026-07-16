import { useEffect } from 'react';

interface Props {
  message: string;
  actionLabel: string;
  onAction: () => void;
  onDismiss: () => void;
}

/** 5-second undo window (plan.md §3.1). */
export function Toast({ message, actionLabel, onAction, onDismiss }: Props) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="toast" role="status">
      <span>{message}</span>
      <button className="toast__action" onClick={onAction}>{actionLabel}</button>
    </div>
  );
}
