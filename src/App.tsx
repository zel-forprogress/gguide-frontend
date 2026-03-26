import { useRoutes } from 'react-router-dom';
import routes from './routes';
import './App.css';

/**
 * App 组件现在只负责渲染匹配到的路由
 * 所有的路由配置逻辑都解耦到了 routes 目录中
 */
function App() {
  const element = useRoutes(routes);

  return (
    <>
      {element}
    </>
  );
}

export default App;
