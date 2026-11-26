import { expect, it } from 'vitest';
import { getInitials } from '@/components/admin/user-avatar';

it.each([
    ['ZZ Stress 🚀', '', 'Z🚀'],
    ['👩🏽‍🚀 Silva', '', '👩🏽‍🚀S'],
    ['e\u0301lodie álvarez', '', 'E\u0301Á'],
    ['🇮🇹', '', '🇮🇹'],
    ['  ', '  🚀@example.com ', '🚀'],
    ['  Grace Brewster Hopper  ', '', 'GH'],
    ['grace', 'ops@example.com', 'G'],
    ['', 'ops@example.com', 'O'],
    ['', '', ''],
])(
    'returns whole initials from %j with fallback %j',
    (name, fallback, initials) => {
        expect(getInitials(name, fallback)).toBe(initials);
    },
);
