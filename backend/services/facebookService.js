// backend/services/facebookService.js
import axios from "axios";

const GRAPH_VERSION = "v23.0"; // keep current; update when Meta bumps
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;

const getFacebookConfig = () => {
  const mode = (process.env.FACEBOOK_MODE || "dev").toUpperCase();
  const pageId = process.env[`FACEBOOK_PAGE_ID_${mode}`];
  const accessToken = process.env[`FACEBOOK_PAGE_ACCESS_TOKEN_${mode}`];
  if (!pageId || !accessToken) {
    throw new Error(`Missing Facebook config for mode ${mode}. Check envs.`);
  }
  return { pageId, accessToken };
};

export const postText = async (message) => {
  const { pageId, accessToken } = getFacebookConfig();
  const url = `${GRAPH}/${pageId}/feed`;
  const { data } = await axios.post(url, null, {
    params: { message, access_token: accessToken },
  });
  return data; // { id: "{pageId}_{postId}" }
};

export const postPhotoByUrl = async (imageUrl, caption = "") => {
  const { pageId, accessToken } = getFacebookConfig();
  const url = `${GRAPH}/${pageId}/photos`;
  const { data } = await axios.post(url, null, {
    params: { url: imageUrl, caption, access_token: accessToken },
  });
  // data.post_id may exist depending on publish flow
  return data;
};

export const deletePost = async (postId) => {
  const { accessToken } = getFacebookConfig();
  const url = `${GRAPH}/${postId}`;
  const { data } = await axios.delete(url, {
    params: { access_token: accessToken },
  });
  return data;
};

export const getRecentPosts = async (limit = 5) => {
  const { pageId, accessToken } = getFacebookConfig();
  const url = `${GRAPH}/${pageId}/feed`;
  const { data } = await axios.get(url, {
    params: { limit, access_token: accessToken },
  });
  return data; // { data: [...] }
};
