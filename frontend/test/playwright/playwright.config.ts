import path from "path"

import { addAliases } from "module-alias"

import type { PlaywrightTestConfig } from "@playwright/test"

addAliases({
  "~": path.resolve(process.cwd(), "src"),
  "~~": process.cwd(),
})

const UPDATE_TAPES = process.env.UPDATE_TAPES || "false"

const config: PlaywrightTestConfig = {
  webServer: {
    /**
     * Note: You can speed up local testing by switching `prod` out for `start`
     * to skip the build, but be aware that then talkback and the Nuxt server
     * will be racing to warm up and the tests could start before talkback is
     * ready to start serving API responses. Playwright only lets you specify
     * one port to wait for a ready response from so there's no way around it.
     * Normally the build introduces more than enough time for talkback to
     * be ready by the time the Nuxt server is actually started.
     *
     * This doesn't mean _don't_ use `start`, it just means that once you've
     * debugged everything else, make sure to inspect the trace output for any
     * ConsoleMessage strings that refer to incorrect responses. Once you've
     * verified that there is indeed a tape saved for the response in question,
     * switch this back to `prod` and see if your tests pass.
     */
    command: "./node_modules/.bin/npm-run-all -p -r talkback prod:playwright",
    cwd: "/app",
    timeout: process.env.CI ? 60_000 * 5 : 60_000 * 10, // 5 minutes in CI, 10 in other envs
    port: 8443,
    reuseExistingServer: !process.env.CI || process.env.PWDEBUG === "1",
    env: {
      API_URL: "http://localhost:49153/",
      UPDATE_TAPES: UPDATE_TAPES,
      PW: "true",
    },
  },
  use: {
    baseURL: "http://localhost:8443",
    trace: "retain-on-failure",
  },
  timeout: 60 * 1e3,
  /**
   * When updating or recreating tapes, if we have more than one worker running
   * then Talkback is liable to see multiple requests at the same time that would
   * otherwise all match the same tape. Because the requests come in all at once
   * there isn't time for Talkback to have written the tape for one of the requests
   * and then reuse it for the others. If we run with a single worker when updating
   * tapes then we can avoid this problem. Defaulting to `undefined` means the
   * Playwright default of using 1/2 of the number of CPU cores continues to work otherwise.
   */
  workers: UPDATE_TAPES === "true" ? 1 : undefined,
  expect: {
    toMatchSnapshot: {
      // If the visual regression tests are flaky, we can increase this to 0.1 or 0.2.
      maxDiffPixelRatio: 0,
    },
  },
}

export default config
