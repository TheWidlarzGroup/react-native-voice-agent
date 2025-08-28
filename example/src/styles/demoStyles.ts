import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
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
  statusText: {
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
});
