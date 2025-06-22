// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            // you can tweak defaults here: staleTime, retry, etc.
            staleTime: 1000 * 60, // 1m
            retry: 1,
        },
    },
});
