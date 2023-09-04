export type DeepPartial<T extends Record<PropertyKey, unknown>> = {
  [Key in keyof T]?: T[Key] extends Record<PropertyKey, unknown> ? DeepPartial<T[Key]> : T[Key] | undefined
}
