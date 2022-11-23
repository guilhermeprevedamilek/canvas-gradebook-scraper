import axios from "axios";
import fetch from "node-fetch";

import AppError from "../errors/AppError.js";
import { canvasUrl } from "../config.js";

// console.log("* Creating a axios instance");
const canvasApiV1 = axios.create({
  baseURL: `${canvasUrl}/api/v1`,
  withCredentials: true,
});

export default class CanvasApi {
  static async getGradebook(auth_cookies, attachment_id, signal) {
    // console.log("==== CanvasApi.getGradebook(_normandy_session, user_id, attachment_id) ==========");
    const { log_session_id, _legacy_normandy_session, _csrf_token } =
      auth_cookies;

    // console.log("2. Creating new Promise");
    return await new Promise(async (resolve, reject) => {
      // console.log("3. Creating the AppError template");
      const error = new AppError(
        "Something went wrong when retrieving the gradebook",
        400
      );

      // console.log("4. Setting up a timeout before start the request (10sec)");
      await new Promise((resolve) => setTimeout(resolve, 15000));

      // console.log("5. Setting up a timeout for the request (5sec)");
      const timer = setTimeout(async () => {
        reject(error);
      }, 5000);

      try {
        // console.log(
        //   "6. GET request (NODE-FETCH) on Canvas url with custom headers"
        // );
        const response = await fetch(
          `${canvasUrl}/files/${attachment_id}?download=1&amp`,
          {
            headers: {
              accept:
                "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
              "accept-language": "pt-PT,pt;q=0.9,en-US;q=0.8,en;q=0.7",
              "sec-ch-ua":
                '".Not/A)Brand";v="99", "Google Chrome";v="103", "Chromium";v="103"',
              "sec-ch-ua-mobile": "?0",
              "sec-ch-ua-platform": '"Windows"',
              "sec-fetch-dest": "document",
              "sec-fetch-mode": "navigate",
              "sec-fetch-site": "none",
              "sec-fetch-user": "?1",
              "upgrade-insecure-requests": "1",
              cookie: `log_session_id=${log_session_id}; _csrf_token=${_csrf_token}; _legacy_normandy_session=${_legacy_normandy_session}`,
            },
            signal,
            referrerPolicy: "strict-origin-when-cross-origin",
            body: null,
            method: "GET",
          }
        );

        const responseText = await response.text();

        // console.log(
        //   "8. Clearing the time and resolving the Promise with response"
        // );

        if (responseText.includes("<!DOCTYPE html>")) {
          throw Error;
        }

        clearTimeout(timer);

        resolve(responseText);
      } catch (err) {
        // console.log("> An error occurred, timer cleared and promise rejected");
        clearTimeout(timer);

        reject(error);
      }
    });
  }
}
