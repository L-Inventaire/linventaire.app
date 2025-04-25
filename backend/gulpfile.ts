const gulp = require("gulp");
const through = require("through2");
import { compile } from "json-schema-to-typescript";
const fs = require("fs");
const endName = "schema.ts";
const routes = `./src/services/**/schemas/*${endName}`;

gulp.task("schema", () => {
  return gulp.src(routes).pipe(
    through.obj((chunk, enc, cb) => {
      const filename = chunk.path;
      import(filename).then((schema) => {
        // dynamic import
        console.log("Converting", filename);
        compile(schema.default, `IDTO`).then((ts) => {
          ts = ts.replace(/export interface /, "export default interface ");
          fs.writeFileSync(filename.replace(/\.ts$/, "").concat(".d.ts"), ts);
        });
      });
      cb(null, chunk);
    })
  );
});
// watch service
const { watch, series } = require("gulp");
exports.default = function () {
  watch(routes, series("schema"));
};
