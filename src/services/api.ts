import axios from 'axios';

// 配置 Axios 实例，指向你的 Spring Boot 后端地址
const api = axios.create({
  baseURL: 'http://localhost:8080', // 如果你的 Spring Boot 运行在不同端口，请修改这里
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 定义统一的返回结构，对应后端的 ResultVO
export interface ResultVO<T> {
  code: number;
  message: string;
  data: T;
}

// 模拟 API 延迟 (可选，开发调试用)
// const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 登录接口
export const loginApi = async (data: any) => {
  try {
    const response = await api.post<ResultVO<any>>('/api/auth/login', data);
    return response.data;
  } catch (error: any) {
    // 处理 Axios 错误（例如 401, 400 等）
    const message = error.response?.data?.message || error.response?.data?.error || '登录失败';
    throw new Error(message);
  }
};

// 注册接口
export const registerApi = async (data: any) => {
  try {
    const response = await api.post<ResultVO<any>>('/api/auth/register', data);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || error.response?.data?.error || '注册失败';
    throw new Error(message);
  }
};

export default api;
