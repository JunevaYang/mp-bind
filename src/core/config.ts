import {
  wxPlatformConfig,
  aliPlatformConfig,
  PlatformConfig,
} from "./platform";
import { logger } from "./Logger";

export interface IBaseOption {
  debug: boolean;
  platform: "ali" | "wx";
  unobserveKeys: (string | RegExp)[];
  watcherKeyRule: RegExp;
}

export interface IBaseConfig extends IBaseOption {
  readonly platformConf: PlatformConfig;
}

export enum ProxyKeys {
  PROXY = "__$PROXY$__",
  DATA = "__$DATA$__",
  OB = "__$OB$__",
}

export const configs: IBaseConfig = {
  debug: false,
  platform: "wx",
  unobserveKeys: ["frozen"],
  watcherKeyRule: /\$\$/,
  get platformConf() {
    const map = {
      wx: wxPlatformConfig,
      ali: aliPlatformConfig,
    };
    return map[configs.platform];
  },
};

export function setConfig(opt: Partial<IBaseOption> = {}) {
  Object.assign(configs, opt);
  logger.log("set config", opt);
}
