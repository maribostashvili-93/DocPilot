import { useState } from 'react';

interface Props {
  companyId: string;
  documentId: string;
  sectionId?: string;
  locale?: string;
}

export function ReaderFeedback({ companyId, documentId, sectionId, locale }: Props) {
  const [state, setState] = useState<'idle' | 'comment' | 'done'>('idle');
  const [rating, setRating] = useState<string>('');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(selectedRating: string, withComment = false) {
    if (busy) return;
    if (withComment && !comment.trim()) {
      setRating(selectedRating);
      setState('comment');
      return;
    }
    setBusy(true);
    try {
      await fetch('/api/v2/public/reader/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId, documentId, sectionId: sectionId ?? null,
          locale: locale ?? null, rating: selectedRating,
          comment: comment.trim() || null,
          url: window.location.href,
        }),
      });
      void fetch('/api/v2/public/reader/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId, eventName: 'reader.feedback_submitted',
          documentId, sectionId: sectionId ?? null, locale: locale ?? null,
          metadata: { rating: selectedRating },
        }),
      });
      setState('done');
    } catch {
      setState('done');
    } finally {
      setBusy(false);
    }
  }

  if (state === 'done') {
    return (
      <div className="reader-feedback reader-feedback--done">
        Thanks for your feedback!
      </div>
    );
  }

  if (state === 'comment') {
    return (
      <div className="reader-feedback reader-feedback--comment">
        <span className="reader-feedback-label">What could be improved?</span>
        <textarea
          className="reader-feedback-textarea"
          rows={3}
          placeholder="Optional — describe the issue"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <div className="reader-feedback-actions">
          <button
            type="button"
            className="ds-btn ds-btn-sm ds-btn-secondary"
            onClick={() => submit(rating)}
          >
            Skip
          </button>
          <button
            type="button"
            className="ds-btn ds-btn-sm ds-btn-primary"
            disabled={busy}
            onClick={() => submit(rating, false)}
          >
            {busy ? 'Sending…' : 'Send'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reader-feedback">
      <span className="reader-feedback-label">Was this helpful?</span>
      <button
        type="button"
        className="ds-btn ds-btn-sm ds-btn-ghost"
        onClick={() => submit('helpful')}
        disabled={busy}
      >
        Yes
      </button>
      <button
        type="button"
        className="ds-btn ds-btn-sm ds-btn-ghost"
        onClick={() => { setRating('not-helpful'); setState('comment'); }}
        disabled={busy}
      >
        No
      </button>
    </div>
  );
}
