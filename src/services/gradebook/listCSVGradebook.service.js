import CanvasApi from "../../api/Canvas.api.js";

import Puppeteer from "../../utils/Puppeteer.js";

export default async function listCSVGradebookService(course_id, signal) {
  console.log("==== listGradebookService(course_id) ==========");

  console.log("1. Starting browser with Puppeteer.startBrowser()");
  const { browser, page } = await Puppeteer.startBrowser();

  console.log("2. Logging to Canvas with Puppeteer.loginToCanvas(page)");
  const { x_csrf_token, auth_cookies, user_id } = await Puppeteer.loginToCanvas(
    page
  );

  console.log(
    "3. Requesting a csv gradebook generation with Puppeteer.gradebookCSVRequest(page, course_id)"
  );
  const attachment_id = await Puppeteer.gradebookCSVRequest(
    course_id,
    auth_cookies,
    x_csrf_token,
    signal
  );

  console.log(
    "4. Getting the csv gradebook with CanvasApi.getGradebook(_normandy_session, attachment_id)"
  );
  const csvResponse = await CanvasApi.getGradebook(
    auth_cookies,
    attachment_id,
    signal
  );

  console.log("5. Closing browser with Puppeteer.closeBrowser(browser)");
  await Puppeteer.closeBrowser(browser);

  console.log("6. Returning the gradebook csv to the user");
  return csvResponse;
}
