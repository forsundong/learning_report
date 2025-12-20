import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // 将体积较大的第三方库进行手动拆分
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('xlsx')) {
              return 'vendor-xlsx'; // 专门拆分 Excel 处理库
            }
            if (id.includes('recharts') || id.includes('d3')) {
              return 'vendor-charts'; // 专门拆分图表库
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons'; // 专门拆分图标库
            }
            return 'vendor-base'; // 其他基础库（React等）
          }
        }
      }
    }
  }
});