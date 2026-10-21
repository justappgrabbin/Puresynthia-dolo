import { useMemo, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  PanResponder,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import JSZip from "jszip";
import { parseZipProject, sourceFromModel, updateNode, type ProjectModel } from "@/lib/project-model";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

const accent = "#FF6B5E";
const ink = "#17202A";
const muted = "#667085";
const canvas = "#EEF1F5";

type BlockKind = "section" | "text" | "image" | "button" | "card" | "divider" | "spacer" | "tool" | "automaton" | "state" | "world" | "input" | "output";
type Port = { id: string; direction: "input" | "output"; dataType: string };
type MeshLink = { id: string; fromNodeId: string; fromPort: string; toNodeId: string; toPort: string; dataType: string };
type Block = {
  id: string;
  kind: BlockKind;
  label: string;
  content?: string;
  color?: string;
  height: number;
  width?: number;
  parentId?: string | null;
  address?: string;
  ports?: Port[];
  sourceTag?: string;
  modelNodeId?: string;
};

type Project = {
  id: string;
  name: string;
  sourceName: string;
  fileCount: number;
  updated: string;
  blocks: Block[];
  sourceHtml?: string;
  model?: ProjectModel;
  connections: MeshLink[];
  morphStates: Record<string, "dormant" | "mounted" | "active" | "healthy" | "failing">;
};

type GalleryEntry = {
  id: string;
  name: string;
  category: string;
  description: string;
  source: string;
  block: Block;
};

const initialBlocks: Block[] = [
  { id: "hero", kind: "section", label: "Hero section", content: "Build something people love", color: "#17202A", height: 142 },
  { id: "intro", kind: "text", label: "Intro text", content: "A flexible canvas for your next idea.", color: "#667085", height: 72 },
  { id: "cta", kind: "button", label: "Primary button", content: "Get started", color: accent, height: 58 },
  { id: "feature", kind: "card", label: "Feature card", content: "Simple blocks. Fast edits.", color: "#FFFFFF", height: 108 },
];

const starterGallery: GalleryEntry[] = [
  { id: "gallery-menu", name: "Editorial menu", category: "Menus", description: "Compact navigation with a clear CTA", source: "Built-in", block: { ...initialBlocks[0], id: "gallery-menu", label: "Editorial menu", kind: "section", content: "Explore the good stuff", color: "#17202A", height: 130 } },
  { id: "gallery-ato", name: "ATO automation engine", category: "ATO / Automation", description: "A reusable automation callout block", source: "Built-in", block: { ...initialBlocks[3], id: "gallery-ato", label: "ATO automation engine", kind: "card", content: "Automate the next step", color: "#FFFFFF", height: 104 } },
  { id: "gallery-hero", name: "Warm hero section", category: "Sections", description: "High-contrast headline section", source: "Built-in", block: { ...initialBlocks[0], id: "gallery-hero", label: "Warm hero section", content: "Make your next move", color: "#FF6B5E", height: 142 } },
  { id: "gallery-card", name: "Feature card", category: "Cards", description: "Icon-led card for product benefits", source: "Built-in", block: { ...initialBlocks[3], id: "gallery-card", label: "Feature card", content: "Built to be reused", color: "#FFFFFF", height: 108 } },
  { id: "gallery-form", name: "Signup prompt", category: "Forms", description: "Short prompt for email capture", source: "Built-in", block: { ...initialBlocks[1], id: "gallery-form", label: "Signup prompt", content: "Join the list for updates", color: "#667085", height: 78 } },
];

const defaultGraphNodes: Block[] = [
  { id: "input-event", kind: "input", label: "User input", content: "on: gesture.tap", color: "#3B82F6", height: 94 },
  { id: "tool-router", kind: "tool", label: "Tool router", content: "route intent to tool", color: "#17202A", height: 112 },
  { id: "automata", kind: "automaton", label: "ATO engine", content: "run: automation", color: accent, height: 112 },
  { id: "state", kind: "state", label: "Session state", content: "status: ready", color: "#7C3AED", height: 98 },
  { id: "world", kind: "world", label: "World object", content: "workspace.canvas", color: "#0F766E", height: 104 },
  { id: "output-result", kind: "output", label: "Output", content: "emit: updated view", color: "#D97706", height: 94 },
];

const blockCatalog: { kind: BlockKind; title: string; icon: "view-quilt" | "text-fields" | "image" | "smart-button" | "web" | "remove" | "space-bar" | "build" | "autorenew" | "account-tree" | "public" | "input" | "output" }[] = [
  { kind: "tool", title: "Tool", icon: "build" },
  { kind: "automaton", title: "Automaton", icon: "autorenew" },
  { kind: "state", title: "State", icon: "account-tree" },
  { kind: "world", title: "World object", icon: "public" },
  { kind: "input", title: "Input", icon: "input" },
  { kind: "output", title: "Output", icon: "output" },
  { kind: "section", title: "Section", icon: "view-quilt" },
  { kind: "text", title: "Text", icon: "text-fields" },
  { kind: "image", title: "Image", icon: "image" },
  { kind: "button", title: "Button", icon: "smart-button" },
  { kind: "card", title: "Card", icon: "web" },
  { kind: "divider", title: "Divider", icon: "remove" },
  { kind: "spacer", title: "Spacer", icon: "space-bar" },
];

function makeBlock(kind: BlockKind, index: number): Block {
  const meta = blockCatalog.find((item) => item.kind === kind)!;
  const defaults: Record<BlockKind, { content: string; color: string; height: number }> = {
    section: { content: "New section", color: "#17202A", height: 120 },
    text: { content: "Add your message here", color: "#667085", height: 72 },
    image: { content: "Image placeholder", color: "#D9DEE7", height: 124 },
    button: { content: "Button label", color: accent, height: 58 },
    card: { content: "Card content", color: "#FFFFFF", height: 104 },
    divider: { content: "", color: "#D9DEE7", height: 28 },
    spacer: { content: "", color: "transparent", height: 64 },
    tool: { content: "configure tool", color: "#17202A", height: 104 },
    automaton: { content: "run automation", color: accent, height: 104 },
    state: { content: "state: ready", color: "#7C3AED", height: 94 },
    world: { content: "world.object", color: "#0F766E", height: 100 },
    input: { content: "on: input", color: "#3B82F6", height: 90 },
    output: { content: "emit: result", color: "#D97706", height: 90 },
  };
  const address = `synthia.editor.${kind}.${Date.now()}-${index}`;
  const ports: Port[] = kind === "input" ? [{ id: "out", direction: "output", dataType: "event" }] : kind === "output" ? [{ id: "in", direction: "input", dataType: "event" }] : [{ id: "in", direction: "input", dataType: "json" }, { id: "out", direction: "output", dataType: "json" }];
  return { id: `${kind}-${Date.now()}-${index}`, kind, label: meta.title, address, ports, parentId: null, ...defaults[kind] };
}

function fileCountFromNames(names: string[]) {
  return names.filter((name) => !name.endsWith("/")).length || 1;
}

function cleanMarkup(value: string) {
  return value.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim();
}

function blocksFromHtml(html: string): Block[] {
  const parsed: Block[] = [];
  const pattern = /<(nav|header|section|article|h1|h2|h3|p|button|a|img|form|footer)\b[^>]*>([\s\S]*?)<\/\1\s*>/gi;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = pattern.exec(html)) && parsed.length < 12) {
    const tag = match[1].toLowerCase();
    const content = cleanMarkup(match[2]);
    if (!content && tag !== "img") continue;
    const kind: BlockKind = ["nav", "header", "section", "article", "footer"].includes(tag) ? "section" : tag === "button" || tag === "a" ? "button" : tag === "img" ? "image" : tag === "form" ? "card" : "text";
    parsed.push({ id: `imported-block-${index}`, kind, label: `${tag.toUpperCase()} element`, content: content.slice(0, 120) || "Image element", color: kind === "section" ? ink : kind === "button" ? accent : kind === "image" ? "#D9DEE7" : "#FFFFFF", height: kind === "section" ? 132 : kind === "image" ? 124 : kind === "button" ? 58 : kind === "card" ? 104 : 72, sourceTag: tag });
    index += 1;
  }
  return parsed;
}

export default function HomeScreen() {
  const colors = useColors();
  const [mode, setMode] = useState<"projects" | "editor" | "gallery">("projects");
  const [projects, setProjects] = useState<Project[]>([]);
  const [gallery, setGallery] = useState<GalleryEntry[]>(starterGallery);
  const [galleryFilter, setGalleryFilter] = useState("All");
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>("hero");
  const [showAdd, setShowAdd] = useState(false);
  const [inspector, setInspector] = useState<"content" | "style">("content");
  const [isPreview, setIsPreview] = useState(false);
  const [view, setView] = useState<"canvas" | "code" | "preview">("canvas");
  const [codeDraft, setCodeDraft] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [history, setHistory] = useState<Block[][]>([]);
  const [future, setFuture] = useState<Block[][]>([]);
  const [morphStates, setMorphStates] = useState<Record<string, "dormant" | "mounted" | "active" | "healthy" | "failing">>({ zip: "mounted", canvas: "active", inspector: "mounted", preview: "mounted", source: "mounted", gallery: "mounted", runtime: "healthy" });
  const resizeStart = useRef<{ id: string; height: number } | null>(null);
  const activeProject = projects.find((project) => project.id === activeProjectId) ?? null;
  const selectedBlock = activeProject?.blocks.find((block) => block.id === selectedId) ?? null;
  const canvasWidth = Math.min(Dimensions.get("window").width - 40, 390);
  const galleryCategories = useMemo(() => ["All", ...Array.from(new Set(gallery.map((entry) => entry.category)))], [gallery]);
  const filteredGallery = useMemo(() => galleryFilter === "All" ? gallery : gallery.filter((entry) => entry.category === galleryFilter), [gallery, galleryFilter]);

  const generatedSource = useMemo(() => {
    if (!activeProject) return "";
    return activeProject.blocks.map((block, index) => `// node ${index + 1}: ${block.label}\n<${block.kind} content=\"${(block.content ?? "").replace(/\"/g, "'")}\" color=\"${block.color ?? ""}\" height={${block.height}} />`).join("\n\n");
  }, [activeProject]);

  const updateBlocks = (next: Block[]) => {
    if (!activeProject) return;
    setHistory((current) => [...current.slice(-19), activeProject.blocks]);
    setFuture([]);
    setProjects((current) => current.map((project) => project.id === activeProject.id ? { ...project, blocks: next, updated: "Just now" } : project));
  };

  const updateSelected = (patch: Partial<Block>) => {
    if (!activeProject || !selectedBlock) return;
    updateBlocks(activeProject.blocks.map((block) => block.id === selectedBlock.id ? { ...block, ...patch } : block));
    if (activeProject.model && selectedBlock.modelNodeId) {
      const modelPatch = { ...(patch.content !== undefined ? { text: patch.content } : {}), ...(patch.color !== undefined ? { style: { ...activeProject.model.nodes[selectedBlock.modelNodeId]?.style, background: patch.color } } : {}) };
      const nextModel = updateNode(activeProject.model, selectedBlock.modelNodeId, modelPatch);
      setProjects((current) => current.map((project) => project.id === activeProject.id ? { ...project, model: nextModel } : project));
    }
  };

  const duplicateSelected = () => {
    if (!activeProject || !selectedBlock) return;
    const copy = { ...selectedBlock, id: `${selectedBlock.kind}-${Date.now()}`, label: `${selectedBlock.label} copy` };
    const index = activeProject.blocks.findIndex((block) => block.id === selectedBlock.id);
    const next = [...activeProject.blocks];
    next.splice(index + 1, 0, copy);
    updateBlocks(next);
    setSelectedId(copy.id);
  };

  const deleteSelected = () => {
    if (!activeProject || !selectedBlock) return;
    Alert.alert("Delete element?", `Remove ${selectedBlock.label} from the canvas?`, [{ text: "Cancel", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => { updateBlocks(activeProject.blocks.filter((block) => block.id !== selectedBlock.id)); setSelectedId(""); } }]);
  };

  const undo = () => {
    if (!activeProject || history.length === 0) return;
    const previous = history[history.length - 1];
    setFuture((current) => [...current, activeProject.blocks]);
    setHistory((current) => current.slice(0, -1));
    setProjects((current) => current.map((project) => project.id === activeProject.id ? { ...project, blocks: previous } : project));
  };

  const redo = () => {
    if (!activeProject || future.length === 0) return;
    const next = future[future.length - 1];
    setHistory((current) => [...current, activeProject.blocks]);
    setFuture((current) => current.slice(0, -1));
    setProjects((current) => current.map((project) => project.id === activeProject.id ? { ...project, blocks: next } : project));
  };

  const importZip = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "application/zip", copyToCacheDirectory: true });
      if (result.canceled) return;
      const asset = result.assets[0];
      let names: string[] = [];
      let sourceHtml = "";
      let projectModel: ProjectModel | undefined;
      try {
        const bytes = await fetch(asset.uri).then((response) => response.arrayBuffer());
        const zip = await JSZip.loadAsync(bytes);
        names = Object.keys(zip.files);
        projectModel = await parseZipProject(bytes, asset.name.replace(/\.zip$/i, "") || "Imported project");
        const htmlName = names.find((name) => /(^|\/)index\.html?$/i.test(name)) ?? names.find((name) => /\.html?$/i.test(name));
        if (htmlName) sourceHtml = await zip.file(htmlName)!.async("string");
      } catch {
        names = ["index.html", "styles.css", "assets/"];
      }
      const importedBlocks = sourceHtml ? blocksFromHtml(sourceHtml) : [];
      const modelNodeIds = projectModel ? Object.keys(projectModel.nodes) : [];
      importedBlocks.forEach((block, index) => { block.modelNodeId = modelNodeIds[index]; });
      const project: Project = {
        id: `${Date.now()}`,
        name: asset.name.replace(/\.zip$/i, "") || "Imported project",
        sourceName: asset.name,
        fileCount: fileCountFromNames(names),
        updated: "Just now",
        blocks: importedBlocks.length > 0 ? importedBlocks.map((block, index) => ({ ...block, address: `synthia.editor.${block.kind}.${Date.now()}-${index}`, ports: block.kind === "input" ? [{ id: "out", direction: "output", dataType: "event" }] : block.kind === "output" ? [{ id: "in", direction: "input", dataType: "event" }] : [{ id: "in", direction: "input", dataType: "json" }, { id: "out", direction: "output", dataType: "json" }], parentId: null })) : defaultGraphNodes.map((node, index) => ({ ...node, address: `synthia.editor.${node.kind}.${Date.now()}-${index}`, ports: [{ id: "in", direction: "input", dataType: "json" }, { id: "out", direction: "output", dataType: "json" }], parentId: null })),
        sourceHtml,
        model: projectModel,
        connections: projectModel?.connections ?? [],
        morphStates: { ...morphStates, zip: "healthy", canvas: "active" },
      };
      setProjects((current) => [project, ...current]);
      const importedCategory = names.some((name) => /menu|nav/i.test(name)) ? "Menus" : names.some((name) => /automation|ato|workflow|function/i.test(name)) ? "ATO / Automation" : "Imported";
      const extracted = project.blocks.slice(0, 6).map((block, index) => ({ id: `imported-${project.id}-${index}`, name: `${project.name} ${block.label}`, category: importedCategory, description: `Extracted ${block.sourceTag ?? block.kind} from ${asset.name}`, source: asset.name, block: { ...block, id: `imported-${project.id}-${index}` } }));
      setGallery((current) => [...extracted, ...current]);
      setActiveProjectId(project.id);
      setSelectedId(project.blocks[0]?.id ?? "hero");
      setView("canvas");
      setMode("editor");
    } catch (error) {
      Alert.alert("Couldn’t import ZIP", "Choose a valid ZIP file and try again.");
    }
  };

  const exportZip = async () => {
    if (!activeProject) return;
    const zip = new JSZip();
    let blocks = activeProject.blocks.map((block) => `<section data-block="${block.kind}" style="min-height:${block.height}px;color:${block.color}">${block.content ?? ""}</section>`).join("\n");
    if (activeProject.model) {
      const mutatedSource = sourceFromModel(activeProject.model);
      if (mutatedSource) blocks = mutatedSource;
      Object.entries(activeProject.model.files).forEach(([fileName, value]) => { if (fileName !== activeProject.model!.entryFile) zip.file(fileName, value); });
      zip.file(activeProject.model.entryFile, blocks);
      zip.file("visual-editor.json", JSON.stringify({ name: activeProject.name, framework: activeProject.model.framework, nodes: activeProject.model.nodes, connections: activeProject.connections.length ? activeProject.connections : activeProject.model.connections }, null, 2));
    } else {
      zip.file("index.html", `<!doctype html><html><body>${blocks}</body></html>`);
      zip.file("visual-editor.json", JSON.stringify({ name: activeProject.name, blocks }, null, 2));
    }
    const base64 = await zip.generateAsync({ type: "base64" });
    const uri = `${FileSystem.cacheDirectory ?? FileSystem.documentDirectory}edited-${activeProject.name.replace(/[^a-z0-9-_]/gi, "-")}.zip`;
    await FileSystem.writeAsStringAsync(uri, base64, { encoding: FileSystem.EncodingType.Base64 });
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: "application/zip", dialogTitle: "Export edited project" });
    else await Share.share({ message: `Edited project ready: ${uri}` });
  };

  const saveSelectedToGallery = () => {
    if (!activeProject || !selectedBlock) return;
    const entry: GalleryEntry = { id: `saved-${Date.now()}`, name: `${selectedBlock.label} template`, category: "Custom", description: "Saved from the current canvas", source: activeProject.name, block: { ...selectedBlock, id: `saved-${Date.now()}` } };
    setGallery((current) => [entry, ...current]);
    Alert.alert("Saved to gallery", `${entry.name} is ready for future projects.`);
  };

  const insertGalleryEntry = (entry: GalleryEntry) => {
    if (!activeProject) {
      Alert.alert("Open a project first", "Import a ZIP or open a recent project before inserting a gallery block.");
      return;
    }
    const block = { ...entry.block, id: `${entry.block.kind}-${Date.now()}` };
    updateBlocks([...activeProject.blocks, block]);
    setSelectedId(block.id);
    setMode("editor");
  };

  const openProject = (project: Project) => {
    setActiveProjectId(project.id);
    setSelectedId(project.blocks[0]?.id ?? "hero");
    setView("canvas");
    setMode("editor");
  };

  const reorderWithOffset = (id: string, dy: number) => {
    if (!activeProject || Math.abs(dy) < 28) return;
    const from = activeProject.blocks.findIndex((block) => block.id === id);
    const to = Math.max(0, Math.min(activeProject.blocks.length - 1, from + (dy > 0 ? 1 : -1)));
    if (from === to) return;
    const next = [...activeProject.blocks];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    updateBlocks(next);
    setMorphStates((current) => ({ ...current, canvas: "healthy" }));
  };

  const resizeBlock = (id: string, height: number, commit = false) => {
    if (!activeProject) return;
    if (commit) setHistory((current) => [...current.slice(-19), activeProject.blocks]);
    setProjects((current) => current.map((project) => {
      if (project.id !== activeProject.id) return project;
      const nextHeight = Math.max(44, Math.min(420, height));
      const selected = project.blocks.find((block) => block.id === id);
      const modelNodeId = selected?.modelNodeId;
      const nextModel = project.model && modelNodeId && project.model.nodes[modelNodeId] ? { ...project.model, nodes: { ...project.model.nodes, [modelNodeId]: { ...project.model.nodes[modelNodeId], style: { ...project.model.nodes[modelNodeId].style, "min-height": `${nextHeight}px` } } } } : project.model;
      return { ...project, updated: "Just now", blocks: project.blocks.map((block) => block.id === id ? { ...block, height: nextHeight } : block), model: nextModel };
    }));
    setMorphStates((current) => ({ ...current, canvas: "active", source: "active" }));
  };

  const nestSelected = () => {
    if (!activeProject || !selectedBlock) return;
    const index = activeProject.blocks.findIndex((block) => block.id === selectedBlock.id);
    const parent = activeProject.blocks[index - 1];
    if (!parent) return;
    updateBlocks(activeProject.blocks.map((block) => block.id === selectedBlock.id ? { ...block, parentId: block.parentId === parent.id ? null : parent.id } : block));
    setMorphStates((current) => ({ ...current, canvas: "healthy" }));
  };

  const connectSelectedToNext = () => {
    if (!activeProject || !selectedBlock) return;
    const fromIndex = activeProject.blocks.findIndex((block) => block.id === selectedBlock.id);
    const target = activeProject.blocks[fromIndex + 1];
    if (!target) return;
    const fromPort = selectedBlock.ports?.find((port) => port.direction === "output");
    const toPort = target.ports?.find((port) => port.direction === "input");
    if (!fromPort || !toPort || (fromPort.dataType !== toPort.dataType && fromPort.dataType !== "json" && toPort.dataType !== "json")) {
      Alert.alert("Incompatible ports", "These nodes do not expose compatible input/output types.");
      return;
    }
    const link: MeshLink = { id: `mesh-${Date.now()}`, fromNodeId: selectedBlock.id, fromPort: fromPort.id, toNodeId: target.id, toPort: toPort.id, dataType: fromPort.dataType };
    if (activeProject.connections.some((connection) => connection.fromNodeId === link.fromNodeId && connection.toNodeId === link.toNodeId)) return;
    setProjects((current) => current.map((project) => {
      if (project.id !== activeProject.id) return project;
      const nextConnections = [...project.connections, link];
      return { ...project, connections: nextConnections, updated: "Just now", model: project.model ? { ...project.model, connections: nextConnections } : project.model };
    }));
    setMorphStates((current) => ({ ...current, canvas: "healthy", runtime: "active" }));
  };

  const syncCodeToCanvas = () => {
    if (!activeProject || !codeDraft.trim()) return;
    const parsed = blocksFromHtml(codeDraft);
    if (!parsed.length) {
      Alert.alert("No visual nodes found", "Add recognizable HTML elements before syncing back to the canvas.");
      return;
    }
    const nextBlocks = parsed.map((block, index) => ({ ...block, id: activeProject.blocks[index]?.id ?? `${block.kind}-${Date.now()}-${index}`, address: activeProject.blocks[index]?.address ?? `synthia.editor.${block.kind}.${Date.now()}-${index}`, ports: activeProject.blocks[index]?.ports ?? [{ id: "in", direction: "input", dataType: "json" }, { id: "out", direction: "output", dataType: "json" }], parentId: activeProject.blocks[index]?.parentId ?? null }));
    setHistory((current) => [...current.slice(-19), activeProject.blocks]);
    setFuture([]);
    setProjects((current) => current.map((project) => project.id === activeProject.id ? { ...project, blocks: nextBlocks, sourceHtml: codeDraft, model: project.model ? { ...project.model, files: { ...project.model.files, [project.model.entryFile]: codeDraft } } : project.model, updated: "Just now" } : project));
    setMorphStates((current) => ({ ...current, source: "healthy", canvas: "healthy", preview: "active" }));
    setView("canvas");
  };

  const setEditorView = (next: "canvas" | "code" | "preview") => {
    setView(next);
    setIsPreview(next === "preview");
    setMorphStates((current) => ({ ...current, [next === "code" ? "source" : next === "preview" ? "preview" : "canvas"]: "active" }));
  };

  if (mode === "projects") {
    return (
      <ScreenContainer className="px-5 pt-5" containerClassName="bg-background">
        <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.eyebrow, { color: accent }]}>ZIP VISUAL EDITOR</Text>
              <Text style={[styles.title, { color: colors.foreground }]}>Your projects</Text>
            </View>
            <View style={styles.avatar}><Text style={styles.avatarText}>Y</Text></View>
          </View>
          <View style={styles.heroCard}>
            <View style={styles.heroGlow} />
            <Text style={styles.heroLabel}>NO-CODE CANVAS</Text>
            <Text style={styles.heroTitle}>Design the interface, not the code.</Text>
            <Text style={styles.heroCopy}>Drop in a ZIP, then move, style, and reshape every block with your fingertips.</Text>
            <Pressable onPress={importZip} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
              <IconSymbol name="arrow-upward" size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Import ZIP</Text>
            </Pressable>
          </View>
          <View style={styles.quickActions}><Pressable onPress={() => setMode("gallery")} style={({ pressed }) => [styles.galleryShortcut, pressed && styles.pressed]}><IconSymbol name="auto-awesome" size={18} color={accent} /><View style={{ flex: 1 }}><Text style={styles.galleryShortcutTitle}>Component gallery</Text><Text style={styles.galleryShortcutCopy}>{gallery.length} reusable blocks ready to place</Text></View><IconSymbol name="chevron-right" size={18} color={accent} /></Pressable></View>
          <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent projects</Text><Text style={styles.count}>{projects.length || "0"}</Text></View>
          {projects.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}><IconSymbol name="folder-open" size={24} color={accent} /></View>
              <Text style={styles.emptyTitle}>Your canvas is waiting</Text>
              <Text style={styles.emptyCopy}>Import a ZIP to start arranging sections, text, images, and buttons visually.</Text>
            </View>
          ) : (
            <FlatList data={projects} scrollEnabled={false} keyExtractor={(item) => item.id} renderItem={({ item }) => (
              <Pressable onPress={() => openProject(item)} style={({ pressed }) => [styles.projectCard, pressed && styles.pressed]}>
                <View style={styles.projectThumb}><View style={styles.thumbBar} /><View style={styles.thumbLineWide} /><View style={styles.thumbLine} /><View style={styles.thumbButton} /></View>
                <View style={styles.projectInfo}><Text style={styles.projectName}>{item.name}</Text><Text style={styles.projectMeta}>{item.fileCount} files · {item.updated}</Text><Text style={styles.projectHint}>Tap to open canvas</Text></View>
                <IconSymbol name="chevron-right" size={20} color="#98A2B3" />
              </Pressable>
            )} />
          )}
        </ScrollView>
      </ScreenContainer>
    );
  }

  if (mode === "gallery") {
    return (
      <ScreenContainer className="px-5 pt-5" containerClassName="bg-background">
        <View style={styles.galleryTopbar}><Pressable onPress={() => setMode(activeProject ? "editor" : "projects")} style={styles.iconButton}><IconSymbol name="arrow-back" size={21} color={ink} /></Pressable><View style={{ flex: 1 }}><Text style={styles.eyebrow}>REUSABLE LIBRARY</Text><Text style={[styles.title, { color: colors.foreground, fontSize: 30 }]}>Component gallery</Text></View><View style={styles.galleryCount}><Text style={styles.galleryCountText}>{gallery.length}</Text></View></View>
        <Text style={styles.galleryIntro}>Keep the pieces that work. Add menus, cards, forms, and automation modules to any future canvas.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>{galleryCategories.map((category) => <Pressable key={category} onPress={() => setGalleryFilter(category)} style={[styles.categoryChip, galleryFilter === category && styles.categoryChipActive]}><Text style={[styles.categoryChipText, galleryFilter === category && styles.categoryChipTextActive]}>{category}</Text></Pressable>)}</ScrollView>
        <FlatList data={filteredGallery} keyExtractor={(item) => item.id} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 8, paddingBottom: 28 }} renderItem={({ item }) => <Pressable onPress={() => insertGalleryEntry(item)} style={({ pressed }) => [styles.galleryCard, pressed && styles.pressed]}><View style={[styles.galleryPreview, { backgroundColor: item.block.kind === "section" ? item.block.color : "#F1F3F6" }]}>{item.block.kind === "section" ? <><Text style={styles.galleryPreviewEyebrow}>SECTION</Text><Text style={styles.galleryPreviewTitle}>{item.block.content}</Text></> : item.block.kind === "button" ? <View style={[styles.galleryPreviewButton, { backgroundColor: item.block.color }]}><Text style={styles.galleryPreviewButtonText}>{item.block.content}</Text></View> : <><View style={styles.galleryPreviewIcon}><IconSymbol name={item.block.kind === "image" ? "image" : "auto-awesome"} size={18} color={accent} /></View><View style={styles.galleryPreviewLine} /><View style={styles.galleryPreviewLineShort} /></>}</View><View style={styles.galleryCardBody}><View style={styles.galleryCardTitleRow}><Text style={styles.galleryCardTitle}>{item.name}</Text><IconSymbol name="add-circle-outline" size={21} color={accent} /></View><Text style={styles.galleryCardDescription}>{item.description}</Text><Text style={styles.galleryCardMeta}>{item.category} · {item.source}</Text></View></Pressable>} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "left", "right", "bottom"]} containerClassName="bg-background">
      <View style={styles.editorRoot}>
        <View style={styles.editorTopbar}>
          <Pressable onPress={() => setMode("projects")} style={styles.iconButton}><IconSymbol name="arrow-back" size={21} color={ink} /></Pressable>
          <View style={{ flex: 1 }}><Text style={styles.editorKicker}>EDITING</Text><Text numberOfLines={1} style={styles.editorName}>{activeProject?.name ?? "Untitled project"}</Text></View>
          <Pressable onPress={undo} style={[styles.iconButton, history.length === 0 && styles.disabled]}><IconSymbol name="undo" size={20} color={ink} /></Pressable>
          <Pressable onPress={redo} style={[styles.iconButton, future.length === 0 && styles.disabled]}><IconSymbol name="redo" size={20} color={ink} /></Pressable>
          <Pressable onPress={() => { setEditorView("code"); setCodeDraft(activeProject?.sourceHtml || generatedSource); }} style={[styles.modeButton, view === "code" && styles.modeButtonActive]}><IconSymbol name="chevron.left.forwardslash.chevron.right" size={18} color={view === "code" ? accent : ink} /></Pressable>
          <Pressable onPress={() => setEditorView(view === "preview" ? "canvas" : "preview")} style={[styles.previewButton, view === "preview" && styles.modeButtonActive]}><IconSymbol name={view === "preview" ? "edit" : "visibility"} size={18} color={accent} /></Pressable>
        </View>
        {view === "code" ? <View style={styles.codePanel}><View style={styles.codeHeader}><View><Text style={styles.codeEyebrow}>OPEN THE HOOD</Text><Text style={styles.codeTitle}>Precise control</Text></View><View style={styles.syncBadge}><View style={styles.syncDot} /><Text style={styles.syncText}>Canvas synced</Text></View></View><Text style={styles.codeDescription}>Edit the real entry source, then apply it back to the visual model and runtime preview.</Text><TextInput multiline value={codeDraft || generatedSource} onChangeText={setCodeDraft} autoCapitalize="none" autoCorrect={false} style={styles.codeInput} placeholderTextColor="#667085" /><Pressable onPress={syncCodeToCanvas} style={styles.applyCodeButton}><IconSymbol name="check" size={17} color="#FFFFFF" /><Text style={styles.applyCodeText}>Apply to canvas</Text></Pressable></View> : <ScrollView contentContainerStyle={{ paddingBottom: 180 }} showsVerticalScrollIndicator={false}>
          <View style={styles.canvasHeader}><View><Text style={styles.canvasTitle}>{view === "preview" ? "Runtime preview" : "Canvas"}</Text><Text style={styles.canvasHint}>{view === "preview" ? "Live render" : "Drag, nest, reorder"}</Text></View><View style={styles.runtimePill}><View style={[styles.runtimeDot, { backgroundColor: morphStates[view === "preview" ? "preview" : "canvas"] === "failing" ? "#D92D20" : "#12B76A" }]} /><Text style={styles.runtimePillText}>{morphStates[view === "preview" ? "preview" : "canvas"]}</Text></View></View>
          <View style={[styles.canvas, { width: canvasWidth }]}>
            {!isPreview && <View style={styles.canvasRuler}><Text style={styles.rulerText}>MOBILE / 390 PX</Text><View style={styles.rulerLine} /></View>}
            {activeProject?.blocks.map((block, index) => {
              const pan = PanResponder.create({ onStartShouldSetPanResponder: () => !isPreview, onPanResponderGrant: () => { setDraggingId(block.id); setSelectedId(block.id); setMorphStates((current) => ({ ...current, canvas: "active" })); }, onPanResponderRelease: (_, gesture) => { reorderWithOffset(block.id, gesture.dy); setDraggingId(null); } });
              const resizePan = PanResponder.create({ onStartShouldSetPanResponder: () => !isPreview, onPanResponderGrant: () => { resizeStart.current = { id: block.id, height: block.height }; setSelectedId(block.id); }, onPanResponderMove: (_, gesture) => resizeBlock(block.id, (resizeStart.current?.height ?? block.height) + gesture.dy), onPanResponderRelease: () => { resizeBlock(block.id, block.height, true); resizeStart.current = null; } });
              const selected = selectedId === block.id && !isPreview;
              const depth = activeProject.blocks.filter((candidate) => candidate.id === block.parentId).length ? 1 : 0;
              return (
                <View key={block.id} {...pan.panHandlers} style={[styles.blockWrap, { minHeight: block.height, marginLeft: depth * 18 }, selected && styles.blockSelected, draggingId === block.id && styles.blockDragging]}>
                  {selected && <><View style={styles.blockBadge}><Text style={styles.blockBadgeText}>{block.label.toUpperCase()}</Text><IconSymbol name="drag-handle" size={14} color="#FFFFFF" /></View><View {...resizePan.panHandlers} style={styles.resizeHandle}><IconSymbol name="open-with" size={14} color="#FFFFFF" /></View></>}
                  {["tool", "automaton", "state", "world", "input", "output"].includes(block.kind) && <View style={[styles.systemNode, { borderLeftColor: block.color }]}><View style={styles.systemNodeTop}><View style={[styles.systemNodeIcon, { backgroundColor: `${block.color}22` }]}><IconSymbol name={block.kind === "tool" ? "build" : block.kind === "automaton" ? "autorenew" : block.kind === "state" ? "account-tree" : block.kind === "world" ? "public" : block.kind === "input" ? "input" : "output"} size={18} color={block.color ?? ink} /></View><View style={{ flex: 1 }}><Text style={styles.systemNodeType}>{block.kind.toUpperCase()} NODE</Text><Text style={styles.systemNodeTitle}>{block.label}</Text></View><View style={styles.portGroup}><View style={[styles.port, { backgroundColor: block.color }]} /><View style={[styles.port, { backgroundColor: "#FFFFFF", borderColor: block.color }]} /></View></View><Text style={styles.systemNodeBody}>{block.content}</Text><View style={styles.systemNodeFooter}><Text style={styles.portLabel}>{block.kind === "input" ? "SOURCE" : "INPUT"}</Text><Text style={styles.portLabel}>{block.kind === "output" ? "SINK" : "OUTPUT"}</Text></View></View>}
                  {block.kind === "section" && <View style={[styles.sectionBlock, { backgroundColor: block.color }]}><Text style={styles.sectionBlockLabel}>YOUR NEXT</Text><Text style={styles.sectionBlockTitle}>{block.content}</Text><View style={styles.sectionBlockDot} /></View>}
                  {block.kind === "text" && <View style={styles.textBlock}><Text style={styles.textBlockTitle}>{block.content}</Text><View style={styles.textBlockLine} /></View>}
                  {block.kind === "button" && <View style={[styles.buttonBlock, { backgroundColor: block.color }]}><Text style={styles.buttonBlockText}>{block.content}</Text><IconSymbol name="arrow-forward" size={16} color="#FFFFFF" /></View>}
                  {block.kind === "card" && <View style={styles.cardBlock}><View style={styles.cardIcon}><IconSymbol name="auto-awesome" size={18} color={accent} /></View><View style={{ flex: 1 }}><Text style={styles.cardBlockTitle}>{block.content}</Text><Text style={styles.cardBlockCopy}>A reusable visual block</Text></View><IconSymbol name="chevron-right" size={18} color="#98A2B3" /></View>}
                  {block.kind === "image" && <View style={styles.imageBlock}><IconSymbol name="image" size={28} color="#98A2B3" /><Text style={styles.imageText}>{block.content}</Text></View>}
                  {block.kind === "divider" && <View style={styles.dividerBlock} />}
                  {block.kind === "spacer" && <View style={styles.spacerBlock}><Text style={styles.spacerText}>SPACER</Text></View>}
                </View>
              );
            })}
            {!isPreview && <><View style={styles.meshSummary}><IconSymbol name="share" size={14} color={accent} /><Text style={styles.meshSummaryText}>{activeProject?.connections.length ?? 0} mesh links · drag to reorder · use inspector to nest/connect</Text></View><View style={styles.dropHint}><IconSymbol name="add-circle-outline" size={17} color={accent} /><Text style={styles.dropHintText}>Drop a block here</Text></View></>}
          </View>
        </ScrollView>}
        {view === "canvas" && <>
          <View style={styles.bottomDock}>
            <Pressable onPress={() => setShowAdd(true)} style={({ pressed }) => [styles.addBlockButton, pressed && styles.pressed]}><IconSymbol name="add" size={20} color="#FFFFFF" /><Text style={styles.addBlockText}>Add block</Text></Pressable>
            <Pressable onPress={() => setInspector("content")} style={[styles.dockAction, selectedBlock && styles.dockActionActive]}><IconSymbol name="tune" size={20} color={selectedBlock ? accent : muted} /><Text style={styles.dockText}>Inspector</Text></Pressable>
            <Pressable onPress={() => setMode("gallery")} style={styles.dockAction}><IconSymbol name="auto-awesome" size={20} color={muted} /><Text style={styles.dockText}>Gallery</Text></Pressable>
            <Pressable onPress={exportZip} style={styles.exportAction}><IconSymbol name="ios-share" size={20} color={ink} /><Text style={styles.dockText}>Export</Text></Pressable>
          </View>
          {selectedBlock && <View style={styles.inspector}><View style={styles.inspectorHandle} /><View style={styles.inspectorHeader}><View><Text style={styles.inspectorEyebrow}>SELECTED NODE</Text><Text style={styles.inspectorTitle}>{selectedBlock.label}</Text></View><View style={styles.nodeActions}><Pressable onPress={duplicateSelected} style={styles.nodeAction}><IconSymbol name="content-copy" size={17} color={muted} /></Pressable><Pressable onPress={deleteSelected} style={styles.nodeAction}><IconSymbol name="delete-outline" size={17} color="#D92D20" /></Pressable><Pressable onPress={() => setSelectedId("")} style={styles.nodeAction}><IconSymbol name="close" size={20} color={muted} /></Pressable></View></View><View style={styles.segmented}><Pressable onPress={() => setInspector("content")} style={[styles.segment, inspector === "content" && styles.segmentActive]}><Text style={[styles.segmentText, inspector === "content" && styles.segmentTextActive]}>Content</Text></Pressable><Pressable onPress={() => setInspector("style")} style={[styles.segment, inspector === "style" && styles.segmentActive]}><Text style={[styles.segmentText, inspector === "style" && styles.segmentTextActive]}>Style & layout</Text></Pressable></View>{inspector === "content" ? <View style={styles.controlRow}><View style={styles.field}><Text style={styles.fieldLabel}>Block text</Text><TextInput value={selectedBlock.content} onChangeText={(text) => updateSelected({ content: text })} placeholder="Type something" placeholderTextColor="#98A2B3" style={styles.textInput} /></View><Pressable onPress={() => updateSelected({ content: selectedBlock.content ? "" : "Add your message here" })} style={styles.controlIcon}><IconSymbol name="visibility" size={18} color={muted} /></Pressable></View> : <View style={styles.styleControls}><View style={styles.inspectorActionRow}><Text style={styles.fieldLabel}>Quick style</Text><Pressable onPress={saveSelectedToGallery} style={styles.saveGalleryButton}><IconSymbol name="bookmark-border" size={15} color={accent} /><Text style={styles.saveGalleryText}>Save to gallery</Text></Pressable></View><View style={styles.inspectorToolRow}><Pressable onPress={nestSelected} style={styles.inspectorTool}><IconSymbol name="account-tree" size={15} color={ink} /><Text style={styles.inspectorToolText}>{selectedBlock.parentId ? "Unnest" : "Nest"}</Text></Pressable><Pressable onPress={connectSelectedToNext} style={styles.inspectorTool}><IconSymbol name="share" size={15} color={ink} /><Text style={styles.inspectorToolText}>Connect next</Text></Pressable></View><View style={styles.swatches}>{["#17202A", accent, "#3B82F6", "#FFFFFF", "#E5E7EB"].map((color) => <Pressable key={color} onPress={() => updateSelected({ color })} style={[styles.swatch, { backgroundColor: color }, selectedBlock.color === color && styles.swatchSelected]} />)}</View><View style={styles.stepperRow}><Text style={styles.fieldLabel}>Height</Text><View style={styles.stepper}><Pressable onPress={() => updateSelected({ height: Math.max(40, selectedBlock.height - 8) })} style={styles.stepButton}><Text style={styles.stepText}>−</Text></Pressable><Text style={styles.stepValue}>{selectedBlock.height}px</Text><Pressable onPress={() => updateSelected({ height: selectedBlock.height + 8 })} style={styles.stepButton}><Text style={styles.stepText}>+</Text></Pressable></View></View></View>}</View>}
        </>}
        {showAdd && <View style={styles.sheetOverlay}><Pressable style={styles.sheetBackdrop} onPress={() => setShowAdd(false)} /><View style={styles.addSheet}><View style={styles.sheetHandle} /><Text style={styles.sheetTitle}>Add to canvas</Text><Text style={styles.sheetCopy}>Drag-friendly blocks for your interface</Text><View style={styles.catalogGrid}>{blockCatalog.map((item) => <Pressable key={item.kind} onPress={() => { if (activeProject) { const block = makeBlock(item.kind, activeProject.blocks.length); updateBlocks([...activeProject.blocks, block]); setSelectedId(block.id); setShowAdd(false); } }} style={({ pressed }) => [styles.catalogItem, pressed && styles.pressed]}><View style={styles.catalogIcon}><IconSymbol name={item.icon} size={20} color={accent} /></View><Text style={styles.catalogTitle}>{item.title}</Text></Pressable>)}</View></View></View>}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 22 },
  eyebrow: { fontSize: 11, fontWeight: "800", letterSpacing: 1.5, marginBottom: 6 },
  title: { fontSize: 34, fontWeight: "800", letterSpacing: -1.2 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: ink, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
  heroCard: { backgroundColor: ink, borderRadius: 28, padding: 24, overflow: "hidden", marginBottom: 30 },
  heroGlow: { position: "absolute", width: 180, height: 180, borderRadius: 90, right: -55, top: -70, backgroundColor: "#354252", opacity: 0.7 },
  heroLabel: { color: "#FFB6AF", fontSize: 11, letterSpacing: 1.6, fontWeight: "800", marginBottom: 14 },
  heroTitle: { color: "#FFFFFF", fontSize: 28, lineHeight: 32, fontWeight: "800", letterSpacing: -0.8, maxWidth: 300 },
  heroCopy: { color: "#B9C1CC", fontSize: 14, lineHeight: 21, marginTop: 12, maxWidth: 300 },
  primaryButton: { backgroundColor: accent, borderRadius: 15, height: 50, paddingHorizontal: 17, flexDirection: "row", gap: 8, alignItems: "center", alignSelf: "flex-start", marginTop: 22 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  pressed: { opacity: 0.76, transform: [{ scale: 0.98 }] },
  quickActions: { marginBottom: 22 }, galleryShortcut: { backgroundColor: "#FFF8F7", borderWidth: 1, borderColor: "#FFD8D3", borderRadius: 18, padding: 14, flexDirection: "row", alignItems: "center", gap: 11 }, galleryShortcutTitle: { color: ink, fontSize: 14, fontWeight: "800" }, galleryShortcutCopy: { color: muted, fontSize: 11, marginTop: 4 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 13 },
  sectionTitle: { fontSize: 19, fontWeight: "800" },
  count: { fontSize: 13, color: muted, fontWeight: "700", backgroundColor: "#E9EDF2", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  emptyCard: { borderWidth: 1, borderColor: "#E4E7EC", borderStyle: "dashed", borderRadius: 20, padding: 24, alignItems: "center", backgroundColor: "#FBFCFD" },
  emptyIcon: { width: 50, height: 50, borderRadius: 17, backgroundColor: "#FFF0EE", alignItems: "center", justifyContent: "center", marginBottom: 14 },
  emptyTitle: { color: ink, fontSize: 16, fontWeight: "800", marginBottom: 6 },
  emptyCopy: { color: muted, fontSize: 13, textAlign: "center", lineHeight: 19, maxWidth: 270 },
  projectCard: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 13, flexDirection: "row", alignItems: "center", marginBottom: 12, borderWidth: 1, borderColor: "#E9EDF2" },
  projectThumb: { width: 76, height: 76, borderRadius: 14, backgroundColor: canvas, padding: 12, justifyContent: "center", gap: 5 },
  thumbBar: { width: 24, height: 4, borderRadius: 3, backgroundColor: accent }, thumbLineWide: { width: 46, height: 6, borderRadius: 3, backgroundColor: ink }, thumbLine: { width: 34, height: 4, borderRadius: 3, backgroundColor: "#A9B2BF" }, thumbButton: { width: 24, height: 8, borderRadius: 4, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D5DAE1" },
  projectInfo: { flex: 1, marginLeft: 13 }, projectName: { color: ink, fontSize: 15, fontWeight: "800", marginBottom: 4 }, projectMeta: { color: muted, fontSize: 12 }, projectHint: { color: accent, fontSize: 11, fontWeight: "700", marginTop: 7 },
  galleryTopbar: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 12 }, galleryCount: { width: 38, height: 38, borderRadius: 13, backgroundColor: "#FFF0EE", alignItems: "center", justifyContent: "center" }, galleryCountText: { color: accent, fontWeight: "900", fontSize: 14 }, galleryIntro: { color: muted, fontSize: 14, lineHeight: 21, marginBottom: 15 }, categoryScroll: { gap: 8, paddingBottom: 16 }, categoryChip: { paddingHorizontal: 14, height: 34, borderRadius: 17, backgroundColor: "#F2F4F7", alignItems: "center", justifyContent: "center" }, categoryChipActive: { backgroundColor: ink }, categoryChipText: { color: muted, fontSize: 12, fontWeight: "800" }, categoryChipTextActive: { color: "#FFFFFF" }, galleryCard: { backgroundColor: "#FFFFFF", borderRadius: 20, borderWidth: 1, borderColor: "#E9EDF2", overflow: "hidden", marginBottom: 14 }, galleryPreview: { height: 112, padding: 17, justifyContent: "center" }, galleryPreviewEyebrow: { color: "#FFB6AF", fontSize: 8, fontWeight: "900", letterSpacing: 1.2, marginBottom: 7 }, galleryPreviewTitle: { color: "#FFFFFF", fontSize: 19, fontWeight: "800", maxWidth: 230 }, galleryPreviewButton: { height: 36, borderRadius: 10, paddingHorizontal: 14, alignSelf: "flex-start", alignItems: "center", justifyContent: "center" }, galleryPreviewButtonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 12 }, galleryPreviewIcon: { width: 32, height: 32, borderRadius: 11, backgroundColor: "#FFF0EE", alignItems: "center", justifyContent: "center", marginBottom: 9 }, galleryPreviewLine: { width: "70%", height: 8, borderRadius: 4, backgroundColor: "#CDD4DE", marginBottom: 6 }, galleryPreviewLineShort: { width: "42%", height: 6, borderRadius: 4, backgroundColor: "#E1E5EA" }, galleryCardBody: { padding: 14 }, galleryCardTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }, galleryCardTitle: { flex: 1, color: ink, fontSize: 15, fontWeight: "800" }, galleryCardDescription: { color: muted, fontSize: 12, lineHeight: 18, marginTop: 6 }, galleryCardMeta: { color: accent, fontSize: 10, fontWeight: "800", marginTop: 9 },
  editorRoot: { flex: 1, backgroundColor: "#F7F8FA" }, modeButton: { width: 35, height: 35, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#F2F4F7" }, modeButtonActive: { backgroundColor: "#FFF0EE" }, codePanel: { flex: 1, backgroundColor: "#111827", margin: 14, borderRadius: 20, padding: 17 }, codeHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, codeEyebrow: { color: "#FFB6AF", fontSize: 9, letterSpacing: 1.3, fontWeight: "900" }, codeTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "800", marginTop: 3 }, syncBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 10, backgroundColor: "#1F2937" }, syncDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#4ADE80" }, syncText: { color: "#B9C1CC", fontSize: 10, fontWeight: "800" }, codeDescription: { color: "#A8B1BF", fontSize: 12, lineHeight: 18, marginTop: 15, marginBottom: 14 }, codeInput: { flex: 1, minHeight: 430, borderRadius: 14, backgroundColor: "#0B1220", color: "#F8FAFC", padding: 15, fontFamily: "monospace", fontSize: 12, lineHeight: 20, textAlignVertical: "top" }, applyCodeButton: { marginTop: 12, height: 45, borderRadius: 13, backgroundColor: accent, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }, applyCodeText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" }, runtimePill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E4E7EC", borderRadius: 12, paddingHorizontal: 9, paddingVertical: 6 }, runtimeDot: { width: 7, height: 7, borderRadius: 4 }, runtimePillText: { color: muted, fontSize: 10, fontWeight: "800", textTransform: "uppercase" }, editorTopbar: { height: 67, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#E9EDF2", paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 5 }, iconButton: { width: 35, height: 35, borderRadius: 12, alignItems: "center", justifyContent: "center" }, disabled: { opacity: 0.3 }, editorKicker: { color: muted, fontSize: 9, letterSpacing: 1.3, fontWeight: "800" }, editorName: { color: ink, fontSize: 15, fontWeight: "800", marginTop: 2 }, previewButton: { width: 36, height: 36, borderRadius: 12, backgroundColor: "#FFF0EE", alignItems: "center", justifyContent: "center", marginLeft: 3 }, canvasHeader: { paddingHorizontal: 20, paddingTop: 19, paddingBottom: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }, canvasTitle: { color: ink, fontSize: 20, fontWeight: "800" }, canvasHint: { color: muted, fontSize: 12, fontWeight: "600" }, canvas: { alignSelf: "center", backgroundColor: "#FFFFFF", borderRadius: 24, minHeight: 600, padding: 14, shadowColor: "#101828", shadowOpacity: 0.07, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 }, canvasRuler: { height: 25, flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 3 }, rulerText: { color: "#98A2B3", fontSize: 9, fontWeight: "800", letterSpacing: 1 }, rulerLine: { height: 1, backgroundColor: "#E4E7EC", flex: 1 },   systemNode: { flex: 1, borderRadius: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E4E7EC", borderLeftWidth: 4, padding: 14, justifyContent: "center" }, systemNodeTop: { flexDirection: "row", alignItems: "center", gap: 10 }, systemNodeIcon: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" }, systemNodeType: { color: muted, fontSize: 8, fontWeight: "900", letterSpacing: 1.2 }, systemNodeTitle: { color: ink, fontSize: 15, fontWeight: "800", marginTop: 2 }, systemNodeBody: { color: muted, fontSize: 12, fontFamily: "monospace", marginTop: 12 }, portGroup: { gap: 7, alignItems: "center" }, port: { width: 10, height: 10, borderRadius: 5, borderWidth: 2 }, systemNodeFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 }, portLabel: { color: "#98A2B3", fontSize: 8, fontWeight: "900", letterSpacing: 0.8 },
  blockWrap: { borderRadius: 14, marginBottom: 10, position: "relative", overflow: "visible" }, resizeHandle: { position: "absolute", right: -6, bottom: -6, width: 25, height: 25, borderRadius: 8, backgroundColor: accent, alignItems: "center", justifyContent: "center", zIndex: 6 }, meshSummary: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 10, paddingHorizontal: 5 }, meshSummaryText: { color: muted, fontSize: 10, fontWeight: "700" }, blockSelected: { borderWidth: 1.5, borderColor: accent, borderStyle: "dashed" }, blockDragging: { opacity: 0.7, transform: [{ scale: 1.015 }] }, blockBadge: { position: "absolute", zIndex: 5, right: 8, top: -10, backgroundColor: accent, borderRadius: 7, paddingHorizontal: 7, height: 22, alignItems: "center", flexDirection: "row", gap: 4 }, blockBadgeText: { color: "#FFFFFF", fontSize: 8, fontWeight: "900", letterSpacing: 0.6 }, sectionBlock: { flex: 1, borderRadius: 13, padding: 20, justifyContent: "center", overflow: "hidden" }, sectionBlockLabel: { color: "#FFB6AF", fontSize: 9, letterSpacing: 1.5, fontWeight: "900" }, sectionBlockTitle: { color: "#FFFFFF", fontSize: 24, lineHeight: 28, fontWeight: "800", maxWidth: 245, marginTop: 7 }, sectionBlockDot: { position: "absolute", width: 100, height: 100, borderRadius: 50, borderWidth: 22, borderColor: "#3A4757", right: -25, bottom: -30 }, textBlock: { flex: 1, padding: 17, justifyContent: "center" }, textBlockTitle: { color: ink, fontSize: 18, fontWeight: "800" }, textBlockLine: { height: 5, width: 90, backgroundColor: "#E4E7EC", borderRadius: 4, marginTop: 8 }, buttonBlock: { height: 48, borderRadius: 13, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", alignSelf: "flex-start", minWidth: 145 }, buttonBlockText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 }, cardBlock: { flex: 1, borderRadius: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E9EDF2", padding: 15, flexDirection: "row", alignItems: "center", gap: 11 }, cardIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: "#FFF0EE", alignItems: "center", justifyContent: "center" }, cardBlockTitle: { color: ink, fontWeight: "800", fontSize: 14 }, cardBlockCopy: { color: muted, fontSize: 11, marginTop: 4 }, imageBlock: { flex: 1, borderRadius: 13, backgroundColor: "#EEF1F5", alignItems: "center", justifyContent: "center", gap: 7 }, imageText: { color: muted, fontSize: 12, fontWeight: "700" }, dividerBlock: { flex: 1, justifyContent: "center", paddingHorizontal: 8 }, spacerBlock: { flex: 1, borderRadius: 10, borderWidth: 1, borderStyle: "dashed", borderColor: "#D9DEE7", alignItems: "center", justifyContent: "center" }, spacerText: { fontSize: 9, color: "#98A2B3", fontWeight: "800", letterSpacing: 1 }, dropHint: { height: 42, borderRadius: 12, borderWidth: 1, borderColor: "#FFD0CB", borderStyle: "dashed", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6, marginTop: 4 }, dropHintText: { color: accent, fontSize: 12, fontWeight: "800" }, bottomDock: { position: "absolute", left: 14, right: 14, bottom: 17, height: 66, borderRadius: 22, backgroundColor: "#FFFFFF", shadowColor: "#101828", shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 7 }, elevation: 7, flexDirection: "row", alignItems: "center", padding: 8, gap: 4 }, addBlockButton: { height: 50, flex: 1.2, borderRadius: 16, backgroundColor: accent, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 }, addBlockText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" }, dockAction: { flex: 0.8, alignItems: "center", justifyContent: "center", gap: 2 }, dockActionActive: { backgroundColor: "#FFF0EE", borderRadius: 14 }, dockText: { color: muted, fontSize: 10, fontWeight: "700" }, exportAction: { flex: 0.7, alignItems: "center", justifyContent: "center", gap: 2 },   nodeActions: { flexDirection: "row", alignItems: "center", gap: 3 }, nodeAction: { width: 31, height: 31, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "#F2F4F7" }, inspector: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: "#FFFFFF", borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 9, paddingBottom: 88, shadowColor: "#101828", shadowOpacity: 0.16, shadowRadius: 22, shadowOffset: { width: 0, height: -8 }, elevation: 12 }, inspectorHandle: { alignSelf: "center", height: 4, width: 36, borderRadius: 2, backgroundColor: "#D9DEE7", marginBottom: 15 }, inspectorHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, inspectorEyebrow: { color: accent, fontSize: 9, letterSpacing: 1.2, fontWeight: "900" }, inspectorTitle: { color: ink, fontSize: 19, fontWeight: "800", marginTop: 3 }, segmented: { height: 40, backgroundColor: "#F2F4F7", borderRadius: 11, padding: 3, flexDirection: "row", marginTop: 15 }, segment: { flex: 1, borderRadius: 9, alignItems: "center", justifyContent: "center" }, segmentActive: { backgroundColor: "#FFFFFF", shadowColor: "#101828", shadowOpacity: 0.06, shadowRadius: 4, elevation: 1 }, segmentText: { color: muted, fontSize: 12, fontWeight: "700" }, segmentTextActive: { color: ink }, controlRow: { flexDirection: "row", alignItems: "flex-end", gap: 10, marginTop: 15 }, field: { flex: 1 }, fieldLabel: { color: muted, fontSize: 11, fontWeight: "800", marginBottom: 6 }, textInput: { height: 42, borderWidth: 1, borderColor: "#E4E7EC", borderRadius: 11, paddingHorizontal: 12, color: ink, fontSize: 14 }, controlIcon: { width: 42, height: 42, borderRadius: 11, backgroundColor: "#F2F4F7", alignItems: "center", justifyContent: "center" },   styleControls: { marginTop: 15 }, inspectorToolRow: { flexDirection: "row", gap: 8, marginTop: 12, marginBottom: 14 }, inspectorTool: { flex: 1, height: 36, borderRadius: 10, backgroundColor: "#F2F4F7", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 }, inspectorToolText: { color: ink, fontSize: 10, fontWeight: "800" }, inspectorActionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, saveGalleryButton: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 9, backgroundColor: "#FFF0EE" }, saveGalleryText: { color: accent, fontSize: 10, fontWeight: "900" }, swatches: { flexDirection: "row", gap: 12, marginBottom: 15 }, swatch: { width: 29, height: 29, borderRadius: 10, borderWidth: 1, borderColor: "#E4E7EC" }, swatchSelected: { borderColor: accent, borderWidth: 3 }, stepperRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, stepper: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E4E7EC", borderRadius: 10, height: 35 }, stepButton: { width: 34, height: 34, alignItems: "center", justifyContent: "center" }, stepText: { color: ink, fontSize: 20, fontWeight: "500" }, stepValue: { color: ink, fontSize: 12, fontWeight: "800", minWidth: 54, textAlign: "center" }, sheetOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 20, justifyContent: "flex-end" }, sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(16,24,40,0.38)" }, addSheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 21, paddingBottom: 28 }, sheetHandle: { width: 38, height: 4, borderRadius: 2, backgroundColor: "#D9DEE7", alignSelf: "center", marginBottom: 18 }, sheetTitle: { color: ink, fontSize: 22, fontWeight: "800" }, sheetCopy: { color: muted, fontSize: 13, marginTop: 5, marginBottom: 17 }, catalogGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, catalogItem: { width: "22.7%", alignItems: "center", paddingVertical: 8 }, catalogIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: "#FFF0EE", alignItems: "center", justifyContent: "center", marginBottom: 7 }, catalogTitle: { color: ink, fontSize: 11, fontWeight: "800" },
});
