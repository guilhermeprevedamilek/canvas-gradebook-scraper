import puppeteer from "puppeteer";
import fetch from "node-fetch";

import AppError from "../errors/AppError.js";

import { canvasUrl, login, password } from "../config.js";

export default class Puppeteer {
  static selectors = {
    USERNAME_SELECTOR: "#pseudonym_session_unique_id",
    PASSWORD_SELECTOR: "#pseudonym_session_password",
    CTA_SELECTOR: ".Button.Button--login",
    DOWNLOAD_BUTTON_SELECTOR: "#content > div > span > a",
  };

  static async startBrowser() {
    // console.log("==== startBrowser() ==========");

    // console.log("1. Starting browser");
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox"],
    });

    // console.log("2. Starting new page");
    const page = await browser.newPage();

    // console.log("3. Returning browser and page");
    return { browser, page };
  }

  static async closeBrowser(browser) {
    // console.log("==== closeBrowser(browser) ==========");

    // console.log("1. Closing browser");
    await browser.close();
  }

  static async loginToCanvas(page) {
    // console.log("==== loginToCanvas(page) ==========");

    try {
      // console.log("1. Going to login page");
      await page.goto(`${canvasUrl}/login`, { waitUntil: "networkidle2" });

      // console.log("2. Selecting login input");
      await page.click(Puppeteer.selectors.USERNAME_SELECTOR);

      // console.log("3. Typing the login");
      await page.keyboard.type(login);

      // console.log("4. Selecting password input");
      await page.click(Puppeteer.selectors.PASSWORD_SELECTOR);

      // console.log("5. Typing the password");
      await page.keyboard.type(password);

      let x_csrf_token = "";

      // console.log("6. Waiting for Promise");
      await Promise.all([
        // console.log("6.1. Clicking the login button"),
        page.click(Puppeteer.selectors.CTA_SELECTOR),

        page.on("request", (request) => {
          const headers = request.headers();

          if (!!headers["x-csrf-token"]) {
            x_csrf_token = headers["x-csrf-token"];
          }
        }),

        //console.log("6.2. Waiting for the page to load"),
        page.waitForNavigation({ waitUntil: "networkidle2" }),
      ]);

      // console.log("7. Getting the cookies from the page");
      const cookies = await page.cookies();

      // console.log("8. Finding the _normandy_session cookie");
      const auth_cookies = {};

      await cookies.map(({ name, value }) => {
        if (
          name === "log_session_id" ||
          "_legacy_normandy_session" ||
          "_csrf_token"
        ) {
          auth_cookies[name] = value;
        }
      });

      // console.log("9. Checking if the _normandy_session cookie exists");
      if (
        !auth_cookies.log_session_id &&
        !auth_cookies._legacy_normandy_session &&
        !auth_cookies._csrf_token
      ) {
        throw Error;
      }

      // console.log("11. Taking a screenshot of the page");
      // await page.screenshot({ path: "./src/screenshots/loginPage.png" });

      // console.log("12. Returning _normandy_session and user_id");
      return { x_csrf_token, auth_cookies };
    } catch (err) {
      // console.log("> An error has occurred");
      throw new AppError("Login failed", 400);
    }
  }

  static async gradebookCSVRequest(
    course_id,
    auth_cookies,
    x_csrf_token,
    signal
  ) {
    const { log_session_id, _legacy_normandy_session, _csrf_token } =
      auth_cookies;

    try {
      // console.log("1. Going to gradebook CSV request page");
      const response = await fetch(
        `${canvasUrl}/courses/${course_id}/gradebook_csv`,
        {
          headers: {
            accept:
              "application/json+canvas-string-ids, application/json, text/plain, */*",
            "accept-language": "pt-PT,pt;q=0.9,en-US;q=0.8,en;q=0.7",
            "content-type": "application/json;charset=UTF-8",
            "sec-ch-ua":
              '".Not/A)Brand";v="99", "Google Chrome";v="103", "Chromium";v="103"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-csrf-token": `${x_csrf_token}`,
            "x-requested-with": "XMLHttpRequest",
            cookie: `log_session_id=${log_session_id}; _csrf_token=${_csrf_token}; _legacy_normandy_session=${_legacy_normandy_session}`,
            Referer: `${canvasUrl}/courses/${course_id}/gradebook`,
            "Referrer-Policy": "no-referrer-when-downgrade",
          },
          signal,
          method: "POST",
        }
      );

      const responseJSON = await response.json();

      return responseJSON.attachment_id;
    } catch (err) {
      // console.log("> An error has occurred");
      throw new AppError("Course not found", 404);
    }
  }

  static async submittedAssignmentsRequest(
    page,
    course_id,
    x_csrf_token,
    auth_cookies
  ) {
    // console.log("==== submittedAssignmentsRequest(page, course_id) ==========");

    const { log_session_id, _legacy_normandy_session, _csrf_token } =
      auth_cookies;

    try {
      // console.log("1. Going to gradebook page");
      await page.goto(`${canvasUrl}/courses/${course_id}/gradebook`, {
        waitUntil: "networkidle2",
      });

      const submissions = {};
      const graded = {};
      let assignments = [];

      // console.log("2. Taking a screenshot of the page");
      // await page.screenshot({
      //   path: "./src/screenshots/submittedAssignments.png",
      // });

      const bodyInnerHTML = await page.$eval("body", (el) => el.innerHTML);

      const ignoredAssignments = process.env.IGNORED_ASSIGNMENTS.split(",");

      // console.log("3. Extracting informations from gradebook");
      // for (let sprint = 1; sprint <= 8; sprint++) {
      const urls = await handleGetJsonLinks(/* sprint */);
      assignments = await handleGetAssignments(urls);

      for (const assignment of assignments) {
        submissions[assignment.title] = assignment.submissions.reduce(
          (accumulator, submission) => {
            if (submission.submitted_at) {
              if (submission.workflow_state === "graded") {
                const comments = submission.submission_comments.filter(
                  (comment) => comment.authorId !== submission.user_id
                );

                comments.forEach((comment) => {
                  if (graded[comment.author_name]) {
                    graded[comment.author_name]++;
                  } else {
                    graded[comment.author_name] = 1;
                  }
                });
              }

              return [...accumulator, submission.user_id];
            }
            return [...accumulator];
          },
          []
        );
      }
      // }

      // console.log("4. Converting informations to CSV");
      const submittedAssignmentsCsv = handleConvertSubmittedToCsv(submissions);

      async function handleGetJsonLinks(sprint, signal) {
        return await page.evaluate(
          async (
            canvasUrl,
            course_id,
            sprint,
            bodyInnerHTML,
            ignoredAssignments
          ) => {
            const jsonLinks = [];

            const tempBody = document.createElement("body");
            tempBody.innerHTML = bodyInnerHTML;

            const anchorTagClasses = ".fOyUs_bGBk, .fbyHH_bGBk, .fbyHH_bSMN";

            const anchorTags = tempBody.querySelectorAll(anchorTagClasses);

            anchorTags.forEach((anchorTag) => {
              const href = anchorTag.getAttribute("href");

              if (href == null || href == undefined) {
                return;
              }

              const splittedHrefLink = String(href).split("/");

              const assignmentsIndex = splittedHrefLink.indexOf("assignments");

              if (assignmentsIndex == -1) {
                return;
              }

              const assignmentId = splittedHrefLink.splice(
                assignmentsIndex + 1,
                1
              )[0];

              if (assignmentId !== "null" || assignmentId !== "undefined") {
                const title = anchorTag.textContent.toLocaleLowerCase();

                const itsVerified = ignoredAssignments.every(
                  (assignment) => !title.includes(assignment)
                );

                if (
                  itsVerified &&
                  // title.includes(`s${sprint}`) &&
                  title !== ""
                ) {
                  jsonLinks.push(
                    `${canvasUrl}/courses/${course_id}/gradebook/speed_grader.json?assignment_id=${assignmentId}`
                  );
                }
              }
            });

            return jsonLinks;
          },
          canvasUrl,
          course_id,
          sprint,
          bodyInnerHTML,
          ignoredAssignments
        );
      }

      async function get(url) {
        // const response = await fetch(url, {
        //   method: "GET",
        //   mode: "no-cors",
        //   headers: {
        //     Authorization: `Bearer ${process.env.TOKEN}`,
        //   },
        // });

        // === MODO DE BACKUP ===
        const response = await fetch(url, {
          headers: {
            accept:
              "application/json+canvas-string-ids, application/json, text/plain, */*",
            "accept-language": "pt-PT,pt;q=0.9,en-US;q=0.8,en;q=0.7",
            "content-type": "application/json;charset=UTF-8",
            "sec-ch-ua":
              '".Not/A)Brand";v="99", "Google Chrome";v="103", "Chromium";v="103"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-csrf-token": `${x_csrf_token}`,
            "x-requested-with": "XMLHttpRequest",
            cookie: `log_session_id=${log_session_id}; _csrf_token=${_csrf_token}; _legacy_normandy_session=${_legacy_normandy_session}`,
            Referer: `${canvasUrl}/courses/${course_id}/gradebook`,
            "Referrer-Policy": "no-referrer-when-downgrade",
          },
          signal,
          method: "GET",
        });

        return await response.json();
      }

      async function handleGetAssignments(urls) {
        const promises = [];

        // for (const url of urls) {
        //   promises.push(await get(url));
        // }

        // return promises;

        for (let url of urls) {
          promises.push(get(url));
        }

        const assignments = await Promise.all(promises);

        return assignments;
      }

      function handleConvertSubmittedToCsv(submissions) {
        const tabela = [[]];
        let maior = 0;

        for (let assignmentId in submissions) {
          const submission = submissions[assignmentId];
          if (submission.length > maior) {
            maior = submission.length;
          }
          tabela[0].push(assignmentId);
        }
        for (let index = 1; index < maior; index++) {
          for (let assignmentId in submissions) {
            const submission = submissions[assignmentId];
            if (tabela[index]) {
              tabela[index].push(submission.shift());
            } else {
              tabela[index] = [];
              tabela[index].push(submission.shift());
            }
          }
        }
        return tabela.map((list) => list.join(",")).join("\n");
      }

      return submittedAssignmentsCsv;
    } catch (err) {
      // console.log("> An error has occurred");
      throw new AppError("Submitted assignments extraction failed", 400);
    }
  }
}
