import React, { useMemo, useState } from "react";
import { Dimensions, Image, Platform, Pressable, StatusBar, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, {
  Extrapolate,
  FadeInDown,
  FadeInUp,
  Layout,
  SharedValue,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// --- Design constants (tuned to match screenshot) ---
const COLORS = {
  bg: "#0A0A0A",
  panel: "#121212",
  panel2: "#151515",
  text: "#FFFFFF",
  dim: "#A7A7A7",
  border: "#2A2A2A",
  blue: "#6EA7FF",
  chip: "#1C1C1C",
};

const CARD_WIDTH = 110;
const CARD_HEIGHT = CARD_WIDTH * 1.3;
const CARD_SPACING = 14;
const LEFT_PADDING = 18; // left anchor padding to keep active item at the left

// --- Types ---
interface PosterType {
  key: string;
  title: string;
  subtitle?: string;
  color: string; // used as image placeholder
  image: string; // image URL
  tag?: string;
}

const POSTER_TYPES: PosterType[] = [
  {
    key: "display",
    title: "Display",
    subtitle: "Prod",
    color: "#5F4BB6",
    tag: "New Limited Edition",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e", // vibrant display lights
  },
  {
    key: "promotion",
    title: "Promotion",
    color: "#3A7A5E",
    tag: "Up to 50% Off",
    image: "https://images.unsplash.com/photo-1503602642458-232111445657", // shopping / sale
  },
  {
    key: "branding",
    title: "Branding",
    color: "#3C3C3C",
    tag: "Editor's Choice",
    image: "https://images.unsplash.com/photo-1529101091764-c3526daf38fe", // creative design/branding
  },
  {
    key: "announcement",
    title: "Announce",
    color: "#3E7CB1",
    image: "https://images.unsplash.com/photo-1504384764586-bb4cdc1707b0", // megaphone / announcement
  },
  {
    key: "poster",
    title: "Poster",
    color: "#7A3A3A",
    image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f", // poster wall
  },
  {
    key: "menu",
    title: "Menu",
    color: "#4B7F99",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5", // restaurant menu
  },
];

function usePulse() {
  const scale = useSharedValue(1);
  React.useEffect(() => {
    scale.value = withRepeat(
      withSequence(withTiming(1.15, { duration: 900 }), withTiming(1, { duration: 900 })),
      -1,
      true
    );
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return style;
}

const SegmentedControl: React.FC<{ activeIndex: number; onChange: (i: number) => void }> = ({
  activeIndex,
  onChange,
}) => {
  return (
    <View style={styles.segmentWrap}>
      {["Smart script", "Advanced script"].map((label, i) => (
        <Pressable key={label} style={styles.segment} onPress={() => onChange(i)}>
          <Text style={[styles.segmentText, i === activeIndex && styles.segmentTextActive]}>{label}</Text>
          {i === activeIndex ? (
            <LinearGradient
              colors={["#7A6CFF", "#59C3FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.segmentGradient}
            />
          ) : null}
        </Pressable>
      ))}
    </View>
  );
};

const PosterCard: React.FC<{
  item: PosterType;
  index: number;
  scrollX: SharedValue<number>;
  onPress: () => void;
}> = ({ item, index, scrollX, onPress }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const leftEdge = index * (CARD_WIDTH + CARD_SPACING) + LEFT_PADDING;
    const distanceToLeft = leftEdge - scrollX.value;

    const scale = interpolate(
      Math.abs(distanceToLeft),
      [0, CARD_WIDTH, CARD_WIDTH * 2],
      [1.05, 0.95, 0.9],
      Extrapolate.CLAMP
    );

    const translateY = interpolate(
      Math.abs(distanceToLeft),
      [0, CARD_WIDTH, CARD_WIDTH * 2],
      [-6, 0, 4],
      Extrapolate.CLAMP
    );

    const borderOpacity = interpolate(
      Math.abs(distanceToLeft),
      [0, CARD_WIDTH * 0.75, CARD_WIDTH * 1.5],
      [1, 0.35, 0.15],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale }, { translateY }],
      borderColor: `rgba(255,255,255,${0.8 * borderOpacity})`,
      shadowOpacity: 0.35 * (1.2 - Math.min(scale, 1.2)),
    };
  });

  return (
    <Animated.View layout={Layout.springify()} style={[styles.card, { backgroundColor: COLORS.chip }, animatedStyle]}>
      <Pressable onPress={onPress} style={{ flex: 1 }}>
        <View style={[styles.cardImage, { backgroundColor: item.color }]}>
          <Image source={{ uri: item.image }} style={styles.cardImg} />
          {!!item.tag && (
            <View style={styles.tagBadge}>
              <Text style={styles.tagText}>{item.tag}</Text>
            </View>
          )}
        </View>
        <View
          style={{
            padding: 10,
            flexDirection: "row",
            justifyContent: "space-between",
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <Text style={styles.cardTitle}>{item.title}</Text>
          {!!item.subtitle && <Text style={styles.cardSubtitle}>{item.subtitle}</Text>}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const ListItem: React.FC<{ label: string; value: string; onPress?: () => void }> = ({ label, value, onPress }) => (
  <Animated.View layout={Layout.springify()} entering={FadeInUp} style={styles.listItem}>
    <Pressable style={styles.listRow} onPress={onPress}>
      <Text style={styles.listLabel}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={styles.listValue}>{value}</Text>
        <Ionicons name="chevron-forward" size={20} color={COLORS.dim} />
      </View>
    </Pressable>
  </Animated.View>
);

const CombinedList: React.FC = () => (
  <Animated.View layout={Layout.springify()} entering={FadeInUp} style={styles.listItem}>
    <Pressable style={styles.listRow}>
      <Text style={styles.listLabel}>Size</Text>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={styles.listValue}>1080 x 1920 px</Text>
        <Ionicons name="chevron-forward" size={20} color={COLORS.dim} />
      </View>
    </Pressable>
    <View style={styles.listDivider} />
    <Pressable style={styles.listRow}>
      <Text style={styles.listLabel}>Category</Text>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={styles.listValue}>Foods and beverage</Text>
        <Ionicons name="chevron-forward" size={20} color={COLORS.dim} />
      </View>
    </Pressable>
  </Animated.View>
);

const GenerateButton: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const pulseStyle = usePulse();
  return (
    <Animated.View layout={Layout.springify()} entering={FadeInUp.delay(50)}>
      <Pressable onPress={onPress} style={styles.cta}>
        <Animated.View style={[styles.glowDot, pulseStyle]} />
        <Text style={styles.ctaText}>Generate</Text>
      </Pressable>
    </Animated.View>
  );
};

const PosterGeneratorScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [prompt, setPrompt] = useState(
    "stunning promotional image of a deliciously decorated cake, emphasiszing its layers, frosting, and toppings in an enticing setting."
  );

  const scrollX = useSharedValue(0);
  const [selected, setSelected] = useState(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollX.value = e.contentOffset.x;
    },
    onMomentumEnd: (e) => {
      scrollX.value = e.contentOffset.x;
    },
  });

  const snapInterval = CARD_WIDTH + CARD_SPACING;
  const contentPadding = useMemo(() => ({ paddingLeft: LEFT_PADDING, paddingRight: LEFT_PADDING }), []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top bar */}
      <Animated.View entering={FadeInDown} style={styles.topBar}>
        <Ionicons name="close" size={28} color={COLORS.text} />
      </Animated.View>

      <SegmentedControl activeIndex={activeTab} onChange={setActiveTab} />

      <Animated.ScrollView style={styles.scroller} showsVerticalScrollIndicator={false}>
        <Animated.Text entering={FadeInDown.delay(50)} style={styles.h1}>
          What type of posters do you want to create?
        </Animated.Text>

        {/* Carousel */}
        <Animated.ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.carousel, contentPadding]}
          snapToInterval={snapInterval}
          snapToAlignment="start"
          decelerationRate="fast"
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {POSTER_TYPES.map((p, i) => (
            <PosterCard key={p.key} item={p} index={i} onPress={() => setSelected(i)} scrollX={scrollX} />
          ))}
        </Animated.ScrollView>

        {/* Prompt box */}
        <Animated.View entering={FadeInUp.delay(80)} layout={Layout.springify()} style={styles.promptBox}>
          <TextInput
            placeholderTextColor={COLORS.dim}
            multiline
            value={prompt}
            onChangeText={setPrompt}
            style={styles.promptInput}
          />
          <View style={styles.promptCornerIcon}>
            <MaterialCommunityIcons name="image-plus-outline" size={22} color={COLORS.text} />
          </View>
        </Animated.View>

        {/* Settings */}
        <Animated.Text entering={FadeInUp.delay(100)} style={styles.settingsTitle}>
          Settings
        </Animated.Text>
        <CombinedList />

        <GenerateButton onPress={() => {}} />
      </Animated.ScrollView>

      {/* Footer */}
      {/* <View style={styles.footer}>
        <Text style={styles.footerBrand}>CapCut</Text>
        <Text style={styles.footerCurated}>curated by</Text>
        <Text style={styles.footerMobbin}>Mobbin</Text>
      </View> */}
    </View>
  );
};

export default PosterGeneratorScreen;

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: Platform.select({ ios: 10, android: 18 }),
  },
  topBar: {
    height: 42,
    justifyContent: "center",
    paddingHorizontal: 14,
  },
  close: { color: COLORS.text, fontSize: 28, opacity: 0.9 },
  segmentWrap: {
    flexDirection: "row",
    paddingHorizontal: 18,
    gap: 0,
  },
  segment: {
    flexDirection: "column",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    position: "relative",
  },
  segmentText: { color: COLORS.dim, fontSize: 16, fontWeight: "600" },
  segmentTextActive: { color: COLORS.text },
  segmentIndicator: {
    marginTop: 10,
    height: 3,
    width: 110,
    backgroundColor: COLORS.text,
    borderRadius: 3,
  },
  segmentGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 4,
    borderRadius: 3,
  },
  h1: {
    color: COLORS.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
    paddingHorizontal: 18,
    marginTop: 10,
  },
  carousel: {
    paddingVertical: 16,
  },
  scroller: { flex: 1 },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 16,
    marginRight: CARD_SPACING,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  cardImage: {
    flex: 1,
    backgroundColor: "#333",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    overflow: "hidden",
  },
  cardImg: { width: "100%", height: "100%" },
  tagBadge: {
    backgroundColor: "rgba(0,0,0,0.35)",
    margin: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    color: COLORS.text,
    fontWeight: "800",
    lineHeight: 16,
  },
  cardTitle: {
    color: COLORS.text,
    fontWeight: "800",
    textTransform: "capitalize",
    fontSize: 14,
  },
  cardSubtitle: {
    color: COLORS.dim,
    fontSize: 12,
    marginTop: 2,
  },
  promptBox: {
    marginHorizontal: 18,
    marginTop: 10,
    backgroundColor: COLORS.panel,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 170,
    padding: 14,
  },
  promptInput: {
    color: COLORS.text,
    fontSize: 18,
    lineHeight: 26,
  },
  promptCornerIcon: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 36,
    height: 36,
    backgroundColor: COLORS.panel2,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settingsTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "800",
    marginTop: 20,
    paddingHorizontal: 18,
  },
  listItem: {
    marginHorizontal: 18,
    marginTop: 8,
    backgroundColor: COLORS.panel,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  listRow: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  listDivider: { height: 1, backgroundColor: COLORS.border },
  listLabel: { color: COLORS.text, fontSize: 16 },
  listValue: { color: COLORS.dim, fontSize: 16, marginRight: 6 },
  chev: { color: COLORS.dim, fontSize: 22, marginLeft: 4 },
  cta: {
    marginHorizontal: 18,
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.text,
    flexDirection: "row",
    gap: 12,
  },
  glowDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.blue,
  },
  ctaText: { color: "#000", fontSize: 18, fontWeight: "800" },
  footer: {
    flexDirection: "row",
    alignSelf: "center",
    gap: 10,
    alignItems: "center",
    marginTop: 16,
    marginBottom: 10,
  },
  footerBrand: { color: COLORS.text, fontWeight: "800" },
  footerCurated: { color: COLORS.dim, fontSize: 12 },
  footerMobbin: { color: COLORS.text, fontWeight: "800" },
});
