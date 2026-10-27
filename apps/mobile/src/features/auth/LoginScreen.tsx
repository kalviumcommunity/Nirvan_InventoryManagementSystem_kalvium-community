import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  Switch, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

interface LoginScreenProps {
  terminalId?: string;
  onLogin: (email: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  terminalId = 'Terminal 07',
  onLogin
}) => {
  const { signIn, signUp, resetPassword, error, clearError, isFirebaseLive } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [localMessage, setLocalMessage] = useState<string | null>(null);

  const handleTabSwitch = (loginTab: boolean) => {
    setIsLoginTab(loginTab);
    clearError();
    setLocalMessage(null);
  };

  const handleSubmit = async () => {
    const userEmail = email.trim();
    if (!userEmail) {
      setLocalMessage('Please provide an email address.');
      return;
    }
    if (!password) {
      setLocalMessage('Please provide your password.');
      return;
    }

    setSubmitting(true);
    setLocalMessage(null);
    clearError();

    try {
      if (isLoginTab) {
        await signIn(userEmail, password);
      } else {
        await signUp(userEmail, password);
      }
      onLogin(userEmail);
    } catch (e: any) {
      // Error is caught and surfaced via AuthContext
      console.log('Authentication error:', e?.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    const userEmail = email.trim();
    if (!userEmail) {
      Alert.alert(
        'Reset Password',
        'Please enter your work email in the email field first, then tap Forgot password again.'
      );
      return;
    }

    try {
      await resetPassword(userEmail);
      Alert.alert(
        'Password Reset Sent',
        `A password reset link has been dispatched to ${userEmail}. Check your inbox.`
      );
    } catch {
      Alert.alert('Reset Failed', 'Could not send reset email. Verify the email address.');
    }
  };

  const activeError = error || localMessage;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
           <Text style={styles.logo}>📦 Rentory •</Text>
           <View style={styles.terminalBadge}>
             <View style={styles.terminalDot} />
             <Text style={styles.terminalText}>{terminalId}</Text>
           </View>
        </View>

        {/* Title */}
        <Text style={styles.welcomeText}>{isLoginTab ? 'Welcome back' : 'Create Account'}</Text>
        <Text style={styles.subtitle}>Rentory inventory & dispatch terminal</Text>

        {/* Connection status badge */}
        <View style={styles.statusBadgeRow}>
          <View style={[styles.statusDot, { backgroundColor: isFirebaseLive ? '#2E7D32' : '#E65100' }]} />
          <Text style={styles.statusBadgeText}>
            {isFirebaseLive ? 'Firebase Auth Live' : 'Demo Mode (Configure .env for Live Firebase)'}
          </Text>
        </View>

        <View style={styles.formContainer}>
          {/* Tabs */}
          <View style={styles.tabContainer}>
             <TouchableOpacity 
               style={[styles.tab, isLoginTab && styles.activeTab]} 
               onPress={() => handleTabSwitch(true)}
             >
               <Text style={[styles.tabText, isLoginTab && styles.activeTabText]}>Log In</Text>
             </TouchableOpacity>
             <TouchableOpacity 
               style={[styles.tab, !isLoginTab && styles.activeTab]} 
               onPress={() => handleTabSwitch(false)}
             >
               <Text style={[styles.tabText, !isLoginTab && styles.activeTabText]}>Sign Up</Text>
             </TouchableOpacity>
          </View>

          {/* Error Message Display */}
          {activeError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {activeError}</Text>
            </View>
          )}

          {/* Inputs */}
          <Text style={styles.label}>Work Email</Text>
          <TextInput 
             style={styles.input} 
             placeholder="operator@rentory.supply" 
             placeholderTextColor="#A0A0A0"
             value={email}
             onChangeText={(txt) => { setEmail(txt); if (activeError) clearError(); }}
             autoCapitalize="none"
             autoCorrect={false}
             keyboardType="email-address"
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput 
              style={styles.passwordInput} 
              placeholder="••••••••••••" 
              placeholderTextColor="#A0A0A0"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(txt) => { setPassword(txt); if (activeError) clearError(); }}
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.optionsRow}>
             <View style={styles.rememberRow}>
               <Switch 
                 value={rememberMe} 
                 onValueChange={setRememberMe}
                 trackColor={{ false: '#E0E0E0', true: '#4A5D4E' }}
                 style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
               />
               <Text style={styles.rememberText}>Remember me</Text>
             </View>
             {isLoginTab && (
               <TouchableOpacity onPress={handleForgotPassword}>
                 <Text style={styles.forgotText}>Forgot password?</Text>
               </TouchableOpacity>
             )}
          </View>

          <TouchableOpacity 
            style={[styles.loginButton, submitting && { opacity: 0.7 }]} 
            onPress={handleSubmit}
            disabled={submitting}
          >
             {submitting ? (
               <ActivityIndicator color="white" />
             ) : (
               <Text style={styles.loginButtonText}>
                 {isLoginTab ? 'Log In to Inventory →' : 'Sign Up with Firebase →'}
               </Text>
             )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.orText}>SECURED AUTHENTICATION</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity 
              style={styles.quickAccessBtn}
              onPress={() => {
                setEmail('sarah.jenkins@rentory.supply');
                setPassword('warehouse123');
              }}
            >
              <Text style={styles.quickAccessText}>👤 Fill Demo Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>🔒 Secured with Firebase Authentication & JWT</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  logo: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginRight: 8 },
  terminalBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFEFEF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  terminalDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#888', marginRight: 6 },
  terminalText: { fontSize: 12, color: '#666', fontWeight: '500' },
  welcomeText: { fontSize: 28, fontWeight: '600', color: '#1A1A1A', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 16 },
  statusBadgeRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 8, 
    marginBottom: 20 
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusBadgeText: { fontSize: 11, fontWeight: '600', color: '#4B5563' },
  formContainer: { backgroundColor: 'white', padding: 18, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#F0F0F0', borderRadius: 12, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#4A5D4E' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#666' },
  activeTabText: { color: 'white' },
  errorBox: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5', padding: 10, borderRadius: 10, marginBottom: 16 },
  errorText: { color: '#B91C1C', fontSize: 13, fontWeight: '500' },
  label: { fontSize: 13, fontWeight: '500', color: '#444', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 16, color: '#1A1A1A' },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingRight: 6, marginBottom: 16 },
  passwordInput: { flex: 1, padding: 14, fontSize: 15, color: '#1A1A1A' },
  eyeButton: { padding: 10 },
  eyeIcon: { fontSize: 16 },
  optionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  rememberRow: { flexDirection: 'row', alignItems: 'center' },
  rememberText: { fontSize: 13, color: '#666', marginLeft: 4 },
  forgotText: { fontSize: 13, color: '#4A5D4E', fontWeight: '600' },
  loginButton: { backgroundColor: '#4A5D4E', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  loginButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  divider: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  orText: { marginHorizontal: 12, fontSize: 10, color: '#888', fontWeight: '600', letterSpacing: 0.5 },
  socialRow: { flexDirection: 'row', justifyContent: 'center' },
  quickAccessBtn: { 
    paddingVertical: 10, 
    paddingHorizontal: 16, 
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA'
  },
  quickAccessText: { fontSize: 12, color: '#4B5563', fontWeight: '500' },
  footer: { alignItems: 'center', marginTop: 24 },
  footerText: { fontSize: 12, color: '#888' }
});
