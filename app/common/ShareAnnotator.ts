import { normalizeEmail } from 'app/common/emails';
import { Features } from 'app/common/Features';
import { PermissionData, PermissionDelta } from 'app/common/UserAPI';

/**
 * Mark that the share is share number #at of a maximum of #top. The #at values
 * start at 1.
 */
export interface ShareLimitAnnotation {
  at: number;
  top?: number;
}

/**
 * Some facts about a share.
 */
export interface ShareAnnotation {
  isMember?: boolean;   // Is the share for a team member.
  isSupport?: boolean;  // Is the share for a support user.
  collaboratorLimit?: ShareLimitAnnotation;  // Does the share count towards a collaborator limit.
}

/**
 * Facts about all shares for a resource.
 */
export interface ShareAnnotations {
  hasTeam?: boolean;   // Is the resource in a team site?
  users: Map<string, ShareAnnotation>;  // Annotations keyed by normalized user email.
}

/**
 * Helper for annotating users mentioned in a proposed change of shares, given the
 * current shares in place.
 */
export class ShareAnnotator {
  constructor(private _features: Features, private _state: PermissionData) {
  }

  public updateState(state: PermissionData) {
    this._state = state;
  }

  public annotateChanges(change: PermissionDelta): ShareAnnotations {
    const features = this._features;
    const annotations: ShareAnnotations = {
      hasTeam: features.maxWorkspacesPerOrg !== 1,
      users: new Map(),
    };
    if (features.maxSharesPerDocPerRole || features.maxSharesPerWorkspace) {
      // For simplicity, don't try to annotate if limits not used at the time of writing
      // are in place.
      return annotations;
    }
    const top = features.maxSharesPerDoc;
    let at = 0;
    const makeAnnotation = (user: {email: string, isMember?: boolean, access: string|null}) => {
      const annotation: ShareAnnotation = {
        isMember: user.isMember,
      };
      if (user.email === 'support@getgrist.com') {
        return { isSupport: true };
      }
      if (!annotation.isMember && user.access) {
        at++;
        annotation.collaboratorLimit = {
          at,
          top
        };
      }
      return annotation;
    };
    const removed = new Set(
      Object.entries(change?.users||{}).filter(([, v]) => v === null)
        .map(([k, ]) => normalizeEmail(k)));
    for (const user of this._state.users) {
      if (removed.has(user.email)) { continue; }
      annotations.users.set(user.email, makeAnnotation(user));
    }
    const tweaks = new Set(
      Object.entries(change?.users||{}).filter(([, v]) => v !== null)
        .map(([k, ]) => normalizeEmail(k)));
    for (const email of tweaks) {
      const annotation = annotations.users.get(email) || makeAnnotation({
        email, isMember: false, access: '<set>',
      });
      annotations.users.set(email, annotation);
    }
    return annotations;
  }
}
