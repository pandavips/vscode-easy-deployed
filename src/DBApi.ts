import { IProjectUrl } from "./analyze";

// const baseUrl = "39.100.94.43:3000/easy-deployed";
const baseUrl = "localhost:3000/easy-deployed";

// 在vscode中怎么区分开发环境?

// 获取当前hostname下所有可以使用的cookies
export const getCookiesByHostname = async (hostname: string): Promise<any[]> => {
  // const response = await fetch(baseUrl + "/easy-deployed/cookies");
  const response = await fetch(baseUrl + "/cookies?hostname=" + hostname);
  const json = await response.json();
  return json;
};

// 获取目前所有域名
export const getHostnames = async () => {
  const response = await fetch(baseUrl + "/easy-deployed/hostname/list");
  const json = await response.json();
  return json;
};

// 获取所有hostname下的项目以及环境信息
export const getEnvInfoByHostname = async (hostname: string): Promise<IProjectUrl[]> => {
  const response = await fetch("/hostname/env-url?hostname=" + hostname);
  const json = await response.json();
  return json;
};

// 更新hostname的环境信息
export const updateEnvInfoByHostname = async (hostname: string, envInfo: any) => {
  const response = await fetch(baseUrl + "/hostname/env-url", {
    method: "POST",
    body: JSON.stringify({ hostname, envInfo }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const json = await response.json();
  return json;
};
