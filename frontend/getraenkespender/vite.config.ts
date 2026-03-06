import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The IP address of the ESP32 in AP mode is always 192.168.4.1
const ESP32_IP = 'http://192.168.4.1'

export default defineConfig({
  plugins: [react()],
  build: {
    // Output to www/ so it can be directly uploaded to ESP32 /www/ directory
    outDir: 'www',
  },
  server: {
    proxy: {
      '/api': {
        target: ESP32_IP,
        changeOrigin: true,
      },
    },
  },
})
