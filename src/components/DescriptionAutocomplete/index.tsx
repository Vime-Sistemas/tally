import React, { useEffect, useRef, useState } from 'react';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';

const STORAGE_KEY = 'tally_descriptions_v1';

function encode(text: string) {
  try { return btoa(unescape(encodeURIComponent(text))); } catch { return text; }
}
function decode(text: string) {
  try { return decodeURIComponent(escape(atob(text))); } catch { return text; }
}

export function getStoredDescriptions(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr: string[] = JSON.parse(raw);
    return arr.map(decode);
  } catch {
    return [];
  }
}

export function addStoredDescription(text: string) {
  try {
    const t = (text || '').trim();
    if (!t) return;
    const existing = getStoredDescriptions();
    // keep uniqueness, most recent first
    const filtered = [t, ...existing.filter(x => x !== t)].slice(0, 200);
    const enc = filtered.map(encode);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(enc));
  } catch (e) {
    // ignore
  }
}

interface Props {
  placeholder?: string;
  className?: string;
  // react-hook-form register props (optional)
  inputProps?: any;
  value?: string;
  onChange?: (v: string) => void;
}

export function DescriptionAutocomplete({ placeholder, className, inputProps, value, onChange }: Props) {
  const ref = useRef<HTMLInputElement | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onStorage = () => {};
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const updateSuggestions = (v: string) => {
    const all = getStoredDescriptions();
    const s = v ? all.filter(x => x.toLowerCase().includes(v.toLowerCase())) : all;
    setSuggestions(s.slice(0, 8));
    setVisible(s.length > 0 && !!v);
  };

  useEffect(() => {
    // when controlled value changes
    if (value !== undefined) updateSuggestions(value);
  }, [value]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (inputProps && inputProps.onChange) inputProps.onChange(e);
    if (onChange) onChange(v);
    updateSuggestions(v);
  };

  const acceptSuggestion = (s: string) => {
    if (ref.current) {
      ref.current.value = s;
      const ev: any = { target: { value: s } };
      if (inputProps && inputProps.onChange) inputProps.onChange(ev);
      if (onChange) onChange(s);
      setVisible(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab' && suggestions.length > 0) {
      e.preventDefault();
      acceptSuggestion(suggestions[0]);
    }
  };

  return (
    <div className={cn('relative', className)}>
      <Input
        {...(inputProps || {})}
        ref={(node: HTMLInputElement) => {
          ref.current = node;
          if (typeof inputProps?.ref === 'function') inputProps.ref(node);
          else if (inputProps && inputProps.ref) inputProps.ref.current = node;
        }}
        placeholder={placeholder}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
      />

      {visible && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 bg-white border border-zinc-100 rounded-md shadow-md z-50 max-h-40 overflow-auto">
          {suggestions.map((s, i) => (
            <div
              key={i}
              className="px-3 py-2 text-sm hover:bg-zinc-50 cursor-pointer"
              onMouseDown={(ev) => { ev.preventDefault(); acceptSuggestion(s); }}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DescriptionAutocomplete;
