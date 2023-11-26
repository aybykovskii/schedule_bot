export enum Periods {
  Once = 'Once',
  Weekly = 'Weekly',
}

export enum Actions {
  Cancel = 'cancel',
}

/**
 * @description Google Calendar allowed colors
 * @example
  '1': '#a4bdfc',
  '2': '#7ae7bf',
  '3': '#dbadff',
  '4': '#ff887c',
  '5': '#fbd75b',
  '6': '#ffb878',
  '7': '#46d6db',
  '8': '#e1e1e1',
  '9': '#5484ed',
  '10': '#51b749',
  '11': '#dc2127',
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
