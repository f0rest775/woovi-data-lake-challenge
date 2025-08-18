import { defineConfig } from 'tsup'

export default defineConfig({
	entry: ['src/**/*.ts', '!src/**/__tests__/**'],
	splitting: false,
	sourcemap: true,
	clean: true,

})