import { userCreateContract } from "./modules/user/create";
import { userListContract } from "./modules/user/list";

// Check what the type actually contains
type CreateType = typeof userCreateContract;
type CreateOrpc = CreateType["~orpc"];
type CreateMeta = CreateOrpc["meta"];

type ListType = typeof userListContract;
type ListOrpc = ListType["~orpc"];
type ListMeta = ListOrpc["meta"];

// Debug - show me what's in the meta
type CreateMetaKeys = keyof CreateMeta;
type ListMetaKeys = keyof ListMeta;

// Does it have our special key?
type HasCreateKey = "__orpc_route_builder_method__" extends keyof CreateMeta ? true : false;
type HasListKey = "__orpc_route_builder_method__" extends keyof ListMeta ? true : false;

// Force compiler errors to show types  
const testCreate: HasCreateKey = null as any;
const testList: HasListKey = null as any;
declare const showCreateMeta: CreateMeta;
declare const showListMeta: ListMeta;
console.log(testCreate, testList, showCreateMeta, showListMeta);
