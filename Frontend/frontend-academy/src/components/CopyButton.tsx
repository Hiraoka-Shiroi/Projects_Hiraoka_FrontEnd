import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
export function CopyButton({ text, label = 'Скопировать пример' }: { text: string; label?: string }) {
  const [feedback, setFeedback] = useState('');
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  return <span className="copy-control"><button onClick={async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Unavailable');
      await navigator.clipboard.writeText(text);
      if (active.current) setFeedback('Скопировано');
    } catch { if (active.current) setFeedback('Браузер не разрешил копирование. Выдели код и нажми Ctrl+C.'); }
  }}><Icon name="copy" size={16} />{label}</button>{feedback && <span role="status">{feedback}</span>}</span>;
}
