export enum Periods {
  Once = 'Once',
  Weekly = 'Weekly',
}

export enum Actions {
  Cancel = 'cancel',
}

/**
 * @description Google Calendar allowed colors
 *'1': { background: '#a4bdfc', foreground: '#1d1d1d' },
  '2': { background: '#7ae7bf', foreground: '#1d1d1d' },
  '3': { background: '#dbadff', foreground: '#1d1d1d' },
  '4': { background: '#ff887c', foreground: '#1d1d1d' },
  '5': { background: '#fbd75b', foreground: '#1d1d1d' },
  '6': { background: '#ffb878', foreground: '#1d1d1d' },
  '7': { background: '#46d6db', foreground: '#1d1d1d' },
  '8': { background: '#e1e1e1', foreground: '#1d1d1d' },
  '9': { background: '#5484ed', foreground: '#1d1d1d' },
  '10': { background: '#51b749', foreground: '#1d1d1d' },
  '11': { background: '#dc2127', foreground: '#1d1d1d' },
 */
export enum EventColorCodes {
  Confirmed = '10',
  Cancelled = '11',
}

export enum EventTransparency {
  Opaque = 'opaque',
  Transparent = 'transparent',
}

export enum GoogleEventStatuses {
  Confirmed = 'confirmed',
  Cancelled = 'cancelled',
}
