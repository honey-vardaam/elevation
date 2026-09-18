import {
    type KeyboardEvent,
    type ChangeEvent,
    useMemo,
    useRef,
    useState,
} from 'react';
import { cn } from '@/lib/utils';
import type { TaggableMember } from '@/types';

/**
 * Finds an in-progress "@query" token ending at the caret, e.g. typing
 * "cc @sa|" (caret at |) matches "sa". Requires a word boundary before the
 * "@" so email-like text ("foo@bar") doesn't trigger it.
 */
function activeMentionQuery(
    text: string,
    caret: number,
): { query: string; start: number } | null {
    const upToCaret = text.slice(0, caret);
    const match = upToCaret.match(/(?:^|\s)@([^\s@]*)$/);

    if (!match) {
        return null;
    }

    return { query: match[1], start: caret - match[1].length - 1 };
}

export function MentionTextarea({
    value,
    onChange,
    members,
    placeholder,
    rows = 3,
    autoFocus,
    className,
}: {
    value: string;
    onChange: (value: string) => void;
    members: TaggableMember[];
    placeholder?: string;
    rows?: number;
    autoFocus?: boolean;
    className?: string;
}) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [mention, setMention] = useState<{
        query: string;
        start: number;
    } | null>(null);
    const [highlighted, setHighlighted] = useState(0);

    const matches = useMemo(() => {
        if (mention === null) {
            return [];
        }

        const query = mention.query.toLowerCase();

        return members
            .filter((member) => member.name.toLowerCase().includes(query))
            .slice(0, 6);
    }, [mention, members]);

    function syncMentionState(text: string, caret: number) {
        const next = activeMentionQuery(text, caret);
        setMention(next);
        setHighlighted(0);
    }

    function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
        const text = event.target.value;
        onChange(text);
        syncMentionState(text, event.target.selectionStart ?? text.length);
    }

    function selectMember(member: TaggableMember) {
        if (mention === null || !textareaRef.current) {
            return;
        }

        const caret = textareaRef.current.selectionStart ?? value.length;
        const before = value.slice(0, mention.start);
        const after = value.slice(caret);
        const inserted = `@${member.name} `;

        onChange(`${before}${inserted}${after}`);
        setMention(null);

        requestAnimationFrame(() => {
            const pos = before.length + inserted.length;
            textareaRef.current?.focus();
            textareaRef.current?.setSelectionRange(pos, pos);
        });
    }

    function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
        if (mention === null || matches.length === 0) {
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setHighlighted((h) => (h + 1) % matches.length);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setHighlighted((h) => (h - 1 + matches.length) % matches.length);
        } else if (event.key === 'Enter' || event.key === 'Tab') {
            event.preventDefault();
            selectMember(matches[highlighted]);
        } else if (event.key === 'Escape') {
            setMention(null);
        }
    }

    return (
        <div className="relative">
            <textarea
                ref={textareaRef}
                rows={rows}
                placeholder={placeholder}
                value={value}
                autoFocus={autoFocus}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onClick={(e) =>
                    syncMentionState(
                        value,
                        e.currentTarget.selectionStart ?? value.length,
                    )
                }
                onBlur={() => window.setTimeout(() => setMention(null), 100)}
                className={cn(
                    'bg-input/50 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/30 flex field-sizing-content min-h-16 w-full resize-none rounded-2xl border border-transparent px-2.5 py-2 text-base transition-[color,box-shadow] duration-200 outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                    className,
                )}
            />

            {mention !== null && matches.length > 0 && (
                <div className="bg-popover ring-foreground/5 absolute bottom-full left-0 z-20 mb-1 w-56 overflow-hidden rounded-xl border py-1 shadow-md ring-1">
                    {matches.map((member, index) => (
                        <button
                            key={member.id}
                            type="button"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                selectMember(member);
                            }}
                            className={cn(
                                'flex w-full items-center px-2.5 py-1.5 text-left text-sm',
                                index === highlighted
                                    ? 'bg-muted'
                                    : 'hover:bg-muted/60',
                            )}
                        >
                            {member.name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
