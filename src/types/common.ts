export type DeepPartial<T extends Record<PropertyKey, unknown>> = {
  [Key in keyof T]?: T[Key] extends Record<PropertyKey, unknown> ? DeepPartial<T[Key]> : T[Key] | undefined
}

export type Paths<T extends Record<PropertyKey, unknown>> = {
  [Key in keyof T]: T[Key] extends Record<PropertyKey, unknown> ? `${Key & string}.${Paths<T[Key]> & string}` : Key
}[keyof T]

export enum Days {
  Monday = 'Monday',
  Tuesday = 'Tuesday',
  Wednesday = 'Wednesday',
  Thursday = 'Thursday',
  Friday = 'Friday',
  Saturday = 'Saturday',
  Sunday = 'Sunday',
}
