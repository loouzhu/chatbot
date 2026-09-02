import { RouterProvider } from "react-router-dom";
import { ConfigProvider } from "antd";
import { MessageProvider } from "./context";
import zhCN from "antd/locale/zh_CN";
import { router } from "./routers";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        locale={zhCN}
        theme={{
          token: {
            colorPrimary: "#1677ff",
            borderRadius: 8,
            fontFamily:
              'Inter, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
          },
        }}
      >
        <MessageProvider>
          <RouterProvider router={router} />
        </MessageProvider>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export default App;
