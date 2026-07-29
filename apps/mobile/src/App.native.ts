import { createElement } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { createMobileAppModel } from "./App";

export function LeclercMobileApp() {
  const model = createMobileAppModel("es");
  const activeMissions = model.opsConsole.counts.activeMissions;
  const availableTokens = model.walletSelector.availableTokens
    .map((token) => token.symbol)
    .join(" / ");

  return createElement(
    SafeAreaView,
    { style: styles.root },
    createElement(
      ScrollView,
      { contentContainerStyle: styles.content },
      createElement(Text, { style: styles.eyebrow }, model.readiness.runtime),
      createElement(Text, { style: styles.title }, model.brand.productName),
      createElement(Text, { style: styles.greeting }, model.greeting),
      createElement(
        View,
        { style: styles.panel },
        createElement(Text, { style: styles.label }, "Estado nativo"),
        createElement(Text, { style: styles.value }, model.readiness.state),
        createElement(Text, { style: styles.detail }, `Instalable: ${model.readiness.installable ? "si" : "no"}`),
      ),
      createElement(
        View,
        { style: styles.panel },
        createElement(Text, { style: styles.label }, "Operacion activa"),
        createElement(Text, { style: styles.value }, `${activeMissions} misiones`),
        createElement(Text, { style: styles.detail }, model.walletSelector.selectedNetwork.name),
        createElement(Text, { style: styles.detail }, availableTokens),
      ),
      createElement(
        View,
        { style: styles.panel },
        createElement(Text, { style: styles.label }, "Bloqueadores"),
        ...model.readiness.blockers.map((blocker) =>
          createElement(Text, { key: blocker, style: styles.detail }, blocker),
        ),
      ),
    ),
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#08090b",
  },
  content: {
    gap: 14,
    padding: 20,
  },
  eyebrow: {
    color: "#d8c231",
    fontSize: 12,
    letterSpacing: 0,
    textTransform: "uppercase",
  },
  title: {
    color: "#f4f1e8",
    fontSize: 38,
    fontWeight: "700",
  },
  greeting: {
    color: "#c8ced6",
    fontSize: 18,
  },
  panel: {
    borderColor: "#303742",
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  label: {
    color: "#9aa4b2",
    fontSize: 12,
    textTransform: "uppercase",
  },
  value: {
    color: "#f4f1e8",
    fontSize: 20,
    fontWeight: "600",
  },
  detail: {
    color: "#c8ced6",
    fontSize: 14,
  },
});
