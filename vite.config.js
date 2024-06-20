import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
    base: './',
    plugins: [vue()],
    build: {
        chunkSizeWarningLimit: 1500
    }
    // optimizeDeps: {
    //     include: [
    //         'vue',
    //         'monaco-editor/esm/vs/language/json/json.worker',
    //         'monaco-editor/esm/vs/language/css/css.worker',
    //         'monaco-editor/esm/vs/editor/editor.worker'
    //     ]
    // }
})
