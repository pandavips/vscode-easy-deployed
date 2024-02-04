import { IProjectUrl } from "./analyze";

const baseUrl = "";

// 获取当前hostname下所有可以使用的cookies
export const getCookiesByHostname = async (hostname: string): Promise<any[]> => {
  // const response = await fetch(baseUrl + "/easy-deployed/cookies");
  const response = await fetch("http://localhost:3000/easy-deployed/cookies?hostname=" + hostname);
  const json = await response.json();
  return json;
};

// 获取目前所有域名
export const getHostnames = async () => {
  const response = await fetch("http://localhost:3000/easy-deployed/hostname/list");
  const json = await response.json();
  return json;
};

// 获取所有hostname下的项目以及环境信息
export const getEnvInfoByHostname = async (hostname: string): Promise<IProjectUrl[]> => {
  const response = await fetch("http://localhost:3000/easy-deployed/hostname/env-url?hostname=" + hostname);
  const json = await response.json();
  return json;
};

// 更新hostname的环境信息
export const updateEnvInfoByHostname = async (hostname: string, envInfo: any) => {
  const response = await fetch("http://localhost:3000/easy-deployed/hostname/env-url", {
    method: "POST",
    body: JSON.stringify({ hostname, envInfo }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  const json = await response.json();
  return json;
};

// 自动选择一个可能有效的cookie
export const autoSelectCookie = async (hostname: string) => {
  // const response = await fetch("http://localhost:3000/easy-deployed/cookies/auto-select?hostname=" + hostname);
  // const json = await response.json();
  // return json;
};
