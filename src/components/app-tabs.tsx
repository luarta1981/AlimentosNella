import { Ionicons } from '@expo/vector-icons';
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
} from 'expo-router/ui';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NellaColors, NellaFonts } from '@/constants/theme';

const RED        = NellaColors.red;
const GOLD       = NellaColors.gold;
const GRAY       = NellaColors.lightGray;
const LABEL_GRAY = '#4B5320';
const BG         = '#FBF3E2';

// ─── Icon config per tab ──────────────────────────────────────────────────────

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: Record<string, { icon: IoniconsName; iconActive: IoniconsName; label: string }> = {
  home:       { icon: 'home-outline',     iconActive: 'home',      label: 'Inicio'     },
  categorias: { icon: 'grid-outline',     iconActive: 'grid',      label: 'Categorías' },
  ofertas:    { icon: 'pricetag-outline', iconActive: 'pricetag',  label: 'Ofertas'    },
  pedidos:    { icon: 'receipt-outline',  iconActive: 'receipt',   label: 'Pedidos'    },
  perfil:     { icon: 'person-outline',   iconActive: 'person',    label: 'Perfil'     },
};

// ─── Tab button ───────────────────────────────────────────────────────────────

type TabBtnProps = TabTriggerSlotProps & { name: string };

function TabBtn({ isFocused, name, ...props }: TabBtnProps) {
  const cfg        = TABS[name];
  const iconColor  = isFocused ? RED : GRAY;
  const labelColor = isFocused ? RED : LABEL_GRAY;
  const icon       = isFocused ? cfg.iconActive : cfg.icon;

  return (
    <Pressable {...props} style={[styles.btn, isFocused && styles.btnActive]}>
      <Ionicons name={icon} size={24} color={iconColor} />
      <Text style={[styles.label, { color: labelColor }]}>{cfg.label}</Text>
      {isFocused && <View style={styles.activeBar} />}
    </Pressable>
  );
}

// ─── Tab layout ──────────────────────────────────────────────────────────────

export default function AppTabs() {
  const { bottom } = useSafeAreaInsets();
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <TabList asChild>
        <View style={StyleSheet.flatten([styles.bar, { paddingBottom: Math.max(bottom, 8) }])}>
          <TabTrigger name="home"       href="/(tabs)/home"       asChild>
            <TabBtn name="home"       />
          </TabTrigger>
          <TabTrigger name="categorias" href="/(tabs)/categorias" asChild>
            <TabBtn name="categorias" />
          </TabTrigger>
          <TabTrigger name="ofertas"    href="/(tabs)/ofertas"    asChild>
            <TabBtn name="ofertas"    />
          </TabTrigger>
          <TabTrigger name="pedidos"    href="/(tabs)/pedidos"    asChild>
            <TabBtn name="pedidos"    />
          </TabTrigger>
          <TabTrigger name="perfil"     href="/(tabs)/perfil"     asChild>
            <TabBtn name="perfil"     />
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
    elevation: 8,
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
