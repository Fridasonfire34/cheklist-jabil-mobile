import { BridgeSelectorModal } from "@/components/BridgeSelectorModal";
import { ThemedText } from "@/components/themed-text";
import { Spacing } from "@/constants/theme";
import { getLastSelectedPart } from "@/lib/selection";
import { getSession } from "@/lib/session";
import { Bridge, getBridgeUrl } from "@/utils/bridgeManager";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_W } = Dimensions.get("window");

type StepResult = string | null; // 'cumple' | 'no_cumple' | null

type Step =
  | {
      type: "part-info";
      numParte: string;
      material: string;
      largoRef: string;
      largoMin: number;
      largoMax: number;
      anchoRef: string;
      anchoMin: number;
      anchoMax: number;
      tolerancia: string;
    }
  | {
      type: "pem-group";
      pemLabel: string;
      pemImage: any;
      orientacionDesc: string;
      orientacionImage: any;
      cantidadRequired: number;
    }
  | { type: "image"; label: string; refImage: any }
  | { type: "counter"; label: string; required: number }
  | { type: "photos"; labels: string[] }
  | {
      type: "final-photos";
      title?: string;
      subtitle?: string;
      sections: Array<{
        sectionLabel: string;
        pairs: Array<{ label: string; refImage: any }>;
      }>;
    };

const STEPS: Step[] = [
  {
    type: "part-info",
    numParte: "CBM-101-004-00",
    material: "Galvanizado",
    largoRef: "29.96",
    largoMin: 29.91,
    largoMax: 30.01,
    anchoRef: "16.75",
    anchoMin: 16.7,
    anchoMax: 16.8,
    tolerancia: "dentro de tolerancia",
  },
  {
    type: "pem-group",
    pemLabel: "Pem 2-M4-2Z1 (XB0X039)",
    pemImage: require("./images/Pem 1 y 2.jpg"),
    orientacionDesc: "De adentro hacia afuera",
    orientacionImage: require("./images/Orientacion de Pem.jpg"),
    cantidadRequired: 52,
  },
  {
    type: "final-photos",
    title: "Colocación correcta del Pem",
    subtitle: "Alineado correctamente en ambos lados",
    sections: [
      {
        sectionLabel: "Fotografía frontal",
        pairs: [
          {
            label: "Colocacion pem 1",
            refImage: require("./images/Colocacion-pem1.jpg"),
          },
          {
            label: "Vista frontal",
            refImage: require("./images/Vista-frontal.jpg"),
          },
        ],
      },
      {
        sectionLabel: "Fotografía trasera",
        pairs: [
          {
            label: "Colocacion pem 2",
            refImage: require("./images/Colocacion-pem2.jpg"),
          },
          {
            label: "Vista trasera",
            refImage: require("./images/Vista-trasera.jpg"),
          },
        ],
      },
    ],
  },
];

// ─── Code 39 Barcode ─────────────────────────────────────────────────────────

const CODE39: Record<string, number[]> = {
  "0": [0, 0, 0, 1, 1, 0, 1, 0, 0],
  "1": [1, 0, 0, 1, 0, 0, 0, 0, 1],
  "2": [0, 0, 1, 1, 0, 0, 0, 0, 1],
  "3": [1, 0, 1, 1, 0, 0, 0, 0, 0],
  "4": [0, 0, 0, 1, 1, 0, 0, 0, 1],
  "5": [1, 0, 0, 1, 1, 0, 0, 0, 0],
  "6": [0, 0, 1, 1, 1, 0, 0, 0, 0],
  "7": [0, 0, 0, 1, 0, 0, 1, 0, 1],
  "8": [1, 0, 0, 1, 0, 0, 1, 0, 0],
  "9": [0, 0, 1, 1, 0, 0, 1, 0, 0],
  A: [1, 0, 0, 0, 0, 1, 0, 0, 1],
  B: [0, 0, 1, 0, 0, 1, 0, 0, 1],
  C: [1, 0, 1, 0, 0, 1, 0, 0, 0],
  D: [0, 0, 0, 0, 1, 1, 0, 0, 1],
  E: [1, 0, 0, 0, 1, 1, 0, 0, 0],
  F: [0, 0, 1, 0, 1, 1, 0, 0, 0],
  G: [0, 0, 0, 0, 0, 1, 1, 0, 1],
  H: [1, 0, 0, 0, 0, 1, 1, 0, 0],
  I: [0, 0, 1, 0, 0, 1, 1, 0, 0],
  J: [0, 0, 0, 0, 1, 1, 1, 0, 0],
  K: [1, 0, 0, 0, 0, 0, 0, 1, 1],
  L: [0, 0, 1, 0, 0, 0, 0, 1, 1],
  M: [1, 0, 1, 0, 0, 0, 0, 1, 0],
  N: [0, 0, 0, 0, 1, 0, 0, 1, 1],
  O: [1, 0, 0, 0, 1, 0, 0, 1, 0],
  P: [0, 0, 1, 0, 1, 0, 0, 1, 0],
  Q: [0, 0, 0, 0, 0, 0, 1, 1, 1],
  R: [1, 0, 0, 0, 0, 0, 1, 1, 0],
  S: [0, 0, 1, 0, 0, 0, 1, 1, 0],
  T: [0, 0, 0, 0, 1, 0, 1, 1, 0],
  U: [1, 1, 0, 0, 0, 0, 0, 0, 1],
  V: [0, 1, 1, 0, 0, 0, 0, 0, 1],
  W: [1, 1, 1, 0, 0, 0, 0, 0, 0],
  X: [0, 1, 0, 0, 1, 0, 0, 0, 1],
  Y: [1, 1, 0, 0, 1, 0, 0, 0, 0],
  Z: [0, 1, 1, 0, 1, 0, 0, 0, 0],
  "-": [0, 1, 0, 0, 0, 0, 1, 0, 1],
  ".": [1, 1, 0, 0, 0, 0, 1, 0, 0],
  " ": [0, 1, 1, 0, 0, 0, 1, 0, 0],
  "*": [1, 0, 0, 0, 1, 0, 1, 0, 0],
};

function Code39Barcode({
  value,
  barWidth = 1.6,
  barHeight = 52,
}: {
  value: string;
  barWidth?: number;
  barHeight?: number;
}) {
  const encoded = `*${String(value).toUpperCase()}*`;
  const els: { isBar: boolean; w: number }[] = [];
  for (let i = 0; i < encoded.length; i++) {
    const pat = CODE39[encoded[i]];
    if (!pat) continue;
    if (i > 0) els.push({ isBar: false, w: barWidth });
    for (let j = 0; j < 9; j++) {
      els.push({ isBar: j % 2 === 0, w: pat[j] ? barWidth * 3 : barWidth });
    }
  }
  return (
    <View style={{ flexDirection: "row", height: barHeight }}>
      {els.map((el, idx) => (
        <View
          key={idx}
          style={{
            width: el.w,
            height: barHeight,
            backgroundColor: el.isBar ? "#000" : "#fff",
          }}
        />
      ))}
    </View>
  );
}

function LabelPreviewModal({
  visible,
  labelId,
  partName,
  onPrint,
  onClose,
}: {
  visible: boolean;
  labelId: string;
  partName: string;
  onPrint: () => void;
  onClose: () => void;
}) {
  // Label physical size: 54mm × 25mm (landscape), scaled to screen
  const LABEL_W = 290;
  const LABEL_H = 134; // ratio 54:25

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const h = now.getHours();
  const printDate = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${String(now.getFullYear()).slice(-2)} ${h % 12 || 12}:${pad(now.getMinutes())} ${h >= 12 ? "pm" : "am"}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={lbl.overlay}>
        <View style={lbl.card}>
          <ThemedText style={lbl.title}>Vista previa de etiqueta</ThemedText>

          {/* Label canvas */}
          <View style={[lbl.label, { width: LABEL_W, height: LABEL_H }]}>
            {/* Fila superior: número de parte + fecha */}
            <View style={lbl.topRow}>
              <ThemedText style={lbl.partText}>{partName}</ThemedText>
              <ThemedText style={lbl.dateText}>{printDate}</ThemedText>
            </View>
            {/* Código de barras */}
            <Code39Barcode value={labelId} barWidth={1.5} barHeight={56} />
            {/* ID numérico */}
            <ThemedText style={lbl.idText}>{String(labelId)}</ThemedText>
            {/* Logo TMP */}
            <Image
              source={require("./images/TMP.png")}
              style={lbl.tmpLogo}
              resizeMode="contain"
            />
          </View>

          <View style={lbl.btnRow}>
            <TouchableOpacity style={lbl.printBtn} onPress={onPrint}>
              <ThemedText style={lbl.printText}>Imprimir</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={lbl.closeBtn} onPress={onClose}>
              <ThemedText style={lbl.closeText}>Ver reporte</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const lbl = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 24,
    alignItems: "center",
    gap: 12,
    marginHorizontal: 16,
  },
  title: { fontSize: 17, fontWeight: "700", color: "#1a3a6b" },
  subtitle: { fontSize: 12, color: "#888", marginTop: -6 },
  label: {
    backgroundColor: "#fff",
    borderWidth: 1.5,
    borderColor: "#222",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 2,
    overflow: "hidden",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  partText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#000",
    letterSpacing: 0.2,
  },
  dateText: {
    fontSize: 8,
    color: "#000",
  },
  idText: {
    fontSize: 9,
    color: "#000",
    letterSpacing: 0.5,
    alignSelf: "center",
  },
  tmpLogo: {
    width: 48,
    height: 18,
    alignSelf: "center",
  },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 4 },
  printBtn: {
    flex: 1,
    backgroundColor: "#1a56db",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
  },
  printText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  closeBtn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#1a56db",
  },
  closeText: { color: "#1a56db", fontWeight: "700", fontSize: 15 },
});

// ─────────────────────────────────────────────────────────────────────────────

const FINAL_PHOTO_COUNT = STEPS.reduce(
  (acc, s) =>
    s.type === "final-photos"
      ? acc + s.sections.reduce((a, sec) => a + sec.pairs.length, 0)
      : acc,
  0,
);

function ZoomableImage({ source, style }: { source: any; style: any }) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <TouchableOpacity
        style={{ width: "100%" }}
        onPress={() => setVisible(true)}
        activeOpacity={0.85}
      >
        <Image source={source} style={style} resizeMode="contain" />
      </TouchableOpacity>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.88)",
            alignItems: "center",
            justifyContent: "center",
          }}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <Image
            source={source}
            style={{ width: "95%", height: "80%" }}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </Modal>
    </>
  );
}

function PhotoPickerSheet({
  visible,
  hasPhoto,
  onClose,
  onPick,
  onDelete,
}: {
  visible: boolean;
  hasPhoto: boolean;
  onClose: () => void;
  onPick: (mode: "camera" | "gallery") => void;
  onDelete: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={psheet.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={psheet.container} onStartShouldSetResponder={() => true}>
          <View style={psheet.handle} />
          <ThemedText style={psheet.title}>
            {hasPhoto ? "Opciones de foto" : "Agregar foto"}
          </ThemedText>

          <TouchableOpacity
            style={psheet.option}
            onPress={() => onPick("camera")}
          >
            <ThemedText style={psheet.optionIcon}>📷</ThemedText>
            <ThemedText style={psheet.optionLabel}>Tomar foto</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={psheet.option}
            onPress={() => onPick("gallery")}
          >
            <ThemedText style={psheet.optionIcon}>🖼️</ThemedText>
            <ThemedText style={psheet.optionLabel}>
              Elegir de galería
            </ThemedText>
          </TouchableOpacity>

          {hasPhoto && (
            <TouchableOpacity style={psheet.deleteOption} onPress={onDelete}>
              <ThemedText style={psheet.optionIcon}>🗑️</ThemedText>
              <ThemedText style={psheet.deleteLabel}>Eliminar foto</ThemedText>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={psheet.cancelBtn} onPress={onClose}>
            <ThemedText style={psheet.cancelText}>Cancelar</ThemedText>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

function PhotoSlot({
  uri: uriProp,
  onUriChange,
}: {
  uri?: string | null;
  onUriChange?: (uri: string | null) => void;
} = {}) {
  const [uriState, setUriState] = useState<string | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  const uri = uriProp !== undefined ? uriProp : uriState;
  function setUri(v: string | null) {
    if (onUriChange) onUriChange(v);
    else setUriState(v);
  }

  async function pickPhoto(mode: "camera" | "gallery") {
    setSheetVisible(false);
    await new Promise<void>((r) => setTimeout(r, 300));
    if (mode === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso requerido", "Se necesita acceso a la cámara");
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });
      if (!res.canceled && res.assets[0].base64) setUri(res.assets[0].base64);
    } else {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso requerido", "Se necesita acceso a la galería");
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });
      if (!res.canceled && res.assets[0].base64) setUri(res.assets[0].base64);
    }
  }

  function handleDelete() {
    setSheetVisible(false);
    setUri(null);
  }

  return (
    <>
      {uri ? (
        <TouchableOpacity
          style={[
            card.cameraBox,
            { overflow: "hidden", borderStyle: "solid", borderColor: "#ccc" },
          ]}
          onPress={() => setSheetVisible(true)}
          activeOpacity={0.9}
        >
          <Image
            source={{
              uri: `data:image/${uri.startsWith("iVBOR") ? "png" : "jpeg"};base64,${uri}`,
            }}
            style={{ position: "absolute", width: "100%", height: "100%" }}
            resizeMode="cover"
          />
          <View style={card.photoEditBadge}>
            <ThemedText style={card.photoEditText}>✎ cambiar</ThemedText>
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={card.cameraBox}
          onPress={() => setSheetVisible(true)}
          activeOpacity={0.85}
        >
          <ThemedText style={card.cameraIcon}>📷</ThemedText>
          <ThemedText style={card.cameraHint}>Toca para agregar</ThemedText>
        </TouchableOpacity>
      )}
      <PhotoPickerSheet
        visible={sheetVisible}
        hasPhoto={!!uri}
        onClose={() => setSheetVisible(false)}
        onPick={pickPhoto}
        onDelete={handleDelete}
      />
    </>
  );
}

export default function PartScreen() {
  const router = useRouter();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const part = getLastSelectedPart() ?? "CBM-101-004-00";

  const [step, setStep] = useState(0);
  const [results, setResults] = useState<StepResult[]>(
    Array(STEPS.length).fill(null),
  );
  const [dimValues, setDimValues] = useState({ largo: "", ancho: "" });
  const [partInfoSub, setPartInfoSub] = useState<{
    numParte: StepResult;
    material: StepResult;
  }>({
    numParte: null,
    material: null,
  });
  const [counter, setCounter] = useState(52);
  const [pemCount, setPemCount] = useState("");
  const [pemPhotos, setPemPhotos] = useState<{
    pem: string | null;
    orientacion: string | null;
  }>({
    pem: null,
    orientacion: null,
  });
  const [finalPhotos, setFinalPhotos] = useState<(string | null)[]>(
    Array(FINAL_PHOTO_COUNT).fill(null),
  );
  const [submitting, setSubmitting] = useState(false);
  const [labelId, setLabelId] = useState<string | null>(null);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [printDate, setPrintDate] = useState<string>("");
  const [showBridgeSelector, setShowBridgeSelector] = useState(false);
  const [bridgePrinting, setBridgePrinting] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  function goTo(index: number) {
    setStep(index);
    scrollRef.current?.scrollTo({ x: index * SCREEN_W, animated: true });
  }

  function setResult(index: number, value: StepResult) {
    setResults((r) => {
      const next = [...r];
      next[index] = value;
      return next;
    });
  }

  function handleNext() {
    if (step < STEPS.length - 1) goTo(step + 1);
  }

  function handlePrev() {
    if (step > 0) goTo(step - 1);
  }

  function stepIsComplete() {
    const s = STEPS[step];
    if (s.type === "part-info") {
      return (
        partInfoSub.numParte === "cumple" &&
        partInfoSub.material === "cumple" &&
        dimValues.largo !== "" &&
        dimValues.ancho !== ""
      );
    }
    if (s.type === "pem-group") {
      return (
        pemPhotos.pem !== null &&
        pemPhotos.orientacion !== null &&
        pemCount !== ""
      );
    }
    if (s.type === "final-photos") {
      return finalPhotos.every((uri) => uri !== null);
    }
    return true;
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const BASE = "http://192.168.16.224:3002/api/Jabil";

      const saveRes = await fetch(`${BASE}/saveCMB-101-004-00`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          material: partInfoSub.material === "cumple" ? "SI" : "NO",
          largo: dimValues.largo,
          ancho: dimValues.ancho,
          cantidadPem: pemCount,
          fechaHora: new Date().toISOString(),
          userId: getSession() ?? "",
          fotoPem: pemPhotos.pem!,
          fotoOrientacion: pemPhotos.orientacion!,
          fotoColocacionPem1: finalPhotos[0]!,
          fotoVistaFrontal: finalPhotos[1]!,
          fotoColocacionPem2: finalPhotos[2]!,
          fotoVistaTrasera: finalPhotos[3]!,
        }),
      });
      if (!saveRes.ok) {
        const data = await saveRes.json().catch(() => ({}));
        Alert.alert(
          "Error",
          data?.message ?? "No se pudo guardar la validación",
        );
        return;
      }
      const { id } = await saveRes.json();

      const reportRes = await fetch(`${BASE}/Reporte`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          largo: dimValues.largo,
          ancho: dimValues.ancho,
          cantidadPem: pemCount,
          userId: getSession() ?? "",
        }),
      });
      if (!reportRes.ok) {
        const data = await reportRes.json().catch(() => ({}));
        Alert.alert("Error", data?.message ?? "No se pudo generar el reporte");
        return;
      }

      setReportUrl(`${BASE}/PDF/${id}`);
      setLabelId(id);
    } catch (err: any) {
      Alert.alert(
        "Error de conexión",
        err?.message ?? "No se pudo conectar al servidor",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleGoToReport() {
    setLabelId(null);
    if (reportUrl)
      router.push({ pathname: "/report", params: { url: reportUrl } });
  }

  function handlePrint() {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const h = now.getHours();
    setPrintDate(
      `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${String(now.getFullYear()).slice(-2)} ${h % 12 || 12}:${pad(now.getMinutes())} ${h >= 12 ? "pm" : "am"}`
    );
    setShowBridgeSelector(true);
  }

  async function handleBridgePrint(bridge: Bridge) {
    setShowBridgeSelector(false);
    setBridgePrinting(true);
    try {
      const url = `${getBridgeUrl(bridge.location, bridge.port)}/api/jabil/print`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ labelId: String(labelId), partName: part, printDate }),
      });
      const text = await res.text();
      let data: any = {};
      try { data = JSON.parse(text); } catch { /* respuesta no es JSON */ }
      if (!res.ok) throw new Error(data?.message ?? `Error ${res.status} — actualiza el bridge`);
      Alert.alert("Impreso", `Etiqueta enviada a ${data.printerName}`);
    } catch (err: any) {
      Alert.alert("Error de impresión", err?.message ?? "No se pudo conectar al bridge");
    } finally {
      setBridgePrinting(false);
    }
  }

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ThemedText style={styles.backText}>‹ Volver</ThemedText>
        </TouchableOpacity>
        <ThemedText style={styles.partName}>{part}</ThemedText>
        <ThemedText style={styles.stepCount}>
          {step + 1} / {STEPS.length}
        </ThemedText>
      </View>

      {/* Swipeable steps */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {STEPS.map((s, i) => (
          <View key={i} style={styles.page}>
            <StepCard
              step={s}
              index={i}
              result={results[i]}
              onResult={(v) => setResult(i, v)}
              dimValues={dimValues}
              onDimChange={setDimValues}
              counter={counter}
              onCounter={setCounter}
              partInfoSub={partInfoSub}
              onPartInfoSub={setPartInfoSub}
              pemCount={pemCount}
              onPemCount={setPemCount}
              pemPhotos={pemPhotos}
              onPemPhotos={setPemPhotos}
              finalPhotos={finalPhotos}
              onFinalPhotos={setFinalPhotos}
            />
          </View>
        ))}
      </ScrollView>

      {/* Navigation buttons */}
      <View
        style={[styles.navRow, { paddingBottom: Spacing.three + bottomInset }]}
      >
        <TouchableOpacity
          style={[styles.navBtn, step === 0 && styles.navBtnDisabled]}
          onPress={handlePrev}
          disabled={step === 0}
        >
          <ThemedText style={styles.navBtnText}>← Anterior</ThemedText>
        </TouchableOpacity>

        {isLast ? (
          <TouchableOpacity
            style={[
              styles.submitBtn,
              !stepIsComplete() && styles.submitBtnDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!stepIsComplete() || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.submitText}>
                Enviar validación
              </ThemedText>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navBtn, !stepIsComplete() && styles.navBtnDisabled]}
            onPress={handleNext}
            disabled={!stepIsComplete()}
          >
            <ThemedText style={styles.navBtnText}>Siguiente →</ThemedText>
          </TouchableOpacity>
        )}
      </View>
      {labelId && (
        <LabelPreviewModal
          visible={!!labelId}
          labelId={labelId}
          partName={part}
          onPrint={handlePrint}
          onClose={handleGoToReport}
        />
      )}
      <BridgeSelectorModal
        visible={showBridgeSelector}
        isLoading={bridgePrinting}
        onSelectBridge={handleBridgePrint}
        onCancel={() => setShowBridgeSelector(false)}
      />
    </KeyboardAvoidingView>
  );
}

// ─── Step Card ────────────────────────────────────────────────────────────────

type CardProps = {
  step: Step;
  index: number;
  result: StepResult;
  onResult: (v: StepResult) => void;
  dimValues: { largo: string; ancho: string };
  onDimChange: (v: { largo: string; ancho: string }) => void;
  counter: number;
  onCounter: (v: number) => void;
  partInfoSub: { numParte: StepResult; material: StepResult };
  onPartInfoSub: (v: { numParte: StepResult; material: StepResult }) => void;
  pemCount: string;
  onPemCount: (v: string) => void;
  pemPhotos: { pem: string | null; orientacion: string | null };
  onPemPhotos: (v: { pem: string | null; orientacion: string | null }) => void;
  finalPhotos: (string | null)[];
  onFinalPhotos: (v: (string | null)[]) => void;
};

function StepCard({
  step,
  index,
  result,
  onResult,
  dimValues,
  onDimChange,
  counter,
  onCounter,
  partInfoSub,
  onPartInfoSub,
  pemCount,
  onPemCount,
  pemPhotos,
  onPemPhotos,
  finalPhotos,
  onFinalPhotos,
}: CardProps) {
  if (step.type === "part-info") {
    const largoNum = parseFloat(dimValues.largo);
    const anchoNum = parseFloat(dimValues.ancho);
    const largoErr =
      dimValues.largo !== "" &&
      (isNaN(largoNum) || largoNum < step.largoMin || largoNum > step.largoMax);
    const anchoErr =
      dimValues.ancho !== "" &&
      (isNaN(anchoNum) || anchoNum < step.anchoMin || anchoNum > step.anchoMax);
    const anyErr = largoErr || anchoErr;

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={card.wrapper}>
          {/* Número de Parte */}
          <View style={card.section}>
            <ThemedText style={card.sectionLabel}>Número de Parte</ThemedText>
            <View style={card.refBadge}>
              <ThemedText style={card.refText}>{step.numParte}</ThemedText>
            </View>
            <ConfirmRow
              result={partInfoSub.numParte}
              onResult={(v) => onPartInfoSub({ ...partInfoSub, numParte: v })}
            />
          </View>
          <View style={card.divider} />
          {/* Material */}
          <View style={card.section}>
            <ThemedText style={card.sectionLabel}>Material</ThemedText>
            <View style={card.refBadge}>
              <ThemedText style={card.refText}>{step.material}</ThemedText>
            </View>
            <ConfirmRow
              result={partInfoSub.material}
              onResult={(v) => onPartInfoSub({ ...partInfoSub, material: v })}
            />
          </View>
          <View style={card.divider} />
          {/* Dimensiones */}
          <View style={card.dimRow}>
            <View style={card.dimField}>
              <ThemedText style={card.sectionLabel}>Largo Tapa</ThemedText>
              <ThemedText style={card.refSmall}>{step.largoRef} </ThemedText>
              <TextInput
                style={[card.dimInput, largoErr && card.dimInputError]}
                placeholder="Valor medido"
                placeholderTextColor="#bbb"
                value={dimValues.largo}
                onChangeText={(t) => onDimChange({ ...dimValues, largo: t })}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={card.dimField}>
              <ThemedText style={card.sectionLabel}>Ancho Tapa</ThemedText>
              <ThemedText style={card.refSmall}>{step.anchoRef}</ThemedText>
              <TextInput
                style={[card.dimInput, anchoErr && card.dimInputError]}
                placeholder="Valor medido"
                placeholderTextColor="#bbb"
                value={dimValues.ancho}
                onChangeText={(t) => onDimChange({ ...dimValues, ancho: t })}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
          <ThemedText style={anyErr ? card.toleranciaErr : card.tolerancia}>
            {anyErr ? "✗ fuera de tolerancia" : "✓ dentro de tolerancia"}
          </ThemedText>
        </View>
      </ScrollView>
    );
  }

  if (step.type === "pem-group") {
    return (
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={card.wrapper}>
          {/* PEM */}
          <View style={card.section}>
            <ThemedText style={card.sectionLabel}>{step.pemLabel}</ThemedText>
            <View style={card.photoRow}>
              <View style={card.photoBox}>
                <ThemedText style={card.photoCaption}>Referencia</ThemedText>
                <ZoomableImage source={step.pemImage} style={card.refImage} />
              </View>
              <View style={card.photoBox}>
                <ThemedText style={card.photoCaption}>Tu foto</ThemedText>
                <PhotoSlot
                  uri={pemPhotos.pem}
                  onUriChange={(v) => onPemPhotos({ ...pemPhotos, pem: v })}
                />
              </View>
            </View>
          </View>
          <View style={card.divider} />
          {/* Orientación */}
          <View style={card.section}>
            <ThemedText style={card.sectionLabel}>
              Orientación del PEM
            </ThemedText>
            <ThemedText style={card.refSmall}>
              {step.orientacionDesc}
            </ThemedText>
            <View style={card.photoRow}>
              <View style={card.photoBox}>
                <ThemedText style={card.photoCaption}>Referencia</ThemedText>
                <ZoomableImage
                  source={step.orientacionImage}
                  style={card.refImage}
                />
              </View>
              <View style={card.photoBox}>
                <ThemedText style={card.photoCaption}>Tu foto</ThemedText>
                <PhotoSlot
                  uri={pemPhotos.orientacion}
                  onUriChange={(v) =>
                    onPemPhotos({ ...pemPhotos, orientacion: v })
                  }
                />
              </View>
            </View>
          </View>
          <View style={card.divider} />
          {/* Cantidad */}
          <View style={card.section}>
            <ThemedText style={card.sectionLabel}>Cantidad del Pem</ThemedText>
            <ThemedText style={card.refSmall}>
              Requerido: {step.cantidadRequired}
            </ThemedText>
            <TextInput
              style={card.dimInput}
              placeholder="Ingresa cantidad"
              placeholderTextColor="#bbb"
              value={pemCount}
              onChangeText={onPemCount}
              keyboardType="number-pad"
            />
          </View>
        </View>
      </ScrollView>
    );
  }

  if (step.type === "image") {
    return (
      <View style={card.wrapper}>
        <ThemedText style={card.label}>{step.label}</ThemedText>
        <View style={card.photoRow}>
          <View style={card.photoBox}>
            <ThemedText style={card.photoCaption}>Referencia</ThemedText>
            <ZoomableImage source={step.refImage} style={card.refImage} />
          </View>
          <View style={card.photoBox}>
            <ThemedText style={card.photoCaption}>Tu foto</ThemedText>
            <TouchableOpacity style={card.cameraBox}>
              <ThemedText style={card.cameraIcon}>📷</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
        <ConfirmRow result={result} onResult={onResult} />
      </View>
    );
  }

  if (step.type === "counter") {
    return (
      <View style={card.wrapper}>
        <ThemedText style={card.label}>{step.label}</ThemedText>
        <View style={card.counterRow}>
          <TouchableOpacity
            style={card.counterBtn}
            onPress={() => onCounter(Math.max(0, counter - 1))}
          >
            <ThemedText style={card.counterBtnText}>−</ThemedText>
          </TouchableOpacity>
          <ThemedText style={card.counterVal}>{counter}</ThemedText>
          <TouchableOpacity
            style={card.counterBtn}
            onPress={() => onCounter(counter + 1)}
          >
            <ThemedText style={card.counterBtnText}>+</ThemedText>
          </TouchableOpacity>
        </View>
        <ThemedText style={card.required}>
          requerido: {step.required}
        </ThemedText>
        <ConfirmRow result={result} onResult={onResult} />
      </View>
    );
  }

  if (step.type === "photos") {
    return (
      <View style={card.wrapper}>
        <ThemedText style={card.label}>Fotografías finales</ThemedText>
        <View style={card.photoRow}>
          {step.labels.map((lbl) => (
            <View key={lbl} style={card.photoBox}>
              <PhotoSlot />
              <ThemedText style={card.photoCaption}>{lbl}</ThemedText>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (step.type === "final-photos") {
    return (
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={card.wrapper}>
          {step.title && (
            <ThemedText style={card.label}>{step.title}</ThemedText>
          )}
          {step.subtitle && (
            <ThemedText style={card.refSmall}>{step.subtitle}</ThemedText>
          )}
          {step.sections.map((section, si) => {
            const sectionOffset = step.sections
              .slice(0, si)
              .reduce((a, sec) => a + sec.pairs.length, 0);
            return (
              <View key={si} style={{ gap: Spacing.two }}>
                {(si > 0 || step.title || step.subtitle) && (
                  <View style={card.divider} />
                )}
                <ThemedText style={card.sectionLabel}>
                  {section.sectionLabel}
                </ThemedText>
                {section.pairs.map((pair, pi) => {
                  const flatIdx = sectionOffset + pi;
                  return (
                    <View key={pi} style={card.photoRow}>
                      <View style={card.photoBox}>
                        <ThemedText style={card.photoCaption}>
                          {pair.label}
                        </ThemedText>
                        <ZoomableImage
                          source={pair.refImage}
                          style={card.refImage}
                        />
                      </View>
                      <View style={card.photoBox}>
                        <ThemedText style={card.photoCaption}>
                          Tu foto
                        </ThemedText>
                        <PhotoSlot
                          uri={finalPhotos[flatIdx]}
                          onUriChange={(v) => {
                            const next = [...finalPhotos];
                            next[flatIdx] = v;
                            onFinalPhotos(next);
                          }}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>
    );
  }

  return null;
}

function ConfirmRow({
  result,
  onResult,
}: {
  result: StepResult;
  onResult: (v: StepResult) => void;
}) {
  return (
    <View style={confirm.row}>
      <TouchableOpacity
        style={[confirm.btn, result === "no_cumple" && confirm.noActive]}
        onPress={() => onResult(result === "no_cumple" ? null : "no_cumple")}
      >
        <ThemedText
          style={[confirm.text, result === "no_cumple" && confirm.noText]}
        >
          NO
        </ThemedText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[confirm.btn, result === "cumple" && confirm.yesActive]}
        onPress={() => onResult(result === "cumple" ? null : "cumple")}
      >
        <ThemedText
          style={[confirm.text, result === "cumple" && confirm.yesText]}
        >
          SI
        </ThemedText>
      </TouchableOpacity>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f6fa" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.two,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },
  backBtn: { padding: 8 },
  backText: { color: "#0a4db0", fontWeight: "600", fontSize: 16 },
  partName: { fontWeight: "700", fontSize: 15 },
  stepCount: { color: "#888", fontSize: 14 },
  page: { width: SCREEN_W, padding: Spacing.three, flex: 1 },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: Spacing.three,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e8e8e8",
  },
  navBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: "#e6f0ff",
  },
  navBtnDisabled: { opacity: 0.3 },
  navBtnText: { color: "#0a4db0", fontWeight: "600" },
  submitBtn: {
    flex: 1,
    marginLeft: Spacing.two,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#1a56db",
    alignItems: "center",
  },
  submitBtnDisabled: { opacity: 0.35 },
  submitText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});

const card = StyleSheet.create({
  wrapper: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: Spacing.three,
    gap: Spacing.three,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  label: { fontSize: 17, fontWeight: "700" },
  valueBox: {
    backgroundColor: "#f0f4ff",
    borderRadius: 8,
    padding: Spacing.three,
  },
  value: { fontSize: 20, fontWeight: "700", color: "#1a3a6b" },
  section: { gap: Spacing.two },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#555",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  refBadge: {
    backgroundColor: "#f0f4ff",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  refText: { fontSize: 17, fontWeight: "700", color: "#1a3a6b" },
  refSmall: { fontSize: 12, color: "#888", marginBottom: 4 },
  divider: { height: 1, backgroundColor: "#f0f0f0" },
  dimRow: { flexDirection: "row", gap: Spacing.three },
  dimField: { flex: 1 },
  dimLabel: { fontSize: 12, color: "#888", marginBottom: 4 },
  dimInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    fontSize: 18,
    fontWeight: "600",
  },
  dimInputError: { borderColor: "#e53935", backgroundColor: "#fff0f0" },
  tolerancia: { color: "#2e7d32", fontSize: 13 },
  toleranciaErr: { color: "#e53935", fontSize: 13 },
  photoRow: { flexDirection: "row", gap: Spacing.three },
  photoBox: { flex: 1, alignItems: "center", gap: Spacing.one },
  photoCaption: { fontSize: 12, color: "#888" },
  refImage: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  cameraBox: {
    width: "100%",
    height: 120,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#1a56db",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f4ff",
  },
  cameraIcon: { fontSize: 36, lineHeight: 44 },
  photoEditBadge: {
    position: "absolute",
    bottom: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  photoEditText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  cameraHint: { fontSize: 11, color: "#aaa", marginTop: 4 },
  counterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.four,
  },
  counterBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#e6f0ff",
    alignItems: "center",
    justifyContent: "center",
  },
  counterBtnText: { fontSize: 28, color: "#0a4db0", fontWeight: "700" },
  counterVal: {
    fontSize: 48,
    fontWeight: "700",
    minWidth: 80,
    textAlign: "center",
  },
  required: { textAlign: "center", color: "#e67e00", fontSize: 13 },
});

const confirm = StyleSheet.create({
  row: { flexDirection: "row", gap: Spacing.two, marginTop: Spacing.one },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#ddd",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  text: { fontWeight: "600", fontSize: 15, color: "#555" },
  noActive: { borderColor: "#e53935", backgroundColor: "#fdecea" },
  noText: { color: "#e53935" },
  yesActive: { borderColor: "#2e7d32", backgroundColor: "#e8f5e9" },
  yesText: { color: "#2e7d32" },
});

const psheet = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: 36,
    gap: Spacing.two,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e0e0e0",
    alignSelf: "center",
    marginBottom: Spacing.one,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    color: "#1a3a6b",
    paddingBottom: Spacing.one,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingVertical: 14,
    paddingHorizontal: Spacing.two,
    borderRadius: 14,
    backgroundColor: "#f0f4ff",
  },
  deleteOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingVertical: 14,
    paddingHorizontal: Spacing.two,
    borderRadius: 14,
    backgroundColor: "#fff0f0",
  },
  optionIcon: { fontSize: 20, lineHeight: 26 },
  optionLabel: { fontSize: 15, fontWeight: "600", color: "#1a3a6b" },
  deleteLabel: { fontSize: 15, fontWeight: "600", color: "#e53935" },
  cancelBtn: {
    marginTop: Spacing.one,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  cancelText: { fontSize: 15, fontWeight: "600", color: "#888" },
});
