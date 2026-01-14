import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync, cpSync } from 'fs';
import { fileURLToPath } from 'url';
import { glob } from 'glob';
import htmlIncludes from './vite-plugin-html-includes.js';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import uncss from 'uncss';
import { minify } from 'csso';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
	root: 'src',
	publicDir: false,
	build: {
		outDir: '../dist',
		emptyOutDir: true,
		rollupOptions: {
			input: {
				main: resolve(__dirname, 'src/index.html')
			}
		},
		cssCodeSplit: false,
		cssMinify: false, // We'll handle minification after UnCSS
		copyPublicDir: false,
	},
	css: {
		preprocessorOptions: {
			scss: {
				api: 'modern-compiler',
				includePaths: [
					resolve(__dirname, 'src/scss/_inc')
				]
			}
		},
		postcss: {
			plugins: [
				autoprefixer()
			]
		}
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, 'src')
		}
	},
	plugins: [
		htmlIncludes({
			includePath: resolve(__dirname, 'src/includes')
		}),
		{
			name: 'copy-static-assets',
			writeBundle: () => {
				const distDir = resolve(__dirname, 'dist');
				const srcDir = resolve(__dirname, 'src');

				// Copy static assets
				['img', 'fonts'].forEach(dir => {
					const srcPath = resolve(srcDir, dir);
					const destPath = resolve(distDir, dir);
					if (existsSync(srcPath)) {
						cpSync(srcPath, destPath, { recursive: true });
					}
				});
			}
		},
		{
			name: 'post-build-process-css',
			writeBundle: async () => {
				// Wait a bit for files to be written
				await new Promise(resolve => setTimeout(resolve, 100));

				const distDir = resolve(__dirname, 'dist');
				const htmlFile = resolve(distDir, 'index.html');

				if (!existsSync(htmlFile)) {
					console.warn('HTML file not found for CSS processing');
					return;
				}

				// Read the compiled CSS
				const cssPattern = resolve(distDir, 'assets/*.css');
				const cssFiles = await glob(cssPattern);
				if (cssFiles.length === 0) {
					console.warn('No CSS files found for processing');
					return;
				}

				// Get the first CSS file (glob returns absolute paths)
				let cssFile = cssFiles[0];
				// Ensure it's an absolute path
				if (!cssFile.startsWith('/')) {
					cssFile = resolve(distDir, cssFile);
				}
				if (!existsSync(cssFile)) {
					console.warn(`CSS file not found: ${cssFile}`);
					return;
				}
				let cssContent = readFileSync(cssFile, 'utf-8');

				// Extract @font-face and font-family rules before UnCSS
				const fontFaceRegex = /@font-face\s*\{[^}]*\}/g;
				const fontFamilyRegex = /font-family\s*:[^;]+;/g;
				const fontFaces = cssContent.match(fontFaceRegex) || [];
				const fontFamilies = new Set();
				cssContent.match(fontFamilyRegex)?.forEach(match => {
					fontFamilies.add(match.trim());
				});

				// Pre-process: Run UnCSS
				try {
					// Create a temporary HTML file without external scripts for UnCSS
					let htmlContent = readFileSync(htmlFile, 'utf-8');
					// Remove all script and noscript tags to prevent UnCSS from trying to execute them
					const tempHtml = htmlContent
						.replace(/<script[\s\S]*?<\/script>/gi, '')
						.replace(/<noscript[\s\S]*?<\/noscript>/gi, '');

					const tempHtmlFile = resolve(distDir, 'index-uncss-temp.html');
					writeFileSync(tempHtmlFile, tempHtml);

					// UnCSS expects relative paths from the HTML file
					const cssFileRelative = cssFile.replace(distDir + '/', '');

					const uncssResult = await new Promise((resolve, reject) => {
						uncss([tempHtmlFile], {
							stylesheets: [cssFileRelative],
							ignore: [
								/.no-js/,
								/.lt-ie/,
								/\[class\*="no-js"\]/,
								/\[class\*="lt-ie"\]/
							],
							jsdom: {
								features: {
									FetchExternalResources: false,
									ProcessExternalResources: false
								}
							}
						}, (error, output) => {
							// Clean up temp file
							try {
								unlinkSync(tempHtmlFile);
							} catch (e) {
								// Ignore cleanup errors
							}
							if (error) {
								reject(error);
							} else {
								resolve(output);
							}
						});
					});
					cssContent = uncssResult;

					// Re-inject @font-face rules at the beginning
					if (fontFaces.length > 0) {
						cssContent = fontFaces.join('\n\n') + '\n\n' + cssContent;
					}
				} catch (error) {
					console.warn('UnCSS failed, using original CSS:', error.message);
				}

				// Pre-process: Apply autoprefixer
				const result = await postcss([autoprefixer()]).process(cssContent, {
					from: cssFile
				});

				// Write pre-processed tidy.css
				const tidyCssPath = resolve(distDir, 'css/tidy.css');
				if (!existsSync(resolve(distDir, 'css'))) {
					mkdirSync(resolve(distDir, 'css'), { recursive: true });
				}

				// Fix font paths for inlined CSS (relative to HTML file, not CSS file)
				// Replace ../fonts/ with fonts/ since CSS will be inlined in HTML at dist root
				// Also fix Vite-processed font paths (/assets/...) to be relative
				let processedCss = result.css
					.replace(/url\(['"]?\.\.\/fonts\//g, "url('fonts/")
					.replace(/url\(['"]?\/assets\/([^'"]+font[^'"]+)['"]?\)/g, "url('./assets/$1')");
				writeFileSync(tidyCssPath, processedCss);

				// Pre-process: Minify and write tidy.min.css
				const minified = minify(processedCss).css;
				writeFileSync(resolve(distDir, 'css/tidy.min.css'), minified);

				// Now inline the pre-processed CSS in HTML
				let htmlContent = readFileSync(htmlFile, 'utf-8');
				const cssInline = `<style>${minified}</style>`;

				// Replace the build comment pattern (this removes the script tag and replaces with inline CSS)
				htmlContent = htmlContent.replace(
					/<!--\s*build:css\s+inline\s+css\/tidy\.min\.css\s*-->[\s\S]*?<!--\s*\/build\s*-->/,
					cssInline
				);

				// Remove any remaining script tags that import main.js (safety net)
				htmlContent = htmlContent.replace(
					/<script[^>]*type=["']module["'][^>]*src=["'][^"']*\/?main\.js["'][^>]*><\/script>/gi,
					''
				);

				// Also replace include_css_style_tag if present
				htmlContent = htmlContent.replace(
					/include_css_style_tag/g,
					cssInline
				);

				// Process HTML build comments (remove build:remove sections)
				htmlContent = htmlContent.replace(
					/<!--\s*build:remove\s*-->[\s\S]*?<!--\s*\/build\s*-->/g,
					''
				);

				writeFileSync(htmlFile, htmlContent);

				// Clean up temporary CSS files from assets directory
				cssFiles.forEach(file => {
					if (!file.includes('assets')) return;
					try {
						unlinkSync(file);
					} catch (e) {
						// Ignore errors
					}
				});
			}
		}
	],
	server: {
		watch: {
			usePolling: false
		}
	}
});
