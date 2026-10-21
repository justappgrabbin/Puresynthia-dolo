// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = string;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING: IconMapping = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "arrow-upward": "file-upload",
  "arrow-back": "arrow-back",
  "arrow-forward": "arrow-forward",
  "undo": "undo",
  "redo": "redo",
  "visibility": "visibility",
  "edit": "edit",
  "close": "close",
  "add": "add",
  "add-circle-outline": "add-circle-outline",
  "tune": "tune",
  "ios-share": "ios-share",
  "folder-open": "folder-open",
  "view-quilt": "view-quilt",
  "text-fields": "text-fields",
  "image": "image",
  "smart-button": "smart-button",
  "web": "web",
  "remove": "remove",
  "space-bar": "space-bar",
  "drag-handle": "drag-handle",
  "auto-awesome": "auto-awesome",
};

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name] ?? "help-outline"} style={style} />;
}
