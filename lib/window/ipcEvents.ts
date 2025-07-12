import { type BrowserWindow, ipcMain, shell } from 'electron'
import os from 'os'
import { LiveAudioService } from '@/lib/helpers/LiveAudioService';
import { GroqHelper } from '@/lib/helpers/GroqHelper';

const handleIPC = (channel: string, handler: (...args: any[]) => void) => {
  ipcMain.handle(channel, handler)
}

export const registerWindowIPC = (mainWindow: BrowserWindow) => {
  const groqHelper = new GroqHelper();
  let prevDiagnoses: any[] = [];
  let lastTranscript = "";
  const liveAudioService = new LiveAudioService();
  // Hide the menu bar
  mainWindow.setMenuBarVisibility(false)

  // Register window IPC
  handleIPC('init-window', () => {
    const { width, height } = mainWindow.getBounds()
    const minimizable = mainWindow.isMinimizable()
    const maximizable = mainWindow.isMaximizable()
    const platform = os.platform()

    return { width, height, minimizable, maximizable, platform }
  })

  handleIPC('is-window-minimizable', () => mainWindow.isMinimizable())
  handleIPC('is-window-maximizable', () => mainWindow.isMaximizable())
  handleIPC('window-minimize', () => mainWindow.minimize())
  handleIPC('window-maximize', () => mainWindow.maximize())
  handleIPC('window-close', () => mainWindow.close())
  handleIPC('window-maximize-toggle', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })

  const webContents = mainWindow.webContents
  handleIPC('web-undo', () => webContents.undo())
  handleIPC('web-redo', () => webContents.redo())
  handleIPC('web-cut', () => webContents.cut())
  handleIPC('web-copy', () => webContents.copy())
  handleIPC('web-paste', () => webContents.paste())
  handleIPC('web-delete', () => webContents.delete())
  handleIPC('web-select-all', () => webContents.selectAll())
  handleIPC('web-reload', () => webContents.reload())
  handleIPC('web-force-reload', () => webContents.reloadIgnoringCache())
  handleIPC('web-toggle-devtools', () => webContents.toggleDevTools())
  handleIPC('web-actual-size', () => webContents.setZoomLevel(0))
  handleIPC('web-zoom-in', () => webContents.setZoomLevel(webContents.zoomLevel + 0.5))
  handleIPC('web-zoom-out', () => webContents.setZoomLevel(webContents.zoomLevel - 0.5))
  handleIPC('web-toggle-fullscreen', () => mainWindow.setFullScreen(!mainWindow.fullScreen))
  handleIPC('web-open-url', (_e, url) => shell.openExternal(url))

  function broadcast(channel: string, ...args: any[]): void {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(channel, ...args)
    }
  }

  /* ---------------- groq handlers ---------------- */
  ipcMain.on('groq-get-diagnoses', async (_event, currentTranscript: string) => {
    lastTranscript = currentTranscript;
    try {
      const result = await groqHelper.streamDiagnoses(
        prevDiagnoses,
        currentTranscript,
        (chunk) => {
          broadcast('groq-diagnoses-chunk', chunk);
        },
        () => {
          broadcast('groq-diagnoses-start');
        }
      );
      prevDiagnoses = result.likely_diagnoses;
    } catch (error) {
      console.error('Error getting diagnoses from Groq:', error);
      broadcast('groq-diagnoses-error', 'Failed to get diagnoses.');
    }
  });

  ipcMain.on('groq-get-treatment', async (_event, diagnosis: string) => {
    try {
      await groqHelper.streamTreatmentPlan(
        diagnosis,
        lastTranscript,
        (chunk) => {
          broadcast('groq-treatment-chunk', chunk);
        },
        () => {
          broadcast('groq-treatment-start');
        }
      );
      
    } catch (error) {
      console.error('Error getting treatment plan from Groq:', error);
      broadcast('groq-treatment-error', 'Failed to get treatment plan.');
    }
  });

  /* ---------------- live-audio handlers ---------------- */
  ipcMain.on('live-audio-start', async () => {
    if (liveAudioService.isActive()) {
      return;
    }
    prevDiagnoses = []; // Reset diagnoses on new session
    try {
      await liveAudioService.start({
        onGeminiChunk: (chunk) => {
          broadcast('gemini-transcript', chunk);
        },
        onTranscript: (text) => {
          broadcast('live-transcript', text);
        }
      });
      broadcast('live-audio-ready');
    } catch (err) {
      console.error('Failed to start audio services:', err);
      broadcast('live-audio-error', 'Failed to start audio services.');
      return;
    }
  });

  ipcMain.on('live-audio-chunk', (_event, chunk: Uint8Array) => {
    if (!liveAudioService.isActive()) {
      return;
    }
    liveAudioService.sendAudioChunk(Buffer.from(chunk));
  });

  ipcMain.on('live-audio-stop', () => {
    liveAudioService.stop();
    prevDiagnoses = []; // Reset diagnoses on stop
  });

  ipcMain.on('live-audio-done', () => {
    if (!liveAudioService.isActive()) return;
    liveAudioService.finishTurn();
  });

  ipcMain.on('live-image-chunk', (_event, jpegBase64: string) => {
    liveAudioService.sendImageChunk(jpegBase64);
  });

  ipcMain.on('live-audio-toggle-gemini', (_event, mute: boolean) => {
    liveAudioService.toggleGeminiAudio(mute);
  });

  ipcMain.on('live-audio-send-text-input', (_event, _text: string) => {
    liveAudioService.sendTextInput(_text);
  });
}
