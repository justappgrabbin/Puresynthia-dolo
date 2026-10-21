/**
 * Device Control — Local Android device via shell commands
 */
import { runShell } from '../utils/shell.js';
import type { DeviceState } from '../types.js';

export class DeviceControlTools {
  async getDeviceState(): Promise<DeviceState> {
    const state: DeviceState = {
      screenOn: false,
      orientation: 'portrait',
      currentApp: null,
      batteryLevel: -1,
      networkType: 'unknown',
      lastScreenshot: null,
    };

    try {
      const battery = await runShell('termux-battery-status', { timeout: 5000, logOutput: false });
      const data = JSON.parse(battery.stdout);
      state.batteryLevel = data.percentage || -1;
    } catch {}

    try {
      const app = await runShell('dumpsys activity activities | grep mResumedActivity', { timeout: 5000, logOutput: false });
      const match = app.stdout.match(/\{([^}]+)\}/);
      if (match) state.currentApp = match[1].split(' ')[0];
    } catch {}

    try {
      const screen = await runShell('dumpsys power | grep "Display Power"', { timeout: 5000, logOutput: false });
      state.screenOn = screen.stdout.includes('ON');
    } catch {}

    try {
      const orient = await runShell('dumpsys input | grep "SurfaceOrientation"', { timeout: 5000, logOutput: false });
      state.orientation = orient.stdout.includes('0') ? 'portrait' : 'landscape';
    } catch {}

    return state;
  }

  async takeScreenshot(path?: string): Promise<string> {
    const screenshotPath = path || `${process.env.HOME}/synthia_screenshot_${Date.now()}.png`;
    const result = await runShell(`screencap -p ${screenshotPath}`, { timeout: 10000 });
    if (result.exitCode === 0) {
      await runShell(`termux-media-scan -r ${screenshotPath}`, { timeout: 5000, logOutput: false });
      return screenshotPath;
    }
    throw new Error('Failed to take screenshot');
  }

  async listApps(): Promise<Array<{ package: string; name: string }>> {
    const result = await runShell('pm list packages -f', { timeout: 15000, logOutput: false });
    if (result.exitCode !== 0) throw new Error(result.stderr);
    return result.stdout.split('\n')
      .filter(line => line.includes('package:'))
      .map(line => {
        const match = line.match(/package:([^=]+)=(.+)/);
        return { package: match?.[2] || '', name: match?.[1] || '' };
      })
      .filter(a => a.package);
  }

  async launchApp(packageName: string): Promise<string> {
    const result = await runShell(`monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`, { timeout: 10000 });
    if (result.exitCode !== 0) throw new Error(result.stderr);
    return `Launched ${packageName}`;
  }

  async terminateApp(packageName: string): Promise<string> {
    const result = await runShell(`am force-stop ${packageName}`, { timeout: 10000 });
    if (result.exitCode !== 0) throw new Error(result.stderr);
    return `Stopped ${packageName}`;
  }

  async tap(x: number, y: number): Promise<string> {
    const result = await runShell(`input tap ${x} ${y}`, { timeout: 5000 });
    if (result.exitCode !== 0) throw new Error(result.stderr);
    return `Tapped at (${x}, ${y})`;
  }

  async swipe(x1: number, y1: number, x2: number, y2: number, duration = 300): Promise<string> {
    const result = await runShell(`input swipe ${x1} ${y1} ${x2} ${y2} ${duration}`, { timeout: 10000 });
    if (result.exitCode !== 0) throw new Error(result.stderr);
    return `Swiped from (${x1}, ${y1}) to (${x2}, ${y2})`;
  }

  async typeText(text: string): Promise<string> {
    const escaped = text.replace(/ /g, '%s').replace(/'/g, "\'");
    const result = await runShell(`input text "${escaped}"`, { timeout: 5000 });
    if (result.exitCode !== 0) throw new Error(result.stderr);
    return `Typed: ${text}`;
  }

  async pressButton(button: string): Promise<string> {
    const keyMap: Record<string, string> = {
      'home': 'KEYCODE_HOME', 'back': 'KEYCODE_BACK', 'power': 'KEYCODE_POWER',
      'volume_up': 'KEYCODE_VOLUME_UP', 'volume_down': 'KEYCODE_VOLUME_DOWN',
      'enter': 'KEYCODE_ENTER', 'menu': 'KEYCODE_MENU', 'recent': 'KEYCODE_APP_SWITCH',
    };
    const keycode = keyMap[button.toLowerCase()] || button;
    const result = await runShell(`input keyevent ${keycode}`, { timeout: 5000 });
    if (result.exitCode !== 0) throw new Error(result.stderr);
    return `Pressed ${button}`;
  }

  async openUrl(url: string): Promise<string> {
    const result = await runShell(`am start -a android.intent.action.VIEW -d "${url}"`, { timeout: 10000 });
    if (result.exitCode !== 0) throw new Error(result.stderr);
    return `Opened ${url}`;
  }

  async getScreenSize(): Promise<{ width: number; height: number }> {
    const result = await runShell('wm size', { timeout: 5000, logOutput: false });
    const match = result.stdout.match(/(\d+)x(\d+)/);
    if (!match) throw new Error('Could not get screen size');
    return { width: parseInt(match[1]), height: parseInt(match[2]) };
  }
}
