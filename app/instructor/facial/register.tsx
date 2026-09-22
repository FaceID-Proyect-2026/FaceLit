import InstructorEnrollment from '@/features/facial/components/InstructorEnrollment';
import { router } from 'expo-router';
import { Routes } from '@/shared/constants/routes';
import { ScrollView, Text, TouchableOpacity } from 'react-native';

export default function InstructorFacialRegisterScreen() {
  return <ScrollView style={{ flex: 1, backgroundColor: '#091511' }} contentContainerStyle={{ flexGrow: 1, paddingTop: 24 }}>
    <TouchableOpacity onPress={() => router.replace(Routes.FACIAL.MANAGEMENT as any)} style={{ padding: 20 }}>
      <Text style={{ color: 'white' }}>Volver</Text>
    </TouchableOpacity>
    <InstructorEnrollment />
  </ScrollView>;
}
