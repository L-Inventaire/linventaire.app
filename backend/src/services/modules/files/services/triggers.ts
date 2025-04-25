import _ from "lodash";
import Files from "..";
import {
  default as Framework,
  default as platform,
} from "../../../../platform";
import { FilesDefinition, Files as FilesType } from "../entities/files";
import { deleteFile } from "./files";

export const setFilesTriggers = () => {
  // When any document gets changed, we must check the content to see if files were unreferenced and mark it as unreferenced
  // Later client we'll be able to cleanup unreferenced files
  Framework.TriggersManager.registerTrigger<FilesType>("*", {
    test: (_ctx, newEntity, oldEntity) => {
      const matchedFiles = Array.from(
        JSON.stringify(newEntity || {}).matchAll(/"files:([A-Za-z0-9]+)"/gm)
      ).map((a) => a[1]);
      const oldMatchedFiles = Array.from(
        JSON.stringify(oldEntity || {}).matchAll(/"files:([A-Za-z0-9]+)"/gm)
      ).map((a) => a[1]);

      return (
        (oldEntity &&
          !!JSON.stringify(oldEntity).match(/"files:[A-Za-z1-9]+"/)) ||
        (newEntity &&
          !_.isEqual(_.sortBy(matchedFiles), _.sortBy(oldMatchedFiles)))
      );
    },
    callback: async (ctx, newEntity, oldEntity, { table }) => {
      // In case of newly created files for an entity, the rel_id will be empty, so we can fix it there
      // FilesInput will omit the entity id and mark files as unreferenced
      if (newEntity) {
        const matchedFiles = Array.from(
          JSON.stringify(newEntity).matchAll(/"files:([A-Za-z0-9]+)"/gm)
        ).map((a) => a[1]);
        const oldMatchedFiles = Array.from(
          JSON.stringify(oldEntity).matchAll(/"files:([A-Za-z0-9]+)"/gm)
        ).map((a) => a[1]);

        if (!_.isEqual(_.sortBy(matchedFiles), _.sortBy(oldMatchedFiles))) {
          if (matchedFiles.length > 0) {
            const driver = await platform.Db.getService();
            for (const id of matchedFiles) {
              const files = await driver.select<FilesType>(
                ctx,
                FilesDefinition.name,
                {
                  client_id: newEntity.client_id,
                  id,
                },
                {}
              );
              for (const file of files.filter(
                (a) => !a.rel_id && a.rel_unreferenced
              )) {
                await driver.update<FilesType>(
                  ctx,
                  FilesDefinition.name,
                  { id: file.id },
                  {
                    rel_id: newEntity.id,
                    rel_unreferenced: false,
                  }
                );
              }
            }
          }
        }
      }

      if (oldEntity) {
        // Check if it has potentially files somewhere
        // Easy as we'll store files in the format files:id or [files:id]
        const hasFilesChanges =
          !!JSON.stringify(oldEntity).match(/"files:[A-Za-z1-9]+"/);

        if (hasFilesChanges) {
          const driver = await platform.Db.getService();
          const referencedFiles = await driver.select<FilesType>(
            ctx,
            FilesDefinition.name,
            {
              client_id: oldEntity.client_id,
              rel_table: table,
              rel_id: oldEntity.id,
            },
            {}
          );
          for (const file of referencedFiles) {
            if (!_.get(newEntity, file.rel_field)) {
              await driver.update<FilesType>(
                ctx,
                FilesDefinition.name,
                { id: file.id },
                { rel_unreferenced: true }
              );
            }
          }
        }
      }
    },
    name: "files-triggers",
    priority: 1000, // Always do it after everything else
  });

  // When file is deleted, we must delete the file from the relevant rel and from the file system
  Framework.TriggersManager.registerTrigger<FilesType>(FilesDefinition, {
    name: "files-delete-triggers",
    test: (_ctx, newEntity, oldEntity) => {
      return !!(!newEntity && oldEntity);
    },
    callback: async (ctx, newEntity, oldEntity) => {
      if (!newEntity && oldEntity) {
        // We just deleted a file, let's check if it was referenced

        // First check if the same file is referenced in another table
        const driver = await platform.Db.getService();
        const references = await driver.select<FilesType>(
          ctx,
          FilesDefinition.name,
          {
            client_id: oldEntity.client_id,
            key: oldEntity.key,
            rel_unreferenced: false,
          },
          {}
        );

        if (references.length > 1) return; // Object will be deleted when last reference is deleted

        Files.logger.info(
          ctx,
          `File ${oldEntity.key} is unreferenced, it will be deleted from the file system`
        );
        await deleteFile(ctx, oldEntity);
      }
    },
  });
};
