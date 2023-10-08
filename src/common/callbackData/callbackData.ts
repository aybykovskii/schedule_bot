import { Assertion } from '../assertion'

type GetFields<T extends string> = T extends `${string}{${infer U}}${infer Rest}` ? U | GetFields<Rest> : never

type HasRequiredFields<T extends string, Required extends string> = Required extends GetFields<T> ? true : false

type FillValues<
  T extends string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Values extends Record<PropertyKey, any>
> = T extends `${infer U}{${infer Field}}${infer Rest}`
  ? Field extends keyof Values
    ? `${U}{${Values[Field]}}${FillValues<Rest, Values>}`
    : `${U}{${Field}}${FillValues<Rest, Values>}`
  : T

export class CallbackData<T extends string> {
  private data: T

  regex: RegExp

  constructor(data: T) {
    this.data = data
    this.regex = new RegExp(data.replace(/(?<={)([\w.]*)(?=})/g, `[\\w.]*`))
  }

  private getterMatch = (str: string) =>
    str.match(/(?<={)([\w.]*)(?=})/g)?.map((s) => s.replace(/\{([\w.]*)\}/gi, '$1')) as string[]

  match = <Str extends string = string>(str: Str) =>
    this.regex.test(str) as HasRequiredFields<Str, GetFields<T>> extends true ? true : boolean

  fill = <Value, Values extends Record<GetFields<T>, Value>>(fields: Values) => {
    return this.data.replace(/\{(\w*)\}/gi, (_, key: GetFields<T>) => `{${fields[key]}}`) as FillValues<T, Values>
  }

  get = <Result extends Record<GetFields<T>, string> = Record<GetFields<T>, string>>(str: string) => {
    Assertion.client(this.match(str), 'Callback data does not match')

    const values = this.getterMatch(str)

    return this.getterMatch(this.data).reduce((acc, field, index) => ({ ...acc, [field]: values[index] }), {} as Result)
  }
}
