import { logger } from "config/logger.js";

import { PDFParse } from "pdf-parse";

async function test() {
  logger.info(typeof PDFParse);
}
test();

