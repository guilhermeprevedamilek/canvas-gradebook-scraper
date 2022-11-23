import Puppeteer from "../../utils/Puppeteer.js";
import Formatters from "../../utils/Formatters.js";

export default async function listJSONSubmittedAssignmentsService(
  course_id,
  signal
) {
  console.log("==== listJSONSubmittedAssignmentsService(course_id) ==========");

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

  console.log(
    "4. Converting the submitted assignments csv to array with Formatters.csvToArray(csvResponse)"
  );
  const submittedAssignmentsArray = Formatters.csvToArray(csvResponse);

  console.log("5. Returning the submitted assignments array to the user");
  return submittedAssignmentsArray;
}
