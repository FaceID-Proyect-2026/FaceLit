import InstructorEnrollment from '@/features/facial/components/InstructorEnrollment';
import { router } from 'expo-router';
import { ScrollView, Text, TouchableOpacity } from 'react-native';

export default function ApprenticeFacialScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#091511' }} contentContainerStyle={{ flexGrow: 1, paddingTop: 24 }}>
      <TouchableOpacity onPress={() => router.replace('/apprentice')} style={{ padding: 20 }}>
        <Text style={{ color: 'white' }}>Volver</Text>
      </TouchableOpacity>
      <InstructorEnrollment />
    </ScrollView>
  );
}
