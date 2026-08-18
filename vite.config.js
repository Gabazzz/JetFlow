import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt' em vez de 'autoUpdate': com autoUpdate, assim que um deploy
      // novo era detectado o service worker recarregava a aba sozinho — e
      // quem estivesse no meio de uma Nota de Reunião ou de um cadastro
      // perdia tudo. Aqui a versão nova fica pronta em segundo plano e passa
      // a valer no próximo carregamento natural da página, sem interromper
      // ninguém no meio de um preenchimento.
      registerType: 'prompt',
      includeAssets: ['favicon.png', 'favicon.svg'],
      manifest: {
        name: 'JetFlow — Gestão de Implantação & Onboarding',
        short_name: 'JetFlow',
        description: 'JetFlow da Jetsales é a plataforma definitiva de gestão de onboarding e implantação de automações, IA e WhatsApp para especialistas de sucesso do cliente.',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#0A0C10',
        theme_color: '#0A0C10',
        icons: [
          { src: '/pwa/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/pwa/icon-192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/pwa/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}']
      }
    })
  ],
})
