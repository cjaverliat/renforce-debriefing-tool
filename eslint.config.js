import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';

export default [
  // Global ignores
  {
    ignores: [
      'node_modules/**',
      '.vite/**',
      'dist/**',
      'out/**',
      '*.config.js',
      '*.config.ts',
      // // Ignore UI components with optional dependencies not installed
      // 'src/renderer/components/ui/calendar.tsx',
      // 'src/renderer/components/ui/carousel.tsx',
      // 'src/renderer/components/ui/chart.tsx',
      // 'src/renderer/components/ui/command.tsx',
      // 'src/renderer/components/ui/drawer.tsx',
      // 'src/renderer/components/ui/form.tsx',
      // 'src/renderer/components/ui/input-otp.tsx',
      // 'src/renderer/components/ui/resizable.tsx',
      // 'src/renderer/components/ui/sidebar.tsx',
      // 'src/renderer/components/ui/sonner.tsx',
    ],
  },

  // Base ESLint recommended rules
  js.configs.recommended,

  // TypeScript ESLint recommended rules
  ...tseslint.configs.recommended,

  // Configuration for all files
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],

    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
      },
      globals: {
        // Node.js globals
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
        console: 'readonly',
        exports: 'writable',
        global: 'readonly',
        module: 'readonly',
        process: 'readonly',
        require: 'readonly',

        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',

        // Electron/Vite globals
        MAIN_WINDOW_VITE_DEV_SERVER_URL: 'readonly',
        MAIN_WINDOW_VITE_NAME: 'readonly',
      },
    },

    plugins: {
      '@typescript-eslint': tseslint.plugin,
      'import': importPlugin,
    },

    settings: {
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
        },
      },
    },

    rules: {
      // Import plugin rules
      'import/no-unresolved': 'error',
      'import/named': 'error',
      'import/default': 'error',
      'import/namespace': 'error',

      // TypeScript specific overrides
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      }],
    },
  },

  // Specific config for React files
  {
    files: ['src/renderer/**/*.{ts,tsx}'],
    rules: {
      // React-specific rules can go here
    },
  },
];