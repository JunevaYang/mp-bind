import { BindPrototype, PrototypeConfig } from "./bind";
import { BaseConfigs, ProxyKeys } from "./config";
import { logger, def, JSONClone } from "./utils";
import { UpdateTaskQueue, JSONLike } from "./UpdateQueue";
import { ComputedValue } from "./Computed";
import { Observer } from "./Observer";

export interface InternalInstance extends Page.PageInstance {
  [ProxyKeys.PROXY]: ProxyInstance;
  [ProxyKeys.OB]: Observer;
  [key: string]: any;
}

export interface ProxyInstance<T = any, K = any> {
  target: Page.PageInstance<T, K>;
  data: JSONLike;
  computed: Record<string, ComputedValue>;
  watch: Record<string, any>;
  updateTask: UpdateTaskQueue;
}

function bindFunction(
  internal: InternalInstance,
  { tpl, propTypeMap }: PrototypeConfig
) {
  for (const key of propTypeMap.method) {
    internal[key] = tpl[key];
  }
}

function observe(target: InternalInstance, { propTypeMap }: PrototypeConfig) {
  for (const key of propTypeMap.data) {
    Object.defineProperty(target, key, {
      get() {
        return target[ProxyKeys.DATA][key];
      },
      set(value) {
        target[ProxyKeys.DATA][key] = value;
      },
    });
  }

  new Observer(target[ProxyKeys.DATA], {
    update: (path, newVal, oldVal) => {
      logger("observer update", path, newVal, oldVal);
      target[ProxyKeys.PROXY].updateTask.push({
        mode: "data",
        value: newVal as any,
        path: path,
      });
    },
  });
}

export function resolveOnload(target: BindPrototype, opt: PrototypeConfig) {
  target.onLoad = function (this: InternalInstance, ...args) {
    logger("Page loaded", this);
    if (BaseConfigs.debug) {
      // @ts-ignore
      global.page = this;
    }

    // 注意 this !== target
    const internal: ProxyInstance = {
      target: this,
      data: this.data,
      computed: {},
      watch: {},
      updateTask: new UpdateTaskQueue(this),
    };

    def(this, ProxyKeys.PROXY, internal);
    def(this, ProxyKeys.DATA, JSONClone(this.data));

    bindFunction(this, opt);
    observe(this, opt);

    const { tpl } = opt;

    tpl.onLoad?.apply(this, args);
  };
}