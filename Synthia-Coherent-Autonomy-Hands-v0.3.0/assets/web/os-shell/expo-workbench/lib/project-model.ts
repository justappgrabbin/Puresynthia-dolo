import { parseDocument } from "htmlparser2";
import type { ChildNode, Element, Document } from "domhandler";
import { render } from "dom-serializer";
import JSZip from "jszip";

export type SystemNodeType = "tool" | "automaton" | "state" | "world" | "input" | "output" | "component";

export type ProjectNode = {
  id: string;
  type: SystemNodeType;
  tagName?: string;
  name: string;
  text: string;
  attributes: Record<string, string>;
  style: Record<string, string>;
  parentId: string | null;
  childIds: string[];
  sourceStart?: number;
  sourceEnd?: number;
};

export type MeshConnection = {
  id: string;
  fromNodeId: string;
  fromPort: string;
  toNodeId: string;
  toPort: string;
  dataType: string;
};

export type ProjectModel = {
  name: string;
  entryFile: string;
  files: Record<string, string | Uint8Array>;
  nodes: Record<string, ProjectNode>;
  rootNodeIds: string[];
  connections: MeshConnection[];
  assets: string[];
  framework: "html" | "react" | "vue" | "svelte" | "unknown";
};

function textContent(node: ChildNode): string {
  if (node.type === "text") return node.data.trim();
  if ("children" in node && node.children) return node.children.map(textContent).filter(Boolean).join(" ").trim();
  return "";
}

function inferType(element: Element): SystemNodeType {
  const marker = `${element.name} ${element.attribs?.id ?? ""} ${element.attribs?.class ?? ""}`.toLowerCase();
  if (/input|textarea|select|form/.test(element.name)) return "input";
  if (/button|action|tool/.test(marker)) return "tool";
  if (/automata|automation|workflow|engine/.test(marker)) return "automaton";
  if (/state|store|context|status/.test(marker)) return "state";
  if (/world|scene|canvas|object|entity/.test(marker)) return "world";
  if (/output|result|response/.test(marker)) return "output";
  return "component";
}

function parseStyle(value: string | undefined) {
  return Object.fromEntries((value ?? "").split(";").map((part) => part.split(":").map((item) => item.trim())).filter(([key, val]) => key && val));
}

function walk(element: Element, model: ProjectModel, parentId: string | null, path: string) {
  const id = `${path}-${element.name}`;
  const node: ProjectNode = {
    id,
    type: inferType(element),
    tagName: element.name,
    name: element.attribs?.["data-name"] || element.attribs?.id || element.name,
    text: textContent(element),
    attributes: { ...(element.attribs ?? {}) },
    style: parseStyle(element.attribs?.style),
    parentId,
    childIds: [],
  };
  model.nodes[id] = node;
  if (parentId) model.nodes[parentId]?.childIds.push(id);
  else model.rootNodeIds.push(id);
  const children: Element[] = (element.children ?? []).filter((child: ChildNode): child is Element => child.type === "tag");
  children.forEach((child, index) => walk(child, model, id, `${path}-${index}`));
}

function findEntry(files: Record<string, string | Uint8Array>) {
  return Object.keys(files).find((name) => /(^|\/)index\.html?$/i.test(name)) ?? Object.keys(files).find((name) => /\.html?$/i.test(name));
}

export async function parseZipProject(bytes: ArrayBuffer, name: string): Promise<ProjectModel> {
  const zip = await JSZip.loadAsync(bytes);
  const files: Record<string, string | Uint8Array> = {};
  const names = Object.keys(zip.files).filter((fileName) => !zip.files[fileName].dir);
  for (const fileName of names) {
    const isText = /\.(html?|css|js|jsx|ts|tsx|json|vue|svelte|md)$/i.test(fileName);
    files[fileName] = isText ? await zip.files[fileName].async("string") : await zip.files[fileName].async("uint8array");
  }
  const entryFile = findEntry(files) ?? "index.html";
  const source = typeof files[entryFile] === "string" ? files[entryFile] as string : "";
  const document = parseDocument(source);
  const model: ProjectModel = { name, entryFile, files, nodes: {}, rootNodeIds: [], connections: [], assets: names.filter((fileName) => /\.(png|jpe?g|gif|svg|webp|woff2?|ttf)$/i.test(fileName)), framework: /\.tsx?$/.test(names.join(" ")) ? "react" : names.some((fileName) => /\.vue$/i.test(fileName)) ? "vue" : names.some((fileName) => /\.svelte$/i.test(fileName)) ? "svelte" : "html" };
  const roots: Element[] = (document.children ?? []).filter((child: ChildNode): child is Element => child.type === "tag");
  roots.forEach((root, index) => walk(root, model, null, `root-${index}`));
  return model;
}

export function updateNode(model: ProjectModel, nodeId: string, patch: Partial<Pick<ProjectNode, "name" | "text" | "attributes" | "style">>) {
  const current = model.nodes[nodeId];
  if (!current) return model;
  return { ...model, nodes: { ...model.nodes, [nodeId]: { ...current, ...patch } } };
}

export function sourceFromModel(model: ProjectModel) {
  const source = model.files[model.entryFile];
  if (typeof source !== "string") return "";
  const doc: Document = parseDocument(source);
  const orderedNodeIds = Object.keys(model.nodes);
  let nodeCursor = 0;
  const apply = (element: Element) => {
    const nodeId = orderedNodeIds[nodeCursor++];
    if (nodeId) {
      const node = model.nodes[nodeId];
      if (node.text && element.children) {
        const firstText = element.children.find((child: ChildNode) => child.type === "text");
        if (firstText) firstText.data = node.text;
      }
      const style = Object.entries(node.style).map(([key, value]) => `${key}:${value}`).join(";");
      if (style) element.attribs.style = style;
      Object.entries(node.attributes).forEach(([key, value]) => { if (key !== "style") element.attribs[key] = value; });
    }
    (element.children ?? []).filter((child: ChildNode): child is Element => child.type === "tag").forEach(apply);
  };
  doc.children.filter((child: ChildNode): child is Element => child.type === "tag").forEach(apply);
  return render(doc);
}
