import { api } from '../config/api';
import type { ApiResponse, InfoResponse } from '../types/types';


//Lấy thông tin cá nhân
export async function getMyInfo(signal?: AbortSignal): Promise<ApiResponse<InfoResponse>> {
    const res = await api.get<ApiResponse<InfoResponse>>('/users/my-info', { signal });
    return res.data;
}
