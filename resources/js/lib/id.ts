/**
 * `crypto.randomUUID()` only exists in secure contexts (HTTPS, or
 * localhost/127.0.0.1) - it's undefined on a plain-HTTP dev domain like
 * `http://*.test`, where calling it throws. Falls back to a manual RFC4122
 * v4 string so element/id generation keeps working everywhere.
 */
export function randomId(): string {
    if (
        typeof crypto !== 'undefined' &&
        typeof crypto.randomUUID === 'function'
    ) {
        return crypto.randomUUID();
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
