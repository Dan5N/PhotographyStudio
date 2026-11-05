import {
  defaultShouldDehydrateQuery,
  dehydrate,
  hydrate,
  type DehydratedState,
  QueryClient,
} from "@tanstack/react-query";

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 30 * 1000,
      }
    },
  });

export const dehydrateQueries = (client: QueryClient) => {
  return dehydrate(client, {
    shouldDehydrateQuery: defaultShouldDehydrateQuery,
  });
};

export const hydrateQueries = (client: QueryClient, dehydratedState: DehydratedState) => {
  return hydrate(client, dehydratedState);
};
