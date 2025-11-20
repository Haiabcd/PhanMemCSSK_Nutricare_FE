import { api } from '../config/api';
import type { ApiResponse, InfoResponse } from '../types/types';
import { HeaderResponse, UpdateRequest,WeightUpdateRequest} from '../types/user.type';


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

//Cập nhật hồ sơ 
export async function updateProfile(
    payload: UpdateRequest,
    signal?: AbortSignal
  ): Promise<ApiResponse<void>> {  
    const res = await api.put<ApiResponse<void>>('/profiles/update', payload, { signal });
    return res.data;
}

//Cập nhật cân nặng
export async function updateWeight(
  payload: WeightUpdateRequest,
  signal?: AbortSignal
): Promise<ApiResponse<void>> {  
  const res = await api.put<ApiResponse<void>>('/profiles/update-weight', payload, { signal });
  return res.data;
}