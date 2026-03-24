import axios from 'axios';

// 模拟数据库
const users = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
  },
];

// 模拟 API 延迟
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 模拟登录接口
export const loginApi = async (data: any) => {
  await sleep(500);
  const { username, password } = data;
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    return Promise.resolve({
      code: 200,
      message: '登录成功',
      data: { token: `fake-token-for-${username}` },
    });
  } else {
    return Promise.reject({
      code: 401,
      message: '用户名或密码错误',
    });
  }
};

// 模拟注册接口
export const registerApi = async (data: any) => {
  await sleep(500);
  const { username, password } = data;

  if (users.some(u => u.username === username)) {
    return Promise.reject({
      code: 400,
      message: '用户名已存在',
    });
  }

  const newUser = {
    id: users.length + 1,
    username,
    password,
  };
  users.push(newUser);

  return Promise.resolve({
    code: 200,
    message: '注册成功',
    data: { token: `fake-token-for-${username}` },
  });
};
