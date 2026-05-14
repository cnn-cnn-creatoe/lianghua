import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api/tencent": {
        target: "https://qt.gtimg.cn",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tencent/, "")
      },
      "/api/sina": {
        target: "https://hq.sinajs.cn",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/sina/, ""),
        headers: {
          Referer: "https://finance.sina.com.cn/"
        }
      },
      "/api/eastmoney": {
        target: "https://datacenter-web.eastmoney.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/eastmoney/, ""),
        headers: {
          Referer: "https://data.eastmoney.com/"
        }
      },
      "/api/eastmoney-push2": {
        target: "https://push2.eastmoney.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/eastmoney-push2/, "")
      },
      "/api/ths": {
        target: "http://zx.10jqka.com.cn",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ths/, "")
      },
      "/api/baidu": {
        target: "https://finance.pae.baidu.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/baidu/, ""),
        headers: {
          Accept: "application/vnd.finance-web.v1+json",
          Origin: "https://gushitong.baidu.com",
          Referer: "https://gushitong.baidu.com/"
        }
      }
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
    globals: true
  }
});
