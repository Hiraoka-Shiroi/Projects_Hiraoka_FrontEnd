import { useState } from 'react';
import type { GuidedStep } from '../types';
import { Icon } from './Icon';

export function LessonPreview({ step, lessonId, open }: { step: GuidedStep; lessonId: number; open: () => void }) {
  const [tab, setTab] = useState<'code' | 'trace' | 'result'>('code');
  return <div className="code-playground">
    <div className="editor-top"><span className="editor-dots" aria-hidden="true"><i /><i /><i /></span><span>lesson-{lessonId}.js</span><Icon name="code" size={16} /></div>
    <div className="demo-switches" aria-label="Разбор примера"><button aria-pressed={tab === 'code'} onClick={() => setTab('code')}>1. Пример</button><button aria-pressed={tab === 'trace'} onClick={() => setTab('trace')}>2. Как работает</button><button aria-pressed={tab === 'result'} onClick={() => setTab('result')}>3. Вывод</button></div>
    <div className="preview-body" aria-live="polite">{tab === 'trace' ? <ol>{step.trace.map(line => <li key={line}>{line}</li>)}</ol> : <pre className="editor-code"><code>{tab === 'code' ? step.code : step.result}</code></pre>}</div>
    <div className="demo-explanation"><span className="demo-step-icon"><Icon name="play" size={17} /></span><p>{step.goal}</p></div>
    <button className="text-button demo-open" onClick={open}>Открыть этот шаг <Icon name="arrow" size={16} /></button>
  </div>;
}
