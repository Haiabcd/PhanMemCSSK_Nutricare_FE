import { api } from '../config/api';
import type { ApiResponse, InfoResponse } from '../types/types';
import { HeaderResponse } from '../types/user.type';


//Lấy thông tin cá nhân
export async function getMyInfo(signal?: AbortSignal): Promise<ApiResponse<InfoResponse>> {
    const res = await api.get<ApiResponse<InfoResponse>>('/users/my-info', { signal });
    return res.data;
}

//Lấy header
export async function getHeader(signal?: AbortSignal): Promise<ApiResponse<HeaderResponse>> {
    const res = await api.get<ApiResponse<HeaderResponse>>('/users/header', { signal });
    return res.data;
}
