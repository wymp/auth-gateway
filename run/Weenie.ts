import { SimpleSqlDbInterface, SimpleLoggerInterface } from "@wymp/ts-simple-interfaces";
import * as HttpProxy from "http-proxy";
import { Io, CacheInterface, ClientRoles, UserRoles } from "../src";
import { authz as Authz } from "./Authorizations";

export const io = (r: { sql: SimpleSqlDbInterface; cache: CacheInterface }) => ({
  io: new Io<ClientRoles, UserRoles>(r.sql, r.cache),
});

export const mockCache = () => ({
  cache: <CacheInterface>{
    get<T>(
      k: string,
      v: () => T | Promise<T>,
      ttl?: number,
      log?: SimpleLoggerInterface
    ): T | Promise<T> {
      return v();
    },
    clear(k?: string) {},
  },
});

export const proxy = () => ({ proxy: HttpProxy.createProxyServer({ xfwd: true }) });
export const authz = () => ({ authz: Authz });
