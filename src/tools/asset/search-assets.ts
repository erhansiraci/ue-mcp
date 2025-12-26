import { z } from "zod";
import { ConnectionManager } from "../../client/index.js";
import {
  formatSuccessResponse,
  formatErrorResponse,
  handleApiResponse,
} from "../../utils/index.js";

/**
 * Input schema for the search_assets tool
 */
export const searchAssetsSchema = z.object({
  query: z
    .string()
    .describe("Search query to find assets by name or path"),
  classFilter: z
    .string()
    .optional()
    .describe(
      "Optional class name to filter results (e.g., 'StaticMesh', 'Material', 'Blueprint')"
    ),
  pathFilter: z
    .string()
    .optional()
    .describe("Optional path prefix to limit search scope (e.g., '/Game/Characters')"),
  limit: z
    .number()
    .optional()
    .default(50)
    .describe("Maximum number of results to return (default: 50)"),
});

export type SearchAssetsInput = z.infer<typeof searchAssetsSchema>;

/**
 * Create the ue_search_assets tool
 *
 * Searches the asset registry for assets matching the query.
 */
export function createSearchAssetsTool(connectionManager: ConnectionManager) {
  return {
    name: "ue_search_assets",
    description:
      "Search the project's asset registry for assets by name, path, or class. " +
      "Returns asset paths that can be used with other tools. " +
      "Useful for finding meshes, materials, blueprints, textures, etc.",
    handler: async (args: SearchAssetsInput) => {
      if (connectionManager.isMockMode()) {
        const mockAssets = [
          { Path: "/Game/Characters/Mannequin/Mesh/SK_Mannequin", Class: "SkeletalMesh" },
          { Path: "/Game/StarterContent/Props/SM_Chair", Class: "StaticMesh" },
          { Path: "/Game/StarterContent/Materials/M_Basic_Floor", Class: "Material" },
        ].filter((a) => {
          if (args.query && !a.Path.toLowerCase().includes(args.query.toLowerCase())) {
            return false;
          }
          if (args.classFilter && a.Class !== args.classFilter) {
            return false;
          }
          if (args.pathFilter && !a.Path.startsWith(args.pathFilter)) {
            return false;
          }
          return true;
        });

        return formatSuccessResponse(
          { assets: mockAssets, count: mockAssets.length },
          `Mock: Found ${mockAssets.length} assets`
        );
      }

      const client = connectionManager.getHttpClient();

      const searchParams: Record<string, unknown> = {
        Query: args.query,
      };

      if (args.classFilter) {
        searchParams.Filter = { ClassNames: [args.classFilter] };
      }

      if (args.pathFilter) {
        searchParams.Filter = {
          ...(searchParams.Filter as object),
          PackagePaths: [args.pathFilter],
        };
      }

      if (args.limit) {
        searchParams.Limit = args.limit;
      }

      const response = await client.searchAssets(args.query, searchParams);

      const error = handleApiResponse(response);
      if (error) {
        return formatErrorResponse(error);
      }

      const assets = response.data as Array<{ Path: string; Class: string }> ?? [];

      return formatSuccessResponse(
        { assets, count: assets.length },
        `Found ${assets.length} assets matching "${args.query}"`
      );
    },
  };
}
