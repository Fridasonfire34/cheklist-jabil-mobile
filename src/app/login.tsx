import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { setSession } from "@/lib/session";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function LoginScreen() {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);
  const passwordInputRef = useRef<TextInput>(null);
  const router = useRouter();

  async function handleLogin() {
    if (!id || !password) {
      Alert.alert("Error", "Ingrese id (nómina) y contraseña");
      return;
    }
    setLoading(true);
    try {
      const rawId = String(id ?? "").trim();
      const payloadIdNum = Number(rawId);
      const bodyPayload = {
        // enviar varias claves por compatibilidad con diferentes backends
        id: rawId,
        ID: rawId,
        nomina: rawId,
        idNumber: Number.isNaN(payloadIdNum) ? undefined : payloadIdNum,
        password,
      };

      console.log("Enviando login desde app:", bodyPayload);

      const res = await fetch("http://192.168.16.224:3002/api/Jabil/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        const message = data?.message ?? "Error en autenticación";
        Alert.alert("Login fallido", message.toString());
      } else {
        setSession(rawId);
        router.replace("/menu");
      }
    } catch (err) {
      Alert.alert("Error", "No se pudo conectar al servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.outerContainer}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoWrapper}>
            <Image
              source={require("./images/jabil.png")}
              style={styles.logo}
              contentFit="contain"
            />
          </View>
          <View style={styles.box}>
            <ThemedText type="title" style={styles.title}>
              Iniciar sesión
            </ThemedText>

            <ThemedText style={styles.label}>ID (nómina)</ThemedText>
            <TextInput
              value={id}
              onChangeText={setId}
              style={styles.input}
              placeholder="000000"
              placeholderTextColor="#888"
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={() => passwordInputRef.current?.focus()}
            />

            <ThemedText style={styles.label}>Contraseña</ThemedText>
            <TextInput
              ref={passwordInputRef}
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              placeholder="Contraseña"
              placeholderTextColor="#888"
              secureTextEntry={secure}
              autoCapitalize="none"
              onSubmitEditing={handleLogin}
            />

            <View style={styles.showRow}>
              <Switch
                value={!secure}
                onValueChange={(v) => setSecure(!v)}
                trackColor={{ true: "#4ea1ff", false: "#ccc" }}
                thumbColor={
                  Platform.OS === "android"
                    ? !secure
                      ? "#fff"
                      : "#fff"
                    : undefined
                }
              />
              <ThemedText style={styles.showLabel}>Mostrar contraseña</ThemedText>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.buttonText}>Entrar</ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1 },
  container: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 16 },
  box: {
    width: "100%",
    maxWidth: 420,
    padding: Spacing.four,
    gap: Spacing.three,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#032d45",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: Spacing.three,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  logo: { width: 88, height: 88 },
  title: { textAlign: "center" },
  label: { marginTop: Spacing.two },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    marginTop: 6,
  },
  showRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.two,
    gap: Spacing.one,
  },
  showLabel: { marginLeft: 8 },
  button: {
    marginTop: Spacing.three,
    backgroundColor: "#2978f2",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700" },
});
