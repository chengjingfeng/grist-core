import { GristLoadConfig } from 'app/common/gristUrls';
import { FullUser } from 'app/common/UserAPI';
import { Document } from 'app/gen-server/entity/Document';
import { Organization } from 'app/gen-server/entity/Organization';
import { Workspace } from 'app/gen-server/entity/Workspace';
import { HomeDBManager } from 'app/gen-server/lib/HomeDBManager';
import * as Comm from 'app/server/lib/Comm';
import { Hosts } from 'app/server/lib/extractOrg';
import { ICreate } from 'app/server/lib/ICreate';
import { IDocStorageManager } from 'app/server/lib/IDocStorageManager';
import { IPermitStore } from 'app/server/lib/Permit';
import { Sessions } from 'app/server/lib/Sessions';
import * as express from 'express';

/**
 * Basic information about a Grist server.  Accessible in many
 * contexts, including request handlers and ActiveDoc methods.
 */
export interface GristServer {
  readonly create: ICreate;
  getHost(): string;
  getHomeUrl(req: express.Request, relPath?: string): string;
  getHomeUrlByDocId(docId: string, relPath?: string): Promise<string>;
  getDocUrl(docId: string): Promise<string>;
  getOrgUrl(orgKey: string|number): Promise<string>;
  getResourceUrl(resource: Organization|Workspace|Document): Promise<string>;
  getGristConfig(): GristLoadConfig;
  getPermitStore(): IPermitStore;
  getExternalPermitStore(): IPermitStore;
  getSessions(): Sessions;
  getComm(): Comm;
  getHosts(): Hosts;
  getHomeDBManager(): HomeDBManager;
  getStorageManager(): IDocStorageManager;
}

export interface GristLoginSystem {
  getMiddleware(gristServer: GristServer): Promise<GristLoginMiddleware>;
  deleteUser(user: FullUser): Promise<void>;
}

export interface GristLoginMiddleware {
  getLoginRedirectUrl(req: express.Request, target: URL): Promise<string>;
  getSignUpRedirectUrl(req: express.Request, target: URL): Promise<string>;
  getLogoutRedirectUrl(req: express.Request, nextUrl: URL): Promise<string>;

  // Returns arbitrary string for log.
  addEndpoints(app: express.Express): Promise<string>;
}
