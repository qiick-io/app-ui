#!/usr/bin/env node
/**
 * Every registry item uses only theme tokens (#3, from externa-core
 * `scripts/check-ui-tokens.mjs`, #240). Scans registry/src, ui primitives
 * included, and fails on:
 *
 * - arbitrary sub-scale font sizes `text-[Npx|Nrem|Nem]` (use text-xs… scale);
 * - raw Tailwind palette utilities (`bg-teal-600`, `text-neutral-500`, …);
 * - #hex colours on className lines.
 *
 * No baseline: the registry starts clean and stays clean.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = join(fileURLToPath(new URL('..', import.meta.url)));
const scanRoot = join(rootDir, 'registry/src');

const PALETTE =
    /(?<![\w-])(?:bg|text|border|ring|outline|fill|stroke|from|via|to|decoration|accent|caret|divide|placeholder)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(?:\d{2,3}|black|white)(?:\/\d{1,3})?(?![\w-])/g;

const HEX = /#[0-9a-fA-F]{3,8}/g;
const TEXT_ARB = /text-\[[0-9.]+(?:px|rem|em)\]/g;

/**
 * @param {string} dir
 * @param {(file: string) => void} visit
 */
function walk(dir, visit) {
    for (const name of readdirSync(dir)) {
        const full = join(dir, name);
        const st = statSync(full);

        if (st.isDirectory()) {
            walk(full, visit);
            continue;
        }

        if (/\.(tsx|ts|jsx|js)$/.test(name)) {
            visit(full);
        }
    }
}

/**
 * @returns {{ text: string[], paletteHex: Map<string, number> }}
 */
function scan() {
    /** @type {string[]} */
    const text = [];
    /** @type {Map<string, number>} */
    const paletteHex = new Map();

    walk(scanRoot, (abs) => {
        const rel = `registry/src/${relative(scanRoot, abs).split('\\').join('/')}`;
        const source = readFileSync(abs, 'utf8');
        const lines = source.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const stripped = line.trim();

            if (
                stripped.startsWith('//') ||
                stripped.startsWith('*') ||
                stripped.startsWith('/*')
            ) {
                continue;
            }

            for (const m of line.matchAll(TEXT_ARB)) {
                text.push(`${rel}:${i + 1}:${m[0]}`);
            }

            for (const m of line.matchAll(PALETTE)) {
                const key = `${rel}:palette:${m[0]}`;
                paletteHex.set(key, (paletteHex.get(key) ?? 0) + 1);
            }

            if (
                line.includes('className') ||
                line.includes('class=') ||
                line.includes('cn(')
            ) {
                for (const m of line.matchAll(HEX)) {
                    const key = `${rel}:hex:${m[0]}`;
                    paletteHex.set(key, (paletteHex.get(key) ?? 0) + 1);
                }
            }
        }
    });

    return { text, paletteHex };
}

const { text, paletteHex } = scan();
/** @type {string[]} */
const errors = [];

if (text.length > 0) {
    errors.push(
        'Arbitrary font sizes outside the type scale (use text-xs … text-4xl):',
    );

    for (const hit of text) {
        errors.push(`  ${hit}`);
    }
}

if (paletteHex.size > 0) {
    errors.push('Raw palette / #hex className usage (use theme tokens):');

    for (const [key, count] of paletteHex) {
        errors.push(`  ${key} (${count})`);
    }
}

if (errors.length > 0) {
    console.error('check-ui-tokens: failed\n');
    console.error(errors.join('\n'));
    process.exit(1);
}

console.log('check-ui-tokens: ok (registry/src uses theme tokens only)');
