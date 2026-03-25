import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

import { FlatCompat } from '@eslint/eslintrc';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
	baseDirectory: __dirname,
});

const eslintConfig = [
	...compat.extends('next/core-web-vitals', 'next/typescript', 'prettier'),
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
	{
		plugins: {
			'simple-import-sort': simpleImportSort,
		},
		rules: {
			'@typescript-eslint/ban-ts-comment': 'warn',
			'@typescript-eslint/no-empty-object-type': 'warn',
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					vars: 'all',
					args: 'after-used',
					ignoreRestSiblings: false,
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					destructuredArrayIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^(_|ignore)',
				},
			],
			'@typescript-eslint/explicit-module-boundary-types': 'off',

			quotes: [
				'error',
				'single',
				{
					avoidEscape: true,
					allowTemplateLiterals: true,
				},
			],

			'simple-import-sort/imports': 'warn',
			'simple-import-sort/exports': 'warn',
		},
	},
	{
		ignores: ['.next/', 'src/app/(payload)', 'src/app/(payload)/admin/importMap.js'],
	},
];

export default eslintConfig;
