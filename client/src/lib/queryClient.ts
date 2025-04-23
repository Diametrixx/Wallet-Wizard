import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log(`API Request: ${method} ${url}`, data);
  
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    console.error(`API Error: ${res.status} ${res.statusText}`);
    const errorText = await res.text();
    console.error(`Error details:`, errorText);
    throw new Error(`${res.status}: ${errorText || res.statusText}`);
  }
  
  console.log(`API Response: ${res.status} ${res.statusText}`);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;
    console.log(`Query request: ${url}`, queryKey.slice(1));
    
    try {
      const res = await fetch(url, {
        credentials: "include",
      });

      console.log(`Query response status: ${res.status} ${res.statusText}`);
      
      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.warn("Unauthorized request (401), returning null as configured");
        return null;
      }

      if (!res.ok) {
        console.error(`Query Error: ${res.status} ${res.statusText}`);
        const errorText = await res.text();
        console.error(`Error details:`, errorText);
        throw new Error(`${res.status}: ${errorText || res.statusText}`);
      }
      
      const data = await res.json();
      console.log(`Query response data:`, data);
      return data;
    } catch (err) {
      console.error(`Query failed for ${url}:`, err);
      throw err;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      retryDelay: 1000,
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});
