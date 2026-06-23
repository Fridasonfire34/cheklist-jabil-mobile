import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { setLastSelectedPart } from "@/lib/selection";
import { useRouter } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export default function MenuScreen() {
  const router = useRouter();
  const parts = ["CMB-101-004-00"];

  function handleSelect(part: string) {
    setLastSelectedPart(part);
    router.push("/part");
  }

  function handleBack() {
    router.replace("/login");
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ThemedText style={styles.backButtonText}>Volver</ThemedText>
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>
          Menu
        </ThemedText>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.list}>
        {parts.map((p) => (
          <TouchableOpacity
            key={p}
            style={styles.item}
            onPress={() => handleSelect(p)}
          >
            <ThemedText>{p}</ThemedText>
          </TouchableOpacity>
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.four },
  title: { textAlign: "center", marginBottom: Spacing.three },
  list: { gap: Spacing.two },
  item: {
    padding: Spacing.three,
    backgroundColor: "#f0f0f3",
    borderRadius: 8,
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.three,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#e6f0ff",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonText: { color: "#0a4db0", fontWeight: "600" },
});
