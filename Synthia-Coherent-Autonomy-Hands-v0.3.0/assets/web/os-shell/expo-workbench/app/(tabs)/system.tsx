import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/screen-container";

const apps = [
  ["WORLD", "People, places, things, crossings"],
  ["MORPH", "Embodiment and recursive media"],
  ["BROWSER", "Plan → perceive → act → verify"],
  ["BUILDER", "Inspect → propose → test → approve → build"],
  ["GRAPHS", "State, dependency, causal, knowledge, temporal"],
  ["CULTIVATION", "Evidence-backed developmental loops"],
  ["RESEARCH", "Sources, claims, hypotheses, experiments"],
  ["APP CENTER", "ATO, Tool Factory, learned capabilities"],
  ["ADMIN", "Approvals, lineage, permissions, rollback"],
  ["SETTINGS", "Autonomy and interface controls"],
];

export default function SystemScreen() {
  return <ScreenContainer>
    <ScrollView contentContainerStyle={styles.page}>
      <Text style={styles.eyebrow}>SYNTHIA ORGANISM OS</Text>
      <Text style={styles.title}>One organism. Many surfaces.</Text>
      <Text style={styles.copy}>The workbench is an editing surface, not the brain. Every system app is backed by an explicit runtime capability.</Text>
      <View style={styles.grid}>{apps.map(([name,desc]) => <View key={name} style={styles.card}><Text style={styles.name}>{name}</Text><Text style={styles.desc}>{desc}</Text></View>)}</View>
    </ScrollView>
  </ScreenContainer>;
}
const styles=StyleSheet.create({
  page:{padding:20,gap:18},eyebrow:{fontSize:12,fontWeight:"800",letterSpacing:1.8,color:"#FF6B5E"},
  title:{fontSize:30,fontWeight:"800",color:"#17202A"},copy:{fontSize:15,lineHeight:22,color:"#667085",maxWidth:560},
  grid:{flexDirection:"row",flexWrap:"wrap",gap:12},card:{width:"47%",minHeight:112,borderRadius:18,padding:16,backgroundColor:"#FFFFFF",borderWidth:1,borderColor:"#E4E7EC"},
  name:{fontSize:14,fontWeight:"800",color:"#17202A"},desc:{marginTop:8,fontSize:13,lineHeight:18,color:"#667085"}
});
