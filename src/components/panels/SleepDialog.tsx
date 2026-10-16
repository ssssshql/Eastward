import React from 'react';
import { Modal } from '../Modal';
import { formatTime } from '../../utils/items';

interface SleepDialogProps {
  time: number;
  onSleep: () => void;
  onCancel: () => void;
}

export function SleepDialog({ time, onSleep, onCancel }: SleepDialogProps) {
  const early = time < 18 * 60;
  return (
    <Modal title="今天就到这里吧？" subtitle={`现在是 ${formatTime(time)}${early ? ' · 天色还早' : ''}`} onClose={onCancel} className="w-[420px]">
      <p className="px-7 pt-5 text-sm leading-relaxed text-cream-dim">睡一觉，作物会在夜里悄悄长大，出货箱里的东西也会在清晨结算。进度会自动保存。</p>
      <div className="flex justify-end gap-2 px-7 pb-6 pt-5">
        <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 text-sm text-cream-dim transition-colors duration-150 hover:bg-cream/10 hover:text-cream">
          再待一会
        </button>
        <button type="button" autoFocus onClick={onSleep} className="rounded-lg bg-amber px-4 py-2 text-sm font-medium text-ink transition-colors duration-150 hover:bg-amber-deep">
          睡觉
        </button>
      </div>
    </Modal>);

}