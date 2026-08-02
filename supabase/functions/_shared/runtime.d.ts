export {}

declare global {
  interface DenoEnvironment {
    get(name: string): string | undefined
  }

  interface DenoRuntime {
    env: DenoEnvironment
    serve(
      handler: (request: Request) => Response | Promise<Response>
    ): void
  }

  const Deno: DenoRuntime
}
