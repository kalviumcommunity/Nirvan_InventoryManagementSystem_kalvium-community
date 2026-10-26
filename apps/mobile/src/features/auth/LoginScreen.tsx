import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Switch, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { API_URL } from '../../store/mockData';

interface LoginScreenProps {
  terminalId?: string;
  onLogin: (email: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  terminalId = 'Terminal 07',
  onLogin
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const userEmail = email.trim() || 'name@rentory.supply';
    setSubmitting(true);
    try {
      const endpoint = isLoginTab ? `${API_URL}/auth/login` : `${API_URL}/auth/signup`;
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          password: password,
          terminal_id: terminalId
        })
      });
    } catch (e) {
      console.log('Auth API offline, continuing with local session:', e);
    } finally {
      setSubmitting(false);
      onLogin(userEmail);
    }
  };

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

        <View style={styles.formContainer}>
          {/* Tabs */}
          <View style={styles.tabContainer}>
             <TouchableOpacity style={[styles.tab, isLoginTab && styles.activeTab]} onPress={() => setIsLoginTab(true)}>
               <Text style={[styles.tabText, isLoginTab && styles.activeTabText]}>Log In</Text>
             </TouchableOpacity>
             <TouchableOpacity style={[styles.tab, !isLoginTab && styles.activeTab]} onPress={() => setIsLoginTab(false)}>
               <Text style={[styles.tabText, !isLoginTab && styles.activeTabText]}>Sign Up</Text>
             </TouchableOpacity>
          </View>

          {/* Inputs */}
          <Text style={styles.label}>Work Email</Text>
          <TextInput 
             style={styles.input} 
             placeholder="name@rentory.supply" 
             placeholderTextColor="#A0A0A0"
             value={email}
             onChangeText={setEmail}
             autoCapitalize="none"
             keyboardType="email-address"
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput 
              style={styles.passwordInput} 
              placeholder="••••••••••••" 
              placeholderTextColor="#A0A0A0"
              secureTextEntry 
              value={password}
              onChangeText={setPassword}
            />
            <Text style={styles.eyeIcon}>👁️</Text>
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
             <TouchableOpacity>
               <Text style={styles.forgotText}>Forgot password?</Text>
             </TouchableOpacity>
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
                 {isLoginTab ? 'Log In to Inventory →' : 'Sign Up →'}
               </Text>
             )}
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.orText}>OR ACCESS WITH</Text>
            <View style={styles.divider} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity style={styles.socialIcon}><Text>👤</Text></TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}><Text>👆</Text></TouchableOpacity>
            <TouchableOpacity style={styles.socialIcon}><Text>🔑</Text></TouchableOpacity>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>🔒 Secured warehouse & fleet ledger</Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  logo: { fontSize: 16, fontWeight: '600', color: '#1A1A1A', marginRight: 8 },
  terminalBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFEFEF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  terminalDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#888', marginRight: 6 },
  terminalText: { fontSize: 12, color: '#666', fontWeight: '500' },
  welcomeText: { fontSize: 28, fontWeight: '600', color: '#1A1A1A', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 32 },
  formContainer: { backgroundColor: 'white', padding: 16, borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#F0F0F0', borderRadius: 12, padding: 4, marginBottom: 24 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { backgroundColor: '#4A5D4E' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#666' },
  activeTabText: { color: 'white' },
  label: { fontSize: 13, fontWeight: '500', color: '#444', marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, padding: 14, fontSize: 15, marginBottom: 20, color: '#1A1A1A' },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 10, paddingRight: 14, marginBottom: 20 },
  passwordInput: { flex: 1, padding: 14, fontSize: 15, color: '#1A1A1A' },
  eyeIcon: { color: '#888' },
  optionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  rememberRow: { flexDirection: 'row', alignItems: 'center' },
  rememberText: { fontSize: 13, color: '#666', marginLeft: 4 },
  forgotText: { fontSize: 13, color: '#4A5D4E', fontWeight: '600' },
  loginButton: { backgroundColor: '#4A5D4E', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 24 },
  loginButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  divider: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  orText: { marginHorizontal: 12, fontSize: 11, color: '#888', fontWeight: '600', letterSpacing: 0.5 },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  socialIcon: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center' },
  footer: { alignItems: 'center', marginTop: 40 },
  footerText: { fontSize: 12, color: '#888' }
});
