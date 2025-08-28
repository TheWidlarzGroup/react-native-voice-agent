import { StyleSheet } from 'react-native';

export const demoStyles = StyleSheet.create({
  demoContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  demoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  demoDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  buttonContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  statusCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  statusTextGray: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  controlsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  controlButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  controlButtonDisabled: {
    backgroundColor: '#ccc',
  },
  controlButtonActive: {
    backgroundColor: '#34C759',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  conversationLog: {
    marginTop: 20,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  logScrollView: {
    maxHeight: 200,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  logEntry: {
    marginBottom: 12,
    padding: 8,
    borderRadius: 6,
  },
  logEntryUser: {
    backgroundColor: '#e3f2fd',
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  logEntryAssistant: {
    backgroundColor: '#f3e5f5',
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  logEntryType: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 2,
  },
  logEntryText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  logEntryTime: {
    fontSize: 10,
    color: '#888',
    textAlign: 'right',
  },
  logEntryThinking: {
    backgroundColor: '#fff3cd',
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  logEntryThinkingText: {
    fontStyle: 'italic',
    color: '#856404',
  },
  promptGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  promptButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  promptButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  promptButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  promptButtonTextActive: {
    color: 'white',
  },
  currentPromptContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  currentPromptTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  currentPromptText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  // Online example specific styles
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  providerContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  providerButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  providerButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  providerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  providerButtonTextActive: {
    color: 'white',
  },
  modelContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  modelButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  modelButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  modelButtonText: {
    fontSize: 12,
    color: '#333',
  },
  modelButtonTextActive: {
    color: 'white',
  },
  modelDescription: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  modelDescriptionActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: 'white',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ffeaa7',
  },
  infoText: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusReady: {
    backgroundColor: '#34C759',
  },
  statusPending: {
    backgroundColor: '#FF9500',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  conversationContainer: {
    flex: 1,
    marginBottom: 16,
  },
  conversation: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  messageContainer: {
    marginBottom: 12,
    padding: 10,
    borderRadius: 8,
    maxWidth: '80%',
  },
  userMessage: {
    backgroundColor: '#e3f2fd',
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    backgroundColor: '#f3e5f5',
    alignSelf: 'flex-start',
  },
  thinkingMessage: {
    backgroundColor: '#fff3cd',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 14,
    color: '#333',
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  recordButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  recordButtonActive: {
    backgroundColor: '#FF3B30',
  },
  recordButtonDisabled: {
    backgroundColor: '#ccc',
  },
  recordButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recordButtonTextActive: {
    color: 'white',
  },
  clearButton: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  clearButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  statusBar: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
});
