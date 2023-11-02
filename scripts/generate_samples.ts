import fs from "node:fs";
import { chromium } from "@playwright/test";
import type * as maplibre from "maplibre-gl";
import { setTimeout as delay } from "node:timers/promises";

// Declare a global augmentation for the Window interface
declare global {
  interface Window {
    map?: maplibre.Map;
  }
}

type SampleSpecification = {
  /** location on the map, a string in the format "z/lat/lon" */
  location: string;
  /** name of this screenshot, used for the filename */
  name: string;
  /** Size in pixels of the clip */
  viewport: {
    /** Width of the clip */
    width: number;
    /** height of the clip */
    height: number;
  };
  /** If true, include the Americana demo map controls in the screenshot */
  controls?: boolean;
};

// Load list of locations to take map screenshots
const loadSampleLocations = (filePath: string): SampleSpecification[] => {
  const rawData = fs.readFileSync(filePath, "utf8");
  return JSON.parse(rawData);
};

const sampleFolder = "./samples";

const jsonSampleLocations = process.argv[2] ?? "test/sample_locations.json";

console.log(`Loading sample locations from ${jsonSampleLocations}`);

const screenshots: SampleSpecification[] =
  loadSampleLocations(jsonSampleLocations);

fs.mkdirSync(sampleFolder, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_BIN,
  args: ["--disable-web-security"],
});

const context = await browser.newContext();

const page = await context.newPage();

for (const screenshot of screenshots) {
  await page.setViewportSize(screenshot.viewport);
  await createImage(screenshot);
}

async function createImage(screenshot: SampleSpecification) {
  const pagePath: string = screenshot.controls ? "" : "bare_map.html";

  await page.goto(
    `http://localhost:1776/${pagePath}#map=${screenshot.location}`
  );

  //Wait to load fonts
  await page.evaluate(() => document.fonts.ready.then(() => true));

  // Wait for map to load, then wait two more seconds for images, etc. to load.
  try {
    await page.waitForFunction(() => window.map?.loaded());

    if (screenshot.controls) {
      //Fade delay
      await delay(500);
    }
  } catch (e) {
    console.log(`Timed out waiting for map load`);
  }

  try {
    await page.screenshot({
      path: `${sampleFolder}/${screenshot.name}.png`,
      type: "png",
    });
    console.log(`Created ${sampleFolder}/${screenshot.name}.png`);
  } catch (err) {
    console.error(err);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

await browser.close();
