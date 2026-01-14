import { readFileSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';

/**
 * Vite plugin to handle HTML includes
 */
export default function htmlIncludes(options = {}) {
	const { includePath } = options;
	const pluginDir = dirname(fileURLToPath(import.meta.url));
	// The plugin is in the project root, so viteRoot is src/
	const viteRoot = resolve(pluginDir, 'src');

	return {
		name: 'html-includes',
		transformIndexHtml: {
			order: 'pre',
			handler(html, context) {
				// context.path is the URL path (e.g., '/index.html' or '/')
				// We need to resolve it to the actual file system path
				let urlPath = context.path || '/index.html';
				// Remove leading slash and resolve from vite root
				const relativePath = urlPath.startsWith('/') ? urlPath.slice(1) : urlPath;
				const filePath = resolve(viteRoot, relativePath || 'index.html');

				return processIncludes(html, filePath, includePath);
			}
		}
	};
}

function processIncludes(html, filePath, includePath) {
	const includeRegex = /include\s+"([^"]+)"/g;
	let processedHtml = html;
	let match;

	// Reset regex lastIndex to avoid issues with multiple calls
	includeRegex.lastIndex = 0;

	while ((match = includeRegex.exec(html)) !== null) {
		const includeFile = match[1];
		let fullIncludePath = null;

		// Always try to resolve relative to current file first
		if (filePath) {
			const currentDir = dirname(filePath);
			const relativePath = resolve(currentDir, includeFile);

			if (existsSync(relativePath)) {
				fullIncludePath = relativePath;
			}
		}

		// If not found relative to current file, try includePath
		if (!fullIncludePath && includePath) {
			const includePathResolved = resolve(includePath, includeFile);
			if (existsSync(includePathResolved)) {
				fullIncludePath = includePathResolved;
			}
		}

		if (fullIncludePath && existsSync(fullIncludePath)) {
			let includeContent = readFileSync(fullIncludePath, 'utf-8');
			// Recursively process includes in the included file
			includeContent = processIncludes(includeContent, fullIncludePath, includePath);
			processedHtml = processedHtml.replace(match[0], includeContent);
		} else {
			// Show what we tried
			const triedPaths = [];
			if (filePath) {
				triedPaths.push(resolve(dirname(filePath), includeFile));
			}
			if (includePath) {
				triedPaths.push(resolve(includePath, includeFile));
			}
			console.warn(`Include file not found: ${includeFile}`);
			console.warn(`  Tried paths: ${triedPaths.join(', ')}`);
			console.warn(`  Current file: ${filePath}`);
		}
	}

	return processedHtml;
}
