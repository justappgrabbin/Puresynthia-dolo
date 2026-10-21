import { describe, expect, it } from "vitest";
import JSZip from "jszip";

import { parseZipProject, sourceFromModel, updateNode } from "../lib/project-model";

describe("project model", () => {
  it("preserves nested nodes, styles, assets, and source files from a ZIP", async () => {
    const zip = new JSZip();
    zip.file("index.html", '<main id="app"><section style="color:red"><button data-name="run">Run</button></section></main>');
    zip.file("styles.css", ".card{padding:12px}");
    zip.file("assets/logo.svg", "<svg></svg>");
    const model = await parseZipProject(await zip.generateAsync({ type: "arraybuffer" }), "Test project");
    expect(model.entryFile).toBe("index.html");
    expect(model.assets).toContain("assets/logo.svg");
    expect(Object.values(model.nodes).some((node) => node.name === "run" && node.parentId)).toBe(true);
    expect(Object.values(model.nodes).some((node) => node.style.color === "red")).toBe(true);
  });

  it("mutates a selected node back into the source representation", async () => {
    const zip = new JSZip();
    zip.file("index.html", "<main><button>Run</button></main>");
    const model = await parseZipProject(await zip.generateAsync({ type: "arraybuffer" }), "Mutation project");
    const buttonId = Object.keys(model.nodes).find((id) => model.nodes[id].tagName === "button")!;
    const changed = updateNode(model, buttonId, { text: "Launch", style: { color: "#FF6B5E" } });
    const source = sourceFromModel(changed);
    expect(source).toContain("Launch");
    expect(source).toContain("color:#FF6B5E");
  });
});
