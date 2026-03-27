import axios from 'axios';

// 配置 Axios 实例，指向你的 Spring Boot 后端地址
const api = axios.create({
  baseURL: 'http://localhost:8080', // 如果你的 Spring Boot 运行在不同端口，请修改这里
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器：在每个请求中自动注入 JWT Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // 这里的 'Bearer ' 前缀是 JWT 的标准写法
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：统一处理错误（例如 401 未授权）
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // 如果后端返回 401，说明 token 可能已过期或无效
      console.warn('登录已过期，请重新登录');
      localStorage.removeItem('token');
      // 跳转到登录页 (注意：如果在 React 组件外，可以使用 window.location)
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

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

// 获取热门游戏接口 (目前为模拟，方便以后对接 SpringBoot + MongoDB)
export const getHotGamesApi = async () => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // 模拟从数据库返回的数据格式
  return {
    code: 200,
    message: '获取成功',
    data: [
      {
        id: '1',
        title: '艾尔登法环',
        desc: '在破碎的交界地，开启一段史诗般的成王之旅。',
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop'
      },
      {
        id: '2',
        title: '赛博朋克 2077',
        desc: '进入夜之城，在霓虹灯火中改写你的命运。',
        image: 'https://images.unsplash.com/photo-1605898960710-99435860e653?q=80&w=2070&auto=format&fit=crop'
      },
      {
        id: '3',
        title: '战神：诸神黄昏',
        desc: '奎托斯与阿特柔斯再次踏上跨越九界的冒险。',
        image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2071&auto=format&fit=crop'
      }
    ]
  };
};

export default api;
