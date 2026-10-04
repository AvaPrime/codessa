/**
 * E-002 router. Selects a provider. Does not authorize, observe, or commit.
 */
import { ExecutionContract, ModelOutput } from "./execution-slice";

export interface ProviderAdapter {
  name: string;
  invoke(prompt: string, contractId: string): Promise<string>;
}

export interface RouteRequest {
  contract: ExecutionContract;
  action: string;
  prompt: string;
  provider?: string;
}

const providers = new Map<string, ProviderAdapter>();
let routeCalls = 0;

export function resetRouter(): void {
  routeCalls = 0;
  providers.clear();
  registerProvider({
    name: "mock-a",
    invoke: async () => "mock-a result",
  });
  registerProvider({
    name: "mock-b",
    invoke: async () => "mock-b result",
  });
}

export function registerProvider(provider: ProviderAdapter): void {
  providers.set(provider.name, provider);
}

export function routeCallCount(): number {
  return routeCalls;
}

export async function route(request: RouteRequest): Promise<ModelOutput> {
  routeCalls += 1;
  const name = request.provider ?? "mock-a";
  const provider = providers.get(name);
  if (!provider) {
    throw new Error(`unknown provider ${name}`);
  }
  const raw = await provider.invoke(request.prompt, request.contract.contract_id);
  return { provider: provider.name, run_id: request.contract.run_id, raw_result: raw };
}

resetRouter();
