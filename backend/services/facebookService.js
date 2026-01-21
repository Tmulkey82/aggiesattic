// backend/services/facebookService.js
//
// This module encapsulates posting to a Facebook Page via the Meta Graph API.
// IMPORTANT: All calls must happen server-side (never from the browser).

import axios from "axios";
import crypto from "crypto";

// Prefer being explicit; can be overridden via env.
const GRAPH_VERSION = process.env.FACEBOOK_GRAPH_VERSION || "v24.0";
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;

const getFacebookConfig = () => {
  const mode = String(process.env.FACEBOOK_MODE || "dev").toUpperCase();
  const pageId = process.env[`FACEBOOK_PAGE_ID_${mode}`];
  const accessToken = process.env[`FACEBOOK_PAGE_ACCESS_TOKEN_${mode}`];

  if (!pageId || !accessToken) {
    throw new Error(
      `Missing Facebook config for mode ${mode}. Provide FACEBOOK_PAGE_ID_${mode} and FACEBOOK_PAGE_ACCESS_TOKEN_${mode}.`
    );
  }

  return { mode, pageId, accessToken };
};

// Required when "Require app secret" is enabled in Meta app settings.
// appsecret_proof = HMAC_SHA256(access_token, app_secret)
const getAppSecretProof = (accessToken) => {
  const appSecret = process.env.FACEBOOK_APP_SECRET;

  if (!appSecret) {
    throw new Error("Missing FACEBOOK_APP_SECRET in environment variables");
  }

  return crypto.createHmac("sha256", appSecret).update(accessToken).digest("hex");
};

const normalizePostId = (data) => {
  // Depending on endpoint, Graph returns either:
  //  - feed post: { id: "{pageId}_{postId}" }
  //  - photo upload: { id: "{photoId}", post_id: "{pageId}_{postId}" }
  return data?.post_id || data?.id || null;
};

export const deletePost = async (postId) => {
  if (!postId) return { success: true };
  const { accessToken } = getFacebookConfig();
  const url = `${GRAPH}/${postId}`;

  const { data } = await axios.delete(url, {
    params: {
      access_token: accessToken,
      appsecret_proof: getAppSecretProof(accessToken),
    },
  });

  return data;
};

export const getRecentPosts = async (limit = 5) => {
  const { pageId, accessToken } = getFacebookConfig();
  const url = `${GRAPH}/${pageId}/feed`;

  const { data } = await axios.get(url, {
    params: {
      limit,
      access_token: accessToken,
      appsecret_proof: getAppSecretProof(accessToken),
    },
  });

  return data;
};

export const postToFeed = async ({ message, link } = {}) => {
  const { pageId, accessToken } = getFacebookConfig();
  const url = `${GRAPH}/${pageId}/feed`;

  const params = {
    access_token: accessToken,
    appsecret_proof: getAppSecretProof(accessToken),
  };

  if (message) params.message = message;
  if (link) params.link = link;

  const { data } = await axios.post(url, null, { params });
  return { raw: data, postId: normalizePostId(data) };
};

/**
 * Post a photo to the Page by providing a publicly accessible image URL.
 *
 * Backwards compatibility:
 *   - New signature: postPhotoByUrl({ imageUrl, caption })
 *   - Legacy signature: postPhotoByUrl(imageUrl, caption)
 */
export const postPhotoByUrl = async (arg1, arg2) => {
  const imageUrl = typeof arg1 === "string" ? arg1 : arg1?.imageUrl;
  const caption = typeof arg1 === "string" ? (arg2 || "") : (arg1?.caption || "");

  const { pageId, accessToken } = getFacebookConfig();
  const url = `${GRAPH}/${pageId}/photos`;

  const { data } = await axios.post(url, null, {
    params: {
      url: imageUrl,
      caption,
      access_token: accessToken,
      appsecret_proof: getAppSecretProof(accessToken),
    },
  });

  // Preserve legacy expectations: callers may look for data.id or data.post_id.
  return { raw: data, postId: normalizePostId(data), ...data };
};

/**
 * Legacy helper: post a simple text update to the Page.
 * Existing routes (e.g., listings) expect an object with `id`.
 */
export const postText = async (message) => {
  const posted = await postToFeed({ message });
  return posted.raw;
};

export const buildEventFacebookMessage = (event, { publicBaseUrl } = {}) => {
  const baseUrl = String(
    publicBaseUrl || process.env.PUBLIC_SITE_URL || "https://aggiesattic.org"
  ).replace(/\/$/, "");

  const title = event?.title ? String(event.title).trim() : "New Event";
  const description = event?.description ? String(event.description).trim() : "";

  const formatDate = (d) => {
    try {
      if (!d) return null;
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return null;
      return dt.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return null;
    }
  };

  const start = formatDate(event?.date);
  const end = formatDate(event?.endDate);
  let when = null;
  if (start && end && start !== end) when = `${start} – ${end}`;
  else if (start) when = start;
  else if (end) when = `Through ${end}`;

  const url = event?._id ? `${baseUrl}/events/${event._id}` : baseUrl;

  const lines = [];
  lines.push(title);
  if (when) lines.push(`When: ${when}`);
  if (description) {
    const max = 900;
    const trimmed =
      description.length > max ? `${description.slice(0, max - 1).trim()}…` : description;
    lines.push("");
    lines.push(trimmed);
  }
  lines.push("");
  lines.push(url);

  return { message: lines.join("\n"), link: url };
};

/**
 * Create a fresh Page post for an event.
 * If an image is available, we prefer a photo post (better presentation in feed).
 */
export const createEventPost = async (event) => {
  const { message, link } = buildEventFacebookMessage(event);

  const firstImageUrl =
    Array.isArray(event?.images) && event.images.length > 0 ? event.images[0]?.url : null;

  if (firstImageUrl) {
    const posted = await postPhotoByUrl({ imageUrl: firstImageUrl, caption: message });
    return { postId: posted.postId, raw: posted.raw, kind: "photo" };
  }

  const posted = await postToFeed({ message, link });
  return { postId: posted.postId, raw: posted.raw, kind: "feed" };
};

/**
 * For edits: Facebook does not reliably support mutating all aspects of a post.
 * We use a safe, deterministic strategy: delete the previous post (if any) and
 * create a new one that reflects current event state.
 */
export const replaceEventPost = async ({ previousPostId, event }) => {
  if (previousPostId) {
    try {
      await deletePost(previousPostId);
    } catch (err) {
      const meta = err.response?.data || err.message;
      // eslint-disable-next-line no-console
      console.warn("Facebook delete failed (continuing):", meta);
    }
  }

  return await createEventPost(event);
};
