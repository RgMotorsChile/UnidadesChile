import { handleImage } from "../server/images.mjs";

export const config = { runtime: "nodejs", maxDuration: 20 };

export default async function handler(req, res) {
  try {
    await handleImage(req, res);
  } catch {
    res.statusCode = 500;
    res.end("error");
  }
}
