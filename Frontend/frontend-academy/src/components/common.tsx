import type { LessonStatus } from '../types';
import { statusLabels } from '../lib/progress';

export function Status({ value }: { value: LessonStatus }) {
  return <span className={`status status-${value}`}><span aria-hidden="true" className="status-dot" />{statusLabels[value]}</span>;
}
export function Checklist({ items, checked, onChange }: { items: { id: string; text: string }[]; checked: string[]; onChange: (value: string[]) => void }) {
  return <div className="checklist">{items.map(item => <label key={item.id} className="check-item">
    <input type="checkbox" checked={checked.includes(item.id)} onChange={event => onChange(event.target.checked ? [...checked, item.id] : checked.filter(id => id !== item.id))} />
    <span>{item.text}</span>
  </label>)}</div>;
}
export function Bullets({ items }: { items: string[] }) { return <ul className="text-list">{items.map((item, i) => <li key={i}>{item}</li>)}</ul>; }
export function Meter({ value, total }: { value: number; total: number }) {
  return <div className="meter" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={total} aria-label="Прогресс прохождения"><span style={{ width: `${total ? value / total * 100 : 0}%` }} /></div>;
}
export function PageHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: React.ReactNode }) {
  return <header className="page-heading"><p className="eyebrow">{eyebrow}</p><h1 tabIndex={-1}>{title}</h1>{children && <p className="lead">{children}</p>}</header>;
}
export function Empty({ children }: { children: React.ReactNode }) { return <p className="empty-state">{children}</p>; }
