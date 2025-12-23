export type VoiceAction =
    | 'START_NAVIGATION'
    | 'WHERE_AM_I'
    | 'SAVED_ROUTES'
    | 'SETTINGS'
    | 'GO_BACK'
    | null;

export function parseVoiceCommand(text: string): VoiceAction {
    const t = text.toLowerCase();

    if (t.includes('start')) return 'START_NAVIGATION';
    if (t.includes('where')) return 'WHERE_AM_I';
    if (t.includes('saved')) return 'SAVED_ROUTES';
    if (t.includes('setting')) return 'SETTINGS';
    if (t.includes('back')) return 'GO_BACK';

    return null;
}
