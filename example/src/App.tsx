import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { BasicExample, AdvancedExample, CustomExample } from './components';
import { useVoiceAgent } from './hooks/useVoiceAgent';
import { appStyles } from './styles/appStyles';
import type { DemoType } from './types';

export default function App() {
  const [currentDemo, setCurrentDemo] = useState<DemoType>('basic');
  const agent = useVoiceAgent();

  const renderCurrentDemo = () => {
    switch (currentDemo) {
      case 'basic':
        return <BasicExample agent={agent} />;
      case 'advanced':
        return <AdvancedExample agent={agent} />;
      case 'custom':
        return <CustomExample agent={agent} />;
      default:
        return <BasicExample agent={agent} />;
    }
  };

  return (
    <SafeAreaView style={appStyles.container}>
      <View style={appStyles.header}>
        <Text style={appStyles.title}>React Native Voice Agent</Text>
        <Text style={appStyles.subtitle}>Offline AI Voice Assistant Demo</Text>
      </View>

      <View style={appStyles.tabContainer}>
        <TouchableOpacity
          style={[
            appStyles.tab,
            currentDemo === 'basic' && appStyles.activeTab,
          ]}
          onPress={() => setCurrentDemo('basic')}
        >
          <Text
            style={[
              appStyles.tabText,
              currentDemo === 'basic' && appStyles.activeTabText,
            ]}
          >
            Basic
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            appStyles.tab,
            currentDemo === 'advanced' && appStyles.activeTab,
          ]}
          onPress={() => setCurrentDemo('advanced')}
        >
          <Text
            style={[
              appStyles.tabText,
              currentDemo === 'advanced' && appStyles.activeTabText,
            ]}
          >
            Advanced
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            appStyles.tab,
            currentDemo === 'custom' && appStyles.activeTab,
          ]}
          onPress={() => setCurrentDemo('custom')}
        >
          <Text
            style={[
              appStyles.tabText,
              currentDemo === 'custom' && appStyles.activeTabText,
            ]}
          >
            Custom
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={appStyles.content}
        contentContainerStyle={appStyles.contentContainer}
      >
        {renderCurrentDemo()}
      </ScrollView>
    </SafeAreaView>
  );
}
