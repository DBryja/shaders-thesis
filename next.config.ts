import { createRequire } from 'module';
import { NextConfig } from 'next';
import path from 'path';
import { fileURLToPath } from 'url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const require = createRequire(import.meta.url);
const rawLoader = require.resolve('raw-loader');
const glslifyLoader = require.resolve('glslify-loader');

const nextConfig: NextConfig = {
	reactCompiler: true,
	turbopack: {
		resolveExtensions: ['.mdx', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
		rules: {
			'*.svg': {
				loaders: [
					{
						loader: '@svgr/webpack',
						options: {
							typescript: true,
							svgo: false,
							ref: true,
						},
					},
				],
				as: '*.js',
			},
			'*.{glsl,vs,fs,vert,frag}': {
				loaders: [rawLoader, glslifyLoader],
				as: '*.js',
			},
		},
		resolveAlias: {
			'@assets': path.resolve(dirname, 'src/assets'),
		},
	},
};

export default nextConfig;
