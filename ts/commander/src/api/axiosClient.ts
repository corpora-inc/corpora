import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';

export const customClient = async <T = any>(
    config: AxiosRequestConfig
): Promise<T> => {
    const response = await axios(config);
    return response.data;
};
