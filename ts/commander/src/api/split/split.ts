/**
 * Generated by orval v7.10.0 🍺
 * Do not edit manually.
 * Corpora API
 * API for managing and processing corpora
 * OpenAPI spec version: 0.1.0
 */
import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  DataTag,
  DefinedInitialDataOptions,
  DefinedUseQueryResult,
  MutationFunction,
  QueryClient,
  QueryFunction,
  QueryKey,
  UndefinedInitialDataOptions,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from "@tanstack/react-query";

import * as axios from "axios";
import type { AxiosError, AxiosRequestConfig, AxiosResponse } from "axios";

import type {
  SplitResponseSchema,
  SplitVectorSearchSchema,
} from ".././schemas";

/**
 * Perform a vector similarity search for splits using a provided query vector.
 * @summary Vector Search
 */
export const vectorSearch = (
  splitVectorSearchSchema: SplitVectorSearchSchema,
  options?: AxiosRequestConfig,
): Promise<AxiosResponse<SplitResponseSchema[]>> => {
  return axios.default.post(
    `/api/corpora/split/search`,
    splitVectorSearchSchema,
    options,
  );
};

export const getVectorSearchMutationOptions = <
  TError = AxiosError<unknown>,
  TContext = unknown,
>(options?: {
  mutation?: UseMutationOptions<
    Awaited<ReturnType<typeof vectorSearch>>,
    TError,
    { data: SplitVectorSearchSchema },
    TContext
  >;
  axios?: AxiosRequestConfig;
}): UseMutationOptions<
  Awaited<ReturnType<typeof vectorSearch>>,
  TError,
  { data: SplitVectorSearchSchema },
  TContext
> => {
  const mutationKey = ["vectorSearch"];
  const { mutation: mutationOptions, axios: axiosOptions } = options
    ? options.mutation &&
      "mutationKey" in options.mutation &&
      options.mutation.mutationKey
      ? options
      : { ...options, mutation: { ...options.mutation, mutationKey } }
    : { mutation: { mutationKey }, axios: undefined };

  const mutationFn: MutationFunction<
    Awaited<ReturnType<typeof vectorSearch>>,
    { data: SplitVectorSearchSchema }
  > = (props) => {
    const { data } = props ?? {};

    return vectorSearch(data, axiosOptions);
  };

  return { mutationFn, ...mutationOptions };
};

export type VectorSearchMutationResult = NonNullable<
  Awaited<ReturnType<typeof vectorSearch>>
>;
export type VectorSearchMutationBody = SplitVectorSearchSchema;
export type VectorSearchMutationError = AxiosError<unknown>;

/**
 * @summary Vector Search
 */
export const useVectorSearch = <
  TError = AxiosError<unknown>,
  TContext = unknown,
>(
  options?: {
    mutation?: UseMutationOptions<
      Awaited<ReturnType<typeof vectorSearch>>,
      TError,
      { data: SplitVectorSearchSchema },
      TContext
    >;
    axios?: AxiosRequestConfig;
  },
  queryClient?: QueryClient,
): UseMutationResult<
  Awaited<ReturnType<typeof vectorSearch>>,
  TError,
  { data: SplitVectorSearchSchema },
  TContext
> => {
  const mutationOptions = getVectorSearchMutationOptions(options);

  return useMutation(mutationOptions, queryClient);
};
/**
 * Retrieve a Split by ID.
 * @summary Get Split
 */
export const getSplit = (
  splitId: string,
  options?: AxiosRequestConfig,
): Promise<AxiosResponse<SplitResponseSchema>> => {
  return axios.default.get(`/api/corpora/split/${splitId}`, options);
};

export const getGetSplitQueryKey = (splitId: string) => {
  return [`/api/corpora/split/${splitId}`] as const;
};

export const getGetSplitQueryOptions = <
  TData = Awaited<ReturnType<typeof getSplit>>,
  TError = AxiosError<unknown>,
>(
  splitId: string,
  options?: {
    query?: Partial<
      UseQueryOptions<Awaited<ReturnType<typeof getSplit>>, TError, TData>
    >;
    axios?: AxiosRequestConfig;
  },
) => {
  const { query: queryOptions, axios: axiosOptions } = options ?? {};

  const queryKey = queryOptions?.queryKey ?? getGetSplitQueryKey(splitId);

  const queryFn: QueryFunction<Awaited<ReturnType<typeof getSplit>>> = ({
    signal,
  }) => getSplit(splitId, { signal, ...axiosOptions });

  return {
    queryKey,
    queryFn,
    enabled: !!splitId,
    ...queryOptions,
  } as UseQueryOptions<Awaited<ReturnType<typeof getSplit>>, TError, TData> & {
    queryKey: DataTag<QueryKey, TData, TError>;
  };
};

export type GetSplitQueryResult = NonNullable<
  Awaited<ReturnType<typeof getSplit>>
>;
export type GetSplitQueryError = AxiosError<unknown>;

export function useGetSplit<
  TData = Awaited<ReturnType<typeof getSplit>>,
  TError = AxiosError<unknown>,
>(
  splitId: string,
  options: {
    query: Partial<
      UseQueryOptions<Awaited<ReturnType<typeof getSplit>>, TError, TData>
    > &
      Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof getSplit>>,
          TError,
          Awaited<ReturnType<typeof getSplit>>
        >,
        "initialData"
      >;
    axios?: AxiosRequestConfig;
  },
  queryClient?: QueryClient,
): DefinedUseQueryResult<TData, TError> & {
  queryKey: DataTag<QueryKey, TData, TError>;
};
export function useGetSplit<
  TData = Awaited<ReturnType<typeof getSplit>>,
  TError = AxiosError<unknown>,
>(
  splitId: string,
  options?: {
    query?: Partial<
      UseQueryOptions<Awaited<ReturnType<typeof getSplit>>, TError, TData>
    > &
      Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof getSplit>>,
          TError,
          Awaited<ReturnType<typeof getSplit>>
        >,
        "initialData"
      >;
    axios?: AxiosRequestConfig;
  },
  queryClient?: QueryClient,
): UseQueryResult<TData, TError> & {
  queryKey: DataTag<QueryKey, TData, TError>;
};
export function useGetSplit<
  TData = Awaited<ReturnType<typeof getSplit>>,
  TError = AxiosError<unknown>,
>(
  splitId: string,
  options?: {
    query?: Partial<
      UseQueryOptions<Awaited<ReturnType<typeof getSplit>>, TError, TData>
    >;
    axios?: AxiosRequestConfig;
  },
  queryClient?: QueryClient,
): UseQueryResult<TData, TError> & {
  queryKey: DataTag<QueryKey, TData, TError>;
};
/**
 * @summary Get Split
 */

export function useGetSplit<
  TData = Awaited<ReturnType<typeof getSplit>>,
  TError = AxiosError<unknown>,
>(
  splitId: string,
  options?: {
    query?: Partial<
      UseQueryOptions<Awaited<ReturnType<typeof getSplit>>, TError, TData>
    >;
    axios?: AxiosRequestConfig;
  },
  queryClient?: QueryClient,
): UseQueryResult<TData, TError> & {
  queryKey: DataTag<QueryKey, TData, TError>;
} {
  const queryOptions = getGetSplitQueryOptions(splitId, options);

  const query = useQuery(queryOptions, queryClient) as UseQueryResult<
    TData,
    TError
  > & { queryKey: DataTag<QueryKey, TData, TError> };

  query.queryKey = queryOptions.queryKey;

  return query;
}

/**
 * List all Splits for a specific CorpusTextFile.
 * @summary List Splits For File
 */
export const listSplitsForFile = (
  fileId: string,
  options?: AxiosRequestConfig,
): Promise<AxiosResponse<SplitResponseSchema[]>> => {
  return axios.default.get(`/api/corpora/split/file/${fileId}`, options);
};

export const getListSplitsForFileQueryKey = (fileId: string) => {
  return [`/api/corpora/split/file/${fileId}`] as const;
};

export const getListSplitsForFileQueryOptions = <
  TData = Awaited<ReturnType<typeof listSplitsForFile>>,
  TError = AxiosError<unknown>,
>(
  fileId: string,
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<ReturnType<typeof listSplitsForFile>>,
        TError,
        TData
      >
    >;
    axios?: AxiosRequestConfig;
  },
) => {
  const { query: queryOptions, axios: axiosOptions } = options ?? {};

  const queryKey =
    queryOptions?.queryKey ?? getListSplitsForFileQueryKey(fileId);

  const queryFn: QueryFunction<
    Awaited<ReturnType<typeof listSplitsForFile>>
  > = ({ signal }) => listSplitsForFile(fileId, { signal, ...axiosOptions });

  return {
    queryKey,
    queryFn,
    enabled: !!fileId,
    ...queryOptions,
  } as UseQueryOptions<
    Awaited<ReturnType<typeof listSplitsForFile>>,
    TError,
    TData
  > & { queryKey: DataTag<QueryKey, TData, TError> };
};

export type ListSplitsForFileQueryResult = NonNullable<
  Awaited<ReturnType<typeof listSplitsForFile>>
>;
export type ListSplitsForFileQueryError = AxiosError<unknown>;

export function useListSplitsForFile<
  TData = Awaited<ReturnType<typeof listSplitsForFile>>,
  TError = AxiosError<unknown>,
>(
  fileId: string,
  options: {
    query: Partial<
      UseQueryOptions<
        Awaited<ReturnType<typeof listSplitsForFile>>,
        TError,
        TData
      >
    > &
      Pick<
        DefinedInitialDataOptions<
          Awaited<ReturnType<typeof listSplitsForFile>>,
          TError,
          Awaited<ReturnType<typeof listSplitsForFile>>
        >,
        "initialData"
      >;
    axios?: AxiosRequestConfig;
  },
  queryClient?: QueryClient,
): DefinedUseQueryResult<TData, TError> & {
  queryKey: DataTag<QueryKey, TData, TError>;
};
export function useListSplitsForFile<
  TData = Awaited<ReturnType<typeof listSplitsForFile>>,
  TError = AxiosError<unknown>,
>(
  fileId: string,
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<ReturnType<typeof listSplitsForFile>>,
        TError,
        TData
      >
    > &
      Pick<
        UndefinedInitialDataOptions<
          Awaited<ReturnType<typeof listSplitsForFile>>,
          TError,
          Awaited<ReturnType<typeof listSplitsForFile>>
        >,
        "initialData"
      >;
    axios?: AxiosRequestConfig;
  },
  queryClient?: QueryClient,
): UseQueryResult<TData, TError> & {
  queryKey: DataTag<QueryKey, TData, TError>;
};
export function useListSplitsForFile<
  TData = Awaited<ReturnType<typeof listSplitsForFile>>,
  TError = AxiosError<unknown>,
>(
  fileId: string,
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<ReturnType<typeof listSplitsForFile>>,
        TError,
        TData
      >
    >;
    axios?: AxiosRequestConfig;
  },
  queryClient?: QueryClient,
): UseQueryResult<TData, TError> & {
  queryKey: DataTag<QueryKey, TData, TError>;
};
/**
 * @summary List Splits For File
 */

export function useListSplitsForFile<
  TData = Awaited<ReturnType<typeof listSplitsForFile>>,
  TError = AxiosError<unknown>,
>(
  fileId: string,
  options?: {
    query?: Partial<
      UseQueryOptions<
        Awaited<ReturnType<typeof listSplitsForFile>>,
        TError,
        TData
      >
    >;
    axios?: AxiosRequestConfig;
  },
  queryClient?: QueryClient,
): UseQueryResult<TData, TError> & {
  queryKey: DataTag<QueryKey, TData, TError>;
} {
  const queryOptions = getListSplitsForFileQueryOptions(fileId, options);

  const query = useQuery(queryOptions, queryClient) as UseQueryResult<
    TData,
    TError
  > & { queryKey: DataTag<QueryKey, TData, TError> };

  query.queryKey = queryOptions.queryKey;

  return query;
}
