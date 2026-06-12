import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
} from 'expo-router/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { NellaColors, NellaFonts } from '@/constants/theme';

const RED        = NellaColors.red;   // #8B0000
const GOLD       = NellaColors.gold;  // #C8901A
const GRAY       = NellaColors.lightGray;
const LABEL_GRAY = '#4B5320';
const BG         = '#FBF3E2';         // tab bar background (door / cutout color)

// ─── Icon components (22 × 22, color = active|inactive) ──────────────────────

function InicioIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center' }}>
      {/* Filled-triangle roof */}
      <View style={{
        width: 0, height: 0,
        borderLeftWidth: 11, borderRightWidth: 11, borderBottomWidth: 10,
        borderLeftColor: 'transparent', borderRightColor: 'transparent',
        borderBottomColor: color,
        marginTop: 1,
      }} />
      {/* House body */}
      <View style={{
        width: 20, height: 11,
        backgroundColor: color,
        borderBottomLeftRadius: 2, borderBottomRightRadius: 2,
        alignItems: 'center', justifyContent: 'flex-end',
      }}>
        {/* Door cutout */}
        <View style={{ width: 6, height: 7, borderTopLeftRadius: 2, borderTopRightRadius: 2, backgroundColor: BG }} />
      </View>
    </View>
  );
}

function CategoriasIcon({ color }: { color: string }) {
  return (
    <View style={{ width: 22, height: 22, flexDirection: 'row', flexWrap: 'wrap', gap: 3.5, padding: 3, alignContent: 'flex-start' }}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={{ width: 7, height: 7, backgroundColor: color, borderRadius: 2 }} />
      ))}
    </View>
  );
}

function OfertasIcon({ color }: { color: string }) {
  // Percent sign: top-left circle + bottom-right circle + diagonal bar
  return (
    <View style={{ width: 22, height: 22 }}>
      <View style={{ position: 'absolute', top: 2, left: 2, width: 7, height: 7, borderRadius: 3.5, backgroundColor: color }} />
      <View style={{ position: 'absolute', bottom: 2, right: 2, width: 7, height: 7, borderRadius: 3.5, backgroundColor: color }} />
      <View style={{
        position: 'absolute',
        width: 22, height: 2.5, borderRadius: 1.5,
        backgroundColor: color,
        top: 9.75, left: 0,
        transform: [{ rotate: '-40deg' }],
      }} />
    </View>
  );
}

function PedidosIcon({ color }: { color: string }) {
  // Shopping bag: arch handle + rectangular body
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center' }}>
      {/* Handle arch */}
      <View style={{
        width: 10, height: 5,
        borderTopLeftRadius: 5, borderTopRightRadius: 5,
        borderWidth: 2.5, borderBottomWidth: 0,
        borderColor: color,
        marginBottom: -2,
        zIndex: 1,
      }} />
      {/* Bag body */}
      <View style={{ width: 20, height: 14, backgroundColor: color, borderRadius: 3 }} />
    </View>
  );
}

function PerfilIcon({ color }: { color: string }) {
  // Person: small filled circle (head) + wider rounded arc (shoulders)
  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 1 }}>
      <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: color, marginBottom: 2 }} />
      <View style={{
        width: 18, height: 8,
        backgroundColor: color,
        borderTopLeftRadius: 9, borderTopRightRadius: 9,
        borderBottomLeftRadius: 2, borderBottomRightRadius: 2,
      }} />
    </View>
  );
}

// ─── Tab button ───────────────────────────────────────────────────────────────

type TabBtnProps = TabTriggerSlotProps & {
  icon: React.ComponentType<{ color: string }>;
  label: string;
};

function TabBtn({ isFocused, icon: Icon, label, ...props }: TabBtnProps) {
  const iconColor  = isFocused ? RED : GRAY;
  const labelColor = isFocused ? RED : LABEL_GRAY;
  return (
    <Pressable {...props} style={[styles.btn, isFocused && styles.btnActive]}>
      <Icon color={iconColor} />
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      {isFocused && <View style={styles.activeBar} />}
    </Pressable>
  );
}

// ─── Tab layout ──────────────────────────────────────────────────────────────

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <View style={styles.bar}>
          <TabTrigger name="home"       href="/(tabs)/home"       asChild>
            <TabBtn icon={InicioIcon}     label="Inicio"      />
          </TabTrigger>
          <TabTrigger name="categorias" href="/(tabs)/categorias" asChild>
            <TabBtn icon={CategoriasIcon} label="Categorías"  />
          </TabTrigger>
          <TabTrigger name="ofertas"    href="/(tabs)/ofertas"    asChild>
            <TabBtn icon={OfertasIcon}    label="Ofertas"     />
          </TabTrigger>
          <TabTrigger name="pedidos"    href="/(tabs)/pedidos"    asChild>
            <TabBtn icon={PedidosIcon}    label="Pedidos"     />
          </TabTrigger>
          <TabTrigger name="perfil"     href="/(tabs)/perfil"     asChild>
            <TabBtn icon={PerfilIcon}     label="Perfil"      />
          </TabTrigger>
        </View>
      </TabList>
    </Tabs>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: BG,
    borderTopWidth: 1.5,
    borderTopColor: `${GOLD}44`,
    paddingTop: 8,
    paddingBottom: 6,
    paddingHorizontal: 4,
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
    borderRadius: 10,
    position: 'relative',
  },
  btnActive: {
    backgroundColor: 'rgba(139,0,0,0.07)',
  },
  label: {
    fontFamily: NellaFonts.bold,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  activeBar: {
    position: 'absolute',
    bottom: 0,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: RED,
  },
});
