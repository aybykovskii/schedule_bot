export type SucceedResponse<T> = { success: true; data: T }
export type FailedResponse = { success: false; error: string }

export type Response<T> = SucceedResponse<T> | FailedResponse
export type PromiseResponse<T> = Promise<Response<T>>
