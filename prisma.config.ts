// @ts-nocheck
import { definePrismaConfig } from "prisma/config";

export default definePrismaConfig({
  orm: {
    schemaPath: "prisma/schema.prisma",
    family: "mysql",
    target: "node",
    adapter: "native"
  },
  skills: {
    agents: ["claude", "cursor", "agents", "devin"],
  },
});