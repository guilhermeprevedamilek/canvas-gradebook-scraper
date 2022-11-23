import Puppeteer from "../../utils/Puppeteer.js";

export default async function listCSVSubmittedAssignmentsService(
  course_id,
  signal
) {
  console.log("==== listCSVSubmittedAssignmentsService(course_id) ==========");

  console.log("1. Starting browser with Puppeteer.startBrowser()");
  const { browser, page } = await Puppeteer.startBrowser();

  console.log("2. Logging to Canvas with Puppeteer.loginToCanvas(page)");
  const { x_csrf_token, auth_cookies, user_id } = await Puppeteer.loginToCanvas(
    page
  );

  console.log(
    "3. Requesting submitted assignments with Puppeteer.submittedAssignmentsRequest(page, course_id)"
  );
  const csvResponse = await Puppeteer.submittedAssignmentsRequest(
    page,
    course_id,
    x_csrf_token,
    auth_cookies,
    user_id,
    signal
  );

  console.log("4. Closing browser with Puppeteer.closeBrowser(browser)");
  await Puppeteer.closeBrowser(browser);

  console.log("5. Returning the gradebook csv to the user");
  return csvResponse;
}
