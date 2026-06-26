import { ThemedText } from "@/components/themed-text";
import { File, Paths } from "expo-file-system";
import * as Print from "expo-print";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";
import Pdf from "react-native-pdf";

export default function ReportScreen() {
  const router = useRouter();
  const { url } = useLocalSearchParams<{ url: string }>();

  const [localUri, setLocalUri] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [printing, setPrinting] = useState(false);

  async function handlePrint() {
    if (!localUri) return;
    setPrinting(true);
    try {
      await Print.printAsync({ uri: localUri });
    } catch (e) {
      console.error("Print error:", e);
    } finally {
      setPrinting(false);
    }
  }

  useEffect(() => {
    if (!url) return;
    const dest = new File(Paths.cache, `reporte_${Date.now()}.pdf`);
    File.downloadFileAsync(url, dest, { idempotent: true })
      .then((f) => setLocalUri(f.uri))
      .catch(() => setError(true));
  }, [url]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/menu")} style={styles.backBtn}>
          <ThemedText style={styles.backText}>‹ Volver</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.title}>Reporte</ThemedText>
        <TouchableOpacity
          onPress={handlePrint}
          disabled={!localUri || printing}
          style={[styles.printBtn, (!localUri || printing) && { opacity: 0.4 }]}
        >
          <ThemedText style={styles.printText}>
            {printing ? "…" : "Imprimir"}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.center}>
          <ThemedText style={styles.errorText}>
            No se pudo descargar el reporte.
          </ThemedText>
        </View>
      ) : !localUri ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1a56db" />
          <ThemedText style={styles.hint}>Descargando reporte…</ThemedText>
        </View>
      ) : (
        <Pdf
          source={{ uri: localUri, cache: false }}
          style={{ flex: 1 }}
          onError={(e) => {
            console.error("PDF render error:", e);
            setError(true);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },
  backBtn: { padding: 8 },
  backText: { color: "#0a4db0", fontWeight: "600", fontSize: 16 },
  title: { fontWeight: "700", fontSize: 15 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  hint: { color: "#888", marginTop: 12 },
  errorText: { color: "#e53935", textAlign: "center", fontSize: 15 },
  printBtn: {
    backgroundColor: "#1a56db",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  printText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
