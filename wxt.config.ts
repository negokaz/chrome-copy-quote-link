import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react', '@wxt-dev/webextension-polyfill'],
  entrypointsDir: 'src',
  react: {
    vite: {
      jsxRuntime: 'classic',
    },
  },
  vite: () => ({
    define: {
      global: 'globalThis',
    },
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: 'globalThis',
        },
      },
    },
  }),
  manifest: {
    name: 'Copy Quote Link',
    description: 'share page text and the link with any formats',
    version: '0.2.1',
    permissions: ['storage', 'activeTab', 'contextMenus', 'clipboardWrite'],
    icons: { 16: 'icons/icon-16.png', 48: 'icons/icon-48.png', 128: 'icons/icon-128.png' },
    action: { default_title: 'Copy Quote Link' },
    commands: {
      '_execute_action': {
        suggested_key: { default: 'Ctrl+Shift+X', mac: 'Command+Shift+X' },
      },
    },
    options_ui: {
      open_in_tab: true,
    },
  },
});
