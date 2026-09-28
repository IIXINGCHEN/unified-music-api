/**
 * node 内建模块的最小类型声明。
 *
 * 本包未声明 @types/node 依赖（有意为之：保持依赖面最小），运行时为
 * Node 22+，`createRequire` 保证可用；此文件仅补类型，不影响运行时。
 * 若将来引入 @types/node，可直接删除本文件（声明会合并，无冲突）。
 */
declare module "node:module" {
	export function createRequire(filename: string): {
		<T = unknown>(id: string): T;
		resolve(id: string): string;
	};
}
