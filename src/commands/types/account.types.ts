import type { AntigravityCurrentUserInfo } from '../../types/tauri';

/**
 * 从 jetskiStateSync 解码出的账户信息（后端直接返回解码结果），
 * 为前端展示添加了一些派生字段。
 */
export type AntigravityAccount = AntigravityCurrentUserInfo & {
  id: string;
  name: string;
  email: string;
  api_key: string;
  profile_url: string;
  created_at: string;
  last_switched: string;
};

/**
 * 账户认证信息（保留扩展字段）
 */
export interface AntigravityAuthInfo {
  email?: string;
  db_path?: string;
  [key: string]: unknown;
}
