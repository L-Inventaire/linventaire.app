// eslint-disable-next-line @typescript-eslint/no-var-requires
const unoconv = require("unoconv-promise");
import { cleanFiles } from "../service";

export async function convertFromOffice(
  path: string,
  options: {
    numberOfPages?: number;
  }
): Promise<{ output: string; done: boolean }> {
  if (options.numberOfPages >= 1) {
    const outputPath = `${path}.pdf`;
    try {
      await unoconv.run({
        file: path,
        output: outputPath,
        export: `PageRange=1-${options.numberOfPages}`,
      });
    } catch (err) {
      cleanFiles([outputPath]);
      throw Error("Can't convert file with unoconv");
    }
    return { output: outputPath, done: true };
  } else {
    console.error("Unoconv can't processe, number of pages lower than 1");
  }
}
