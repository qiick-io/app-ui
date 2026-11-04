import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import prettier from 'eslint-config-prettier/flat';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import typescript from 'typescript-eslint';

const controlStatements = [
    'if',
    'return',
    'for',
    'while',
    'do',
    'switch',
    'try',
    'throw',
];
const paddingAroundControl = [
    ...controlStatements.flatMap((stmt) => [
        { blankLine: 'always', prev: '*', next: stmt },
        { blankLine: 'always', prev: stmt, next: '*' },
    ]),
];

/**
 * jsx-a11y key rules for WCAG 2.2 AA gates (#255).
 * Registry components and the playground → error.
 * `components/ui/*` stays ignored: shadcn primitives keep upstream code.
 */
const jsxA11yKeyRules = {
    ...jsxA11y.flatConfigs.recommended.rules,
    // Deprecated alias of label-has-associated-control; nesting-only labels fail it.
    'jsx-a11y/label-has-for': 'off',
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/anchor-is-valid': 'error',
    'jsx-a11y/click-events-have-key-events': 'error',
    'jsx-a11y/interactive-supports-focus': 'error',
    'jsx-a11y/label-has-associated-control': [
        'error',
        {
            controlComponents: [
                'Checkbox',
                'Input',
                'Select',
                'Textarea',
                'Switch',
                'NativeSelect',
                'RadioGroupItem',
            ],
            depth: 3,
        },
    ],
    'jsx-a11y/no-autofocus': 'error',
    // Scrollable overflow panels need tabindex for axe scrollable-region-focusable;
    // allow on named `region` landmarks (dashboard tables, etc.).
    'jsx-a11y/no-noninteractive-tabindex': [
        'error',
        {
            tags: [],
            roles: ['tabpanel', 'region'],
            allowExpressionValues: true,
        },
    ],
    // Drag-and-drop targets keep a visible file-picker alternative; exclude drag handlers.
    'jsx-a11y/no-static-element-interactions': [
        'error',
        {
            handlers: [
                'onClick',
                'onMouseDown',
                'onMouseUp',
                'onKeyPress',
                'onKeyDown',
                'onKeyUp',
            ],
        },
    ],
};

/** @type {import('eslint').Linter.Config[]} */
export default [
    js.configs.recommended,
    reactHooks.configs.flat['recommended-latest'],
    ...typescript.configs.recommended,
    {
        ...react.configs.flat.recommended,
        ...react.configs.flat['jsx-runtime'], // Required for React 17+
        languageOptions: {
            globals: {
                ...globals.browser,
            },
        },
        rules: {
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'react/no-unescaped-entities': 'off',
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
    },
    {
        plugins: {
            import: importPlugin,
        },
        settings: {
            'import/resolver': {
                typescript: {
                    alwaysTryTypes: true,
                    project: './tsconfig.json',
                },
                node: true,
            },
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'error',
            // ponytail: recommended-latest enables this; fixing all sync setState-in-effect call sites is out of scope for a dep bump
            'react-hooks/set-state-in-effect': 'off',
            '@typescript-eslint/consistent-type-imports': [
                'error',
                {
                    prefer: 'type-imports',
                    fixStyle: 'separate-type-imports',
                },
            ],
            'import/order': [
                'error',
                {
                    groups: [
                        'builtin',
                        'external',
                        'internal',
                        'parent',
                        'sibling',
                        'index',
                    ],
                    alphabetize: {
                        order: 'asc',
                        caseInsensitive: true,
                    },
                },
            ],
            'import/consistent-type-specifier-style': [
                'error',
                'prefer-top-level',
            ],
        },
    },
    {
        plugins: {
            '@stylistic': stylistic,
        },
        rules: {
            '@stylistic/padding-line-between-statements': [
                'error',
                ...paddingAroundControl,
            ],
        },
    },
    {
        ignores: [
            '**/node_modules',
            '**/dist',
            'public',
            'scripts',
            // shadcn primitives keep upstream code, as in the apps (a11y is checked in the playground)
            'registry/src/components/ui/*',
        ],
    },
    {
        files: ['registry/src/**/*.{ts,tsx}', 'playground/src/**/*.{ts,tsx}'],
        plugins: {
            'jsx-a11y': jsxA11y,
        },
        rules: jsxA11yKeyRules,
    },
    prettier, // Turn off all rules that might conflict with Prettier
    {
        plugins: {
            '@stylistic': stylistic,
        },
        rules: {
            curly: ['error', 'all'],
            '@stylistic/brace-style': [
                'error',
                '1tbs',
                { allowSingleLine: false },
            ],
        },
    },
];
