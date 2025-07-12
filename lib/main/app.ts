import { BrowserWindow, shell, app, protocol, net } from 'electron'
import { join } from 'path'
import { registerWindowIPC } from '@/lib/window/ipcEvents'
import appIcon from '@/resources/build/icon.png?asset'
import { pathToFileURL } from 'url'

export function createAppWindow(): BrowserWindow {
  // Register custom protocol for resources
  registerResourcesProtocol()

  // Create the main window.
  const mainWindow = new BrowserWindow({
    fullscreen: true,
    skipTaskbar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      sandbox: false
    },
    show: true,
    alwaysOnTop: true,
    transparent: false,
    hasShadow: false,
    focusable: false,
    icon: appIcon,
    titleBarStyle: 'hiddenInset',
    title: 'SindyHealth',
    resizable: false,
    backgroundMaterial: 'auto',
  })

  // Register IPC events for the main window.
  registerWindowIPC(mainWindow)

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
  return mainWindow
}

// Register custom protocol for assets
function registerResourcesProtocol() {
  protocol.handle('res', async (request) => {
    try {
      const url = new URL(request.url)
      // Combine hostname and pathname to get the full path
      const fullPath = join(url.hostname, url.pathname.slice(1))
      const filePath = join(__dirname, '../../resources', fullPath)
      return net.fetch(pathToFileURL(filePath).toString())
    } catch (error) {
      console.error('Protocol error:', error)
      return new Response('Resource not found', { status: 404 })
    }
  })
}
