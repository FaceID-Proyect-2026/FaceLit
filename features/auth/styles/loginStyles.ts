import { Colors } from '@/shared/constants/colors';
import { FontSize, FontWeight } from '@/shared/constants/typography';
import { Dimensions, StyleSheet } from 'react-native';

const isWide = Dimensions.get('window').width >= 768;

export const loginStyles = StyleSheet.create({
  gradient: { flex: 1 },
  safe: { flex: 1 },
  kav: { flex: 1 },

  arcTop: { position: 'absolute', width: 300, height: 420, right: -120, top: -90, borderRadius: 200 },
  arcBottom: { position: 'absolute', width: 420, height: 220, left: -120, bottom: -30, borderRadius: 180 },
  deco1: { position: 'absolute', width: 160, height: 160, left: -60, top: '35%', borderRadius: 80 },
  deco2: { position: 'absolute', width: 100, height: 100, right: -30, bottom: '30%', borderRadius: 50 },

  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  scrollView: { flex: 1 },

  card: {
    width: '100%',
    maxWidth: 720,
    borderRadius: 28,
    borderWidth: 1,
    paddingHorizontal: isWide ? 52 : 32,
    paddingVertical: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },

  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: 18,
    width: 38, height: 38,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoWrap: { alignItems: 'center', marginBottom: 14 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },

  title: { fontSize: FontSize['3xl'], fontWeight: FontWeight.black, textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: FontSize.md, textAlign: 'center', lineHeight: 20, marginBottom: 16 },

  divider: { height: 1.5, borderRadius: 2, marginBottom: 22 },

  fieldGroup: { marginBottom: 16 },
  label: { fontSize: FontSize.md, fontWeight: FontWeight.bold, marginBottom: 6 },
  inputWrap: {
    height: 52, borderWidth: 1.5, borderRadius: 14,
    paddingHorizontal: 14, flexDirection: 'row',
    alignItems: 'center', gap: 10,
  },
  input: { flex: 1, minWidth: 0, flexShrink: 1, fontSize: FontSize.lg, outlineStyle: 'none' } as any,
  eyeBtn: { width: 36, height: 40, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: Colors.error, fontSize: FontSize.xs, marginTop: 3 },
  helperText: { fontSize: FontSize.xs, marginTop: 4 },
  policyCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 4, marginBottom: 4 },
  policyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: { width: 20, height: 20, borderWidth: 1.5, borderRadius: 4, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  policyTextWrap: { flex: 1 },
  policyText: { fontSize: FontSize.md, lineHeight: 22 },
  policyLink: { fontSize: FontSize.md, fontWeight: FontWeight.bold, textDecorationLine: 'underline', lineHeight: 22 },

  blockedBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 4 },
  blockedText: { flex: 1, fontSize: FontSize.sm, lineHeight: 20, fontWeight: FontWeight.bold },

  loginBtn: { width: '100%', maxWidth: 340, alignSelf: 'center', borderRadius: 16, overflow: 'hidden', marginTop: 22, marginBottom: 12 },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnGradient: { paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  loginBtnText: { color: Colors.white, fontSize: FontSize.lg, fontWeight: FontWeight.bold },

  links: { alignItems: 'center', marginTop: 8 },
  forgotBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1 },
  forgotText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, textDecorationLine: 'underline' },
});
