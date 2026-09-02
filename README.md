# 项目目标

构建一个React+FastAPI+Agent的AI chat应用
未来拓展Agent Tool Chain

## 前端技术栈

React+Vite+TS+React Query+Zustand

## 后端技术栈

FastAPI+Pydantic+SQLAlchemy+Mysql+Redis

## AI

deepseek-V4-Pro
Langchain/LangGraph（后期）

## 业务

### 登录/注册

### 个人身份信息

### AI聊天

### 历史记录

### 加入地图/天气相关功能（后期）

## 架构

全部采用feature-based结构

## 本地运行 Redis

后端默认连接 `localhost:6379`。启动 FastAPI 前，请先启动 Redis 服务，否则验证码相关接口会报 `ConnectionRefusedError`。

Windows 可安装 Memurai（Redis 兼容服务）并启动其 Windows 服务，或在 WSL 中运行：

```bash
redis-server
```

确认端口可用后，再启动后端：

```powershell
Test-NetConnection localhost -Port 6379
```

输出中的 `TcpTestSucceeded` 应为 `True`。
